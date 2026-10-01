import Signup from './components/Signup';
import Login from './components/Login';
import HomePage from './components/HomePage';
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from "socket.io-client";
import { setSocket } from './redux/socketSlice';
import { setOnlineUsers } from './redux/userSlice';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

function App() {
  
  const {authUser} = useSelector(store=>store.user);
  const dispatch=useDispatch();

  useEffect(()=>{
    if(authUser) {
      const socket = io('http://localhost:5000', {
        query:{
          userId: authUser?._id
        }
      });
      dispatch(setSocket(socket));
      socket.on('getOnlineUsers',(onlineUsers)=>{
        dispatch(setOnlineUsers(onlineUsers));
      });
      return () => {
        socket.close();
      };
    } else {
      dispatch(setSocket(null));
    }
  },[authUser, dispatch]);


  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#f0f2f5]">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
