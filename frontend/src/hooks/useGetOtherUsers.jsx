import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setOtherUsers } from "../redux/userSlice";
import { BASE_URL } from "../config/api";

const useGetOtherUsers = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        axios.defaults.withCredentials = true;
        const res = await axios.get(`${BASE_URL}/api/v1/user/`);
        if (Array.isArray(res.data)) {
          dispatch(setOtherUsers(res.data));
        } else {
          dispatch(setOtherUsers([]));
        }
      } catch (error) {
        console.log("Failed to fetch friends:", error);
        dispatch(setOtherUsers([]));
      }
    };

    fetchFriends();
  }, [dispatch]);
};

export default useGetOtherUsers;
