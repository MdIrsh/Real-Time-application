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
import { BASE_URL } from './config/api';
import useGetRealTimeMessage from './hooks/useGetRealTimeMessage';
import { CallProvider } from './context/CallContext';

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

  // Listen to incoming real-time socket messages and notifications
  useGetRealTimeMessage();

  useEffect(() => {
    if (authUser?._id) {
      const socket = io(BASE_URL, {
        query: {
          userId: authUser._id,
        },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ["websocket", "polling"],
      });
      dispatch(setSocket(socket));

      socket.on("getOnlineUsers", (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      // Mobile phone screen wake / tab switch auto-reconnect
      const handleVisibility = () => {
        if (document.visibilityState === "visible") {
          if (!socket.connected) {
            socket.connect();
          }
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      window.addEventListener("focus", handleVisibility);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        window.removeEventListener("focus", handleVisibility);
        socket.close();
      };
    } else {
      dispatch(setSocket(null));
    }
  }, [authUser, dispatch]);


  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#f0f2f5]">
      <CallProvider>
        <RouterProvider router={router} />
      </CallProvider>
    </div>
  );
}

export default App;
