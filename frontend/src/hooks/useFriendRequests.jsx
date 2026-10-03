import { useEffect, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  setFriendRequests,
  addReceivedRequest,
  removeReceivedRequest,
  removeSentRequest,
  addFriend,
} from "../redux/userSlice";
import { BASE_URL } from "../config/api";
import toast from "react-hot-toast";
import { triggerMessageNotification } from "../utils/notificationService";

const useFriendRequests = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);

  const fetchRequests = useCallback(async () => {
    if (!authUser) return;
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(`${BASE_URL}/api/v1/user/requests`);
      if (res.data) {
        dispatch(setFriendRequests(res.data));
      }
    } catch (error) {
      console.log("Error fetching friend requests:", error);
    }
  }, [authUser, dispatch]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Socket listener for incoming friend requests and accepted requests
  useEffect(() => {
    if (!socket) return;

    const handleNewFriendRequest = (data) => {
      dispatch(addReceivedRequest(data));
      const senderName = data.sender?.fullName || "Someone";
      toast.success(`👋 ${senderName} sent you a friend request!`, {
        duration: 5000,
      });
      triggerMessageNotification({
        senderName: "New Friend Request",
        messageText: `${senderName} wants to connect with you.`,
        isCurrentChatActive: false,
      });
    };

    const handleFriendRequestAccepted = (data) => {
      if (data?.friend) {
        dispatch(addFriend(data.friend));
        toast.success(`🎉 ${data.friend.fullName} accepted your request! You can now chat and call.`, {
          duration: 5000,
        });
        triggerMessageNotification({
          senderName: "Request Accepted!",
          messageText: `${data.friend.fullName} is now your friend.`,
          isCurrentChatActive: false,
        });
      }
    };

    socket.on("newFriendRequest", handleNewFriendRequest);
    socket.on("friendRequestAccepted", handleFriendRequestAccepted);

    return () => {
      socket.off("newFriendRequest", handleNewFriendRequest);
      socket.off("friendRequestAccepted", handleFriendRequestAccepted);
    };
  }, [socket, dispatch]);

  const sendRequest = async (targetUserId) => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(
        `${BASE_URL}/api/v1/user/request/send/${targetUserId}`
      );
      if (res.data?.status === "accepted" && res.data?.friend) {
        dispatch(addFriend(res.data.friend));
        toast.success("Connected! You are now friends.");
      } else {
        toast.success(res.data?.message || "Friend request sent!");
      }
      fetchRequests();
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to send request.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(
        `${BASE_URL}/api/v1/user/request/accept/${requestId}`
      );
      dispatch(removeReceivedRequest(requestId));
      if (res.data?.friend) {
        dispatch(addFriend(res.data.friend));
      }
      toast.success("Request accepted! Added to your chats.");
      return { success: true, friend: res.data?.friend };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to accept request.";
      toast.error(msg);
      return { success: false };
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      axios.defaults.withCredentials = true;
      await axios.post(`${BASE_URL}/api/v1/user/request/reject/${requestId}`);
      dispatch(removeReceivedRequest(requestId));
      toast("Friend request declined.", { icon: "👋" });
      return { success: true };
    } catch (error) {
      toast.error("Failed to decline request.");
      return { success: false };
    }
  };

  const cancelRequest = async (requestId) => {
    try {
      axios.defaults.withCredentials = true;
      await axios.post(`${BASE_URL}/api/v1/user/request/cancel/${requestId}`);
      dispatch(removeSentRequest(requestId));
      toast.success("Request cancelled.");
      return { success: true };
    } catch (error) {
      toast.error("Failed to cancel request.");
      return { success: false };
    }
  };

  return {
    fetchRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  };
};

export default useFriendRequests;
