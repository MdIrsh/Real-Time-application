import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setGroups, addGroup } from "../redux/groupSlice";
import { BASE_URL } from "../config/api";

const useGetMyGroups = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);

  useEffect(() => {
    if (!authUser?._id) return;

    const fetchGroups = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/v1/group/all`, {
          withCredentials: true,
        });
        if (res.data?.success && res.data.groups) {
          dispatch(setGroups(res.data.groups));

          // Join socket chat rooms for each group to receive real-time updates
          if (socket) {
            res.data.groups.forEach((grp) => {
              socket.emit("joinGroupChat", { groupId: grp._id });
            });
          }
        }
      } catch (err) {
        console.error("fetchGroups error:", err);
      }
    };

    fetchGroups();
  }, [authUser, socket, dispatch]);

  // Listen to newGroupCreated event via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewGroup = (newGroup) => {
      if (!newGroup) return;
      dispatch(addGroup(newGroup));
      socket.emit("joinGroupChat", { groupId: newGroup._id });
    };

    socket.on("newGroupCreated", handleNewGroup);

    return () => {
      socket.off("newGroupCreated", handleNewGroup);
    };
  }, [socket, dispatch]);
};

export default useGetMyGroups;
