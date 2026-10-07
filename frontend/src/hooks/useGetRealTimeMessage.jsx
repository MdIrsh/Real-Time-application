import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMessage,
  incrementUnreadCount,
  setLastMessage,
  clearUnreadCount,
  markMessagesSeen,
} from "../redux/messageSlice";
import {
  setSelectedUser,
  setUserTyping,
  updateUserProfilePhoto,
} from "../redux/userSlice";
import { addGroupMessage, setSelectedGroup } from "../redux/groupSlice";
import { triggerMessageNotification } from "../utils/notificationService";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import toast from "react-hot-toast";

const useGetRealTimeMessage = () => {
  const { socket } = useSelector((store) => store.socket);
  const { selectedUser, otherUsers, authUser } = useSelector(
    (store) => store.user
  );
  const { selectedGroup, groups } = useSelector((store) => store.group);
  const dispatch = useDispatch();

  // Use refs to avoid re-subscribing socket listener on every state change
  const selectedUserRef = useRef(selectedUser);
  const otherUsersRef = useRef(otherUsers);
  const authUserRef = useRef(authUser);
  const selectedGroupRef = useRef(selectedGroup);
  const groupsRef = useRef(groups);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    otherUsersRef.current = otherUsers;
  }, [otherUsers]);

  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (!newMessage) return;

      const currentAuthUser = authUserRef.current;
      const currentSelectedUser = selectedUserRef.current;
      const currentOtherUsers = otherUsersRef.current || [];

      // Extract sender ID
      const senderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId?._id
          : newMessage.senderId;

      // Ignore messages sent by ourselves
      if (
        currentAuthUser?._id &&
        String(currentAuthUser._id) === String(senderId)
      ) {
        return;
      }

      // Find sender details
      const senderDetails =
        newMessage.sender ||
        currentOtherUsers.find((u) => String(u._id) === String(senderId)) || {
          _id: senderId,
          fullName: "New Contact",
          username: "user",
          profilePhoto: "",
        };

      const senderName = senderDetails.fullName || "Someone";
      const messageText =
        newMessage.message ||
        (newMessage.image ? "📷 Photo" : "New message");

      const isCurrentChatActive =
        currentSelectedUser?._id &&
        String(currentSelectedUser._id) === String(senderId);

      if (isCurrentChatActive) {
        // Active chat is open: add directly to messages list
        dispatch(addMessage(newMessage));
        // Immediately notify sender that message has been seen (turns ticks Blue)
        socket.emit("markAsSeen", { senderId });
      } else {
        // Chat is not currently open: increment unread count & show toast
        dispatch(incrementUnreadCount(senderId));

        // Display WhatsApp-style interactive toast
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                dispatch(setSelectedUser(senderDetails));
                dispatch(clearUnreadCount(senderId));
                socket.emit("markAsSeen", { senderId });
                toast.dismiss(t.id);
              }}
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex items-center p-3.5 cursor-pointer hover:bg-gray-50 transition-all border border-gray-200/80 border-l-4 border-l-emerald-500 gap-3`}
            >
              {/* Sender Avatar */}
              <div className="relative shrink-0">
                <img
                  src={getAvatarUrl(senderDetails)}
                  alt={senderName}
                  className="w-11 h-11 rounded-full object-cover border border-gray-200"
                  onError={(e) => handleImageError(e, senderName)}
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#111b21] truncate">
                    {senderName}
                  </h4>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded">
                    Now
                  </span>
                </div>
                <p className="text-xs text-[#54656f] truncate mt-0.5">
                  {messageText}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setSelectedUser(senderDetails));
                  dispatch(clearUnreadCount(senderId));
                  socket.emit("markAsSeen", { senderId });
                  toast.dismiss(t.id);
                }}
                className="shrink-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Reply
              </button>
            </div>
          ),
          { duration: 4500, position: "top-right" }
        );
      }

      // Clear typing indicator for this sender when message is received
      dispatch(setUserTyping({ userId: senderId, isTyping: false }));

      // Update last message preview for this sender
      dispatch(
        setLastMessage({
          userId: senderId,
          text: messageText,
          time: newMessage.createdAt || new Date().toISOString(),
          isMe: false,
        })
      );

      // Trigger audio chime, tab title alert, and OS Desktop Notification
      triggerMessageNotification({
        senderName,
        senderAvatar: getAvatarUrl(senderDetails),
        messageText,
        isCurrentChatActive,
        onClick: () => {
          dispatch(setSelectedUser(senderDetails));
          dispatch(clearUnreadCount(senderId));
          socket.emit("markAsSeen", { senderId });
        },
      });
    };

    // When the other user sees our messages, update ticks to Double Blue Tick!
    const handleMessagesSeen = ({ seenBy }) => {
      dispatch(markMessagesSeen(seenBy));
    };

    // When the other user starts or stops typing
    const handleUserTyping = ({ userId, isTyping }) => {
      dispatch(setUserTyping({ userId, isTyping }));
    };

    // When a friend or user updates their profile photo or name
    const handleUserProfileUpdated = (data) => {
      if (data?.userId) {
        dispatch(updateUserProfilePhoto(data));
      }
    };

    // When someone posts in a group we belong to
    const handleNewGroupMessage = ({ groupId, message }) => {
      if (!message) return;
      const currentAuthUser = authUserRef.current;
      const senderId =
        typeof message.senderId === "object"
          ? message.senderId?._id
          : message.senderId;

      if (currentAuthUser?._id && String(currentAuthUser._id) === String(senderId)) {
        return;
      }

      dispatch(addGroupMessage(message));

      const currentSelectedGroup = selectedGroupRef.current;
      const isCurrentGroupActive =
        currentSelectedGroup?._id && String(currentSelectedGroup._id) === String(groupId);

      const senderName = message.senderId?.fullName || "Group Member";
      const groupObj = (groupsRef.current || []).find(
        (g) => String(g._id) === String(groupId)
      );
      const groupName = groupObj?.name || "Group";

      if (!isCurrentGroupActive) {
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                if (groupObj) {
                  dispatch(setSelectedGroup(groupObj));
                  dispatch(setSelectedUser(null));
                }
                toast.dismiss(t.id);
              }}
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-sm w-full bg-[#111b21] text-white shadow-2xl rounded-2xl pointer-events-auto flex items-center p-3.5 cursor-pointer hover:bg-[#202c33] transition-all border border-[#25d366]/40 border-l-4 border-l-[#25d366] gap-3`}
            >
              <div className="w-10 h-10 rounded-full bg-[#103629] text-[#25d366] flex items-center justify-center text-lg shrink-0 border border-[#25d366]/50">
                👥
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-[#e9edef] truncate">
                    {groupName}
                  </h4>
                  <span className="text-[10px] text-[#25d366] font-semibold uppercase tracking-wider bg-[#103629] px-1.5 py-0.5 rounded">
                    Group
                  </span>
                </div>
                <p className="text-xs text-[#8696a0] truncate mt-0.5">
                  <span className="font-semibold text-gray-200">{senderName}: </span>
                  {message.message || (message.image ? "📷 Photo" : "🎤 Voice message")}
                </p>
              </div>
            </div>
          ),
          { duration: 4500, position: "top-right" }
        );

        triggerMessageNotification({
          senderName: `${senderName} in ${groupName}`,
          messageText: message.message || "New group message",
          isCurrentChatActive: false,
          onClick: () => {
            if (groupObj) {
              dispatch(setSelectedGroup(groupObj));
              dispatch(setSelectedUser(null));
            }
          },
        });
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("userTyping", handleUserTyping);
    socket.on("userProfileUpdated", handleUserProfileUpdated);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("userTyping", handleUserTyping);
      socket.off("userProfileUpdated", handleUserProfileUpdated);
    };
  }, [socket, dispatch]);
};

export default useGetRealTimeMessage;
