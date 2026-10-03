import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMessage,
  incrementUnreadCount,
  setLastMessage,
  clearUnreadCount,
  markMessagesSeen,
} from "../redux/messageSlice";
import { setSelectedUser, setUserTyping } from "../redux/userSlice";
import { triggerMessageNotification } from "../utils/notificationService";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import toast from "react-hot-toast";

const useGetRealTimeMessage = () => {
  const { socket } = useSelector((store) => store.socket);
  const { selectedUser, otherUsers, authUser } = useSelector(
    (store) => store.user
  );
  const dispatch = useDispatch();

  // Use refs to avoid re-subscribing socket listener on every state change
  const selectedUserRef = useRef(selectedUser);
  const otherUsersRef = useRef(otherUsers);
  const authUserRef = useRef(authUser);

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

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("userTyping", handleUserTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("userTyping", handleUserTyping);
    };
  }, [socket, dispatch]);
};

export default useGetRealTimeMessage;
