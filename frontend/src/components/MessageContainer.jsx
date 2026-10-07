import React, { useState, useEffect } from "react";
import SendInput from "./SendInput";
import Messages from "./Messages";
import { useCall } from "../context/CallContext";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { setMessages } from "../redux/messageSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { MetaAiRing } from "../utils/metaAi";
import { openGroupCall } from "../redux/groupCallSlice";
import {
  IoChevronBack,
  IoCallOutline,
  IoVideocamOutline,
  IoPeopleOutline,
  IoEllipsisVertical,
  IoLockClosed,
  IoShieldCheckmark,
  IoTrashOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import toast from "react-hot-toast";

const MessageContainer = () => {
  const { authUser, selectedUser, otherUsers, onlineUsers, typingUsers } =
    useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();
  const { startCall } = useCall();

  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    return () => dispatch(setSelectedUser(null));
  }, [dispatch]);

  const isMetaAi = selectedUser?._id === "meta-ai";
  // Accepted friend verification: must be Meta AI or in accepted friends list (otherUsers)
  const isAcceptedFriend =
    isMetaAi ||
    Boolean(otherUsers?.some((u) => u._id === selectedUser?._id));

  const handleStartCall = (type) => {
    if (!isAcceptedFriend) {
      toast.error("🔒 Calling is locked until friend request is accepted!");
      return;
    }
    startCall({ user: selectedUser, type });
  };

  const handleStartGroupCall = () => {
    if (!isAcceptedFriend) {
      toast.error("🔒 Group call is locked until friend request is accepted!");
      return;
    }
    const roomId = `room-${Date.now().toString(36)}`;
    dispatch(
      openGroupCall({
        roomId,
        callType: "video",
        roomTitle: `Group Call with ${selectedUser?.fullName}`,
      })
    );
    if (socket && selectedUser?._id && authUser?._id) {
      socket.emit("inviteToGroupCall", {
        toUserId: selectedUser._id,
        roomId,
        fromUser: authUser,
        callType: "video",
      });
      toast.success(`Started Group Call & invited ${selectedUser.fullName}! 👥`);
    }
  };

  const clearChatHandler = () => {
    if (selectedUser?._id === "meta-ai") {
      localStorage.removeItem("meta_ai_chat_history");
    }
    dispatch(setMessages([]));
    setShowMenu(false);
    toast.success("Chat history cleared!");
  };

  const closeChatHandler = () => {
    dispatch(setSelectedUser(null));
    setShowMenu(false);
  };

  const isOnline = isMetaAi || onlineUsers?.includes(selectedUser?._id);
  const isTyping = Boolean(selectedUser?._id && typingUsers?.[selectedUser._id]);

  return (
    <>
      {selectedUser ? (
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0 overflow-hidden">
          {/* Header */}
          <div className="bg-[#f0f2f5] px-3 sm:px-4 py-2 flex items-center justify-between border-b border-gray-200 shadow-sm z-10 select-none shrink-0 relative">
            {/* Left: Back button + Avatar + Name + Status */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => dispatch(setSelectedUser(null))}
                className="flex items-center text-[#007aff] hover:opacity-80 transition-opacity pr-1 text-sm font-medium"
                title="Back to chats"
              >
                <IoChevronBack className="text-2xl" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Avatar with live online badge */}
              <div className="relative shrink-0">
                {isMetaAi ? (
                  <MetaAiRing size="w-10 h-10" />
                ) : (
                  <>
                    <img
                      src={getAvatarUrl(selectedUser)}
                      alt="user"
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      onError={(e) => handleImageError(e, selectedUser?.fullName)}
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </>
                )}
              </div>

              {/* User Name & Status */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[#111b21] font-semibold text-base leading-tight truncate">
                    {selectedUser?.fullName}
                  </h3>
                  {isMetaAi && (
                    <IoShieldCheckmark className="text-[#0064e0] text-sm shrink-0" />
                  )}
                </div>
                <span className="text-xs text-[#667781] leading-tight">
                  {isTyping ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1 animate-pulse">
                      typing...
                    </span>
                  ) : isMetaAi ? (
                    <span className="text-blue-600 font-medium">
                      with Llama 3 • AI Assistant
                    </span>
                  ) : !isAcceptedFriend ? (
                    <span className="text-amber-600 font-medium">
                      Connection pending
                    </span>
                  ) : isOnline ? (
                    <span className="text-emerald-600 font-medium">online</span>
                  ) : (
                    "last seen recently"
                  )}
                </span>
              </div>
            </div>

            {/* Right: Calling icons & more */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Video Call Icon */}
              <button
                disabled={!isAcceptedFriend}
                onClick={() => handleStartCall("video")}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isAcceptedFriend
                    ? "text-[#007aff] hover:bg-gray-200 active:scale-95"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                }`}
                title={
                  isAcceptedFriend
                    ? "Video Call"
                    : "Calling locked (Accept friend request first)"
                }
              >
                <IoVideocamOutline className="text-2xl" />
              </button>

              {/* Group Call Room Icon */}
              <button
                disabled={!isAcceptedFriend}
                onClick={handleStartGroupCall}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isAcceptedFriend
                    ? "text-[#007aff] hover:bg-gray-200 active:scale-95"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                }`}
                title={
                  isAcceptedFriend
                    ? "Start Group Call Room 👥"
                    : "Calling locked (Accept friend request first)"
                }
              >
                <IoPeopleOutline className="text-2xl" />
              </button>

              {/* Audio / Phone Call Icon */}
              <button
                disabled={!isAcceptedFriend}
                onClick={() => handleStartCall("audio")}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isAcceptedFriend
                    ? "text-[#007aff] hover:bg-gray-200 active:scale-95"
                    : "text-gray-400 cursor-not-allowed opacity-50"
                }`}
                title={
                  isAcceptedFriend
                    ? "Voice Call"
                    : "Calling locked (Accept friend request first)"
                }
              >
                <IoCallOutline className="text-xl" />
              </button>

              {/* More options menu button */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#54656f] hover:bg-gray-200 transition-colors"
                  title="More options"
                >
                  <IoEllipsisVertical className="text-lg" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-40 text-sm">
                    <button
                      onClick={clearChatHandler}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <IoTrashOutline className="text-red-500" />
                      <span>Clear Chat</span>
                    </button>
                    <button
                      onClick={closeChatHandler}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <IoCloseCircleOutline />
                      <span>Close Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area with WhatsApp doodle background */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col whatsapp-chat-bg">
            <Messages />
          </div>

          {/* Bottom Send Input Bar or Locked Notice */}
          <div className="shrink-0">
            {isAcceptedFriend ? (
              <SendInput />
            ) : (
              <div className="bg-[#f0f2f5] p-3 text-center border-t border-gray-200 text-xs text-gray-600 flex items-center justify-center gap-2 select-none">
                <IoLockClosed className="text-amber-600 text-sm" />
                <span>
                  Messaging and calling are locked until this friend request is accepted.
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State / WhatsApp Web Splash in Dark Mode */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#111b21] border-b-[6px] border-[#00a884] p-8 text-center select-none text-[#e9edef]">
          <div className="relative mb-6">
            <img
              src="/irshad_3d_signature_transparent.png"
              alt="Irshad 3D Signature"
              className="h-24 sm:h-28 w-auto object-contain filter drop-shadow-[0_0_25px_rgba(234,179,8,0.45)]"
              style={{ mixBlendMode: "screen" }}
            />
          </div>
          <h2 className="text-2xl font-bold text-[#e9edef] mb-2 tracking-wide flex items-center justify-center gap-2">
            <span>Official Messenger</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1d9bf0] text-white text-[10px] font-black shadow-[0_0_8px_rgba(29,155,240,0.6)]">
              ✓
            </span>
          </h2>
          <p className="text-sm text-[#8696a0] max-w-md leading-relaxed mb-8">
            Send and receive messages privately. Watch Reels & Status, and chat with <strong>Meta AI</strong> anytime for instant help.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
            <IoLockClosed className="text-xs text-[#00a884]" />
            <span>End-to-end encrypted • Private connections only</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageContainer;
