import { useEffect } from 'react';
import axios from "axios";
import {useDispatch} from "react-redux";
import { setOtherUsers } from "../redux/userSlice";


const DEMO_USERS = [
  {
    _id: "demo-contact-1",
    fullName: "Rahul Sharma",
    username: "rahul",
    gender: "male",
    profilePhoto: ""
  },
  {
    _id: "demo-contact-2",
    fullName: "Priya Patel",
    username: "priya",
    gender: "female",
    profilePhoto: ""
  },
  {
    _id: "demo-contact-3",
    fullName: "Aman Verma",
    username: "aman",
    gender: "male",
    profilePhoto: ""
  },
  {
    _id: "demo-contact-4",
    fullName: "Sneha Reddy",
    username: "sneha",
    gender: "female",
    profilePhoto: ""
  }
];

const useGetOtherUsers = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        axios.defaults.withCredentials = true;
        const res = await axios.get(`http://localhost:5000/api/v1/user/`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          dispatch(setOtherUsers(res.data));
        } else {
          dispatch(setOtherUsers(DEMO_USERS));
        }
      } catch (error) {
        console.log("Backend offline, using demo contacts:", error);
        dispatch(setOtherUsers(DEMO_USERS));
      }
    };
    fetchOtherUsers();
  }, [dispatch]);
};

export default useGetOtherUsers
