import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setGroupMessages } from "../redux/groupSlice";
import { BASE_URL } from "../config/api";

const useGetGroupMessages = () => {
  const dispatch = useDispatch();
  const { selectedGroup } = useSelector((store) => store.group);
  const { socket } = useSelector((store) => store.socket);

  useEffect(() => {
    if (!selectedGroup?._id) return;

    if (socket) {
      socket.emit("joinGroupChat", { groupId: selectedGroup._id });
    }

    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/api/v1/group/messages/${selectedGroup._id}`,
          { withCredentials: true }
        );
        if (res.data?.success && res.data.messages) {
          dispatch(setGroupMessages(res.data.messages));
        }
      } catch (err) {
        console.error("fetchGroupMessages error:", err);
      }
    };

    fetchMessages();

    return () => {
      if (socket && selectedGroup?._id) {
        socket.emit("leaveGroupChat", { groupId: selectedGroup._id });
      }
    };
  }, [selectedGroup?._id, socket, dispatch]);
};

export default useGetGroupMessages;
