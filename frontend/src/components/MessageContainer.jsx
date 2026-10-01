import React, { useState, useEffect } from "react";
import SendInput from "./SendInput";
import Messages from "./Messages";
import CallModal from "./CallModal";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { setMessages } from "../redux/messageSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { MetaAiRing } from "../utils/metaAi";
import {
  IoChevronBack,
  IoCallOutline,
  IoVideocamOutline,
  IoEllipsisVertical,
  IoLockClosed,
  IoShieldCheckmark,
  IoTrashOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import { BsChatSquareDots } from "react-icons/bs";
import toast from "react-hot-toast";

const MessageContainer = () => {
  const { selectedUser, authUser, onlineUsers } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState("audio");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    return () => dispatch(setSelectedUser(null));
  }, [dispatch]);

  const handleStartCall = (type) => {
    setCallType(type);
    setCallModalOpen(true);
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

  const isMetaAi = selectedUser?._id === "meta-ai";
  const isOnline = isMetaAi || onlineUsers?.includes(selectedUser?._id);

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
                <span className="hidden sm:inline">1</span>
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
                  {isMetaAi ? (
                    <span className="text-blue-600 font-medium">with Llama 3 • AI Assistant</span>
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
                onClick={() => handleStartCall("video")}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#007aff] hover:bg-gray-200 active:scale-95 transition-all"
                title="Video Call"
              >
                <IoVideocamOutline className="text-2xl" />
              </button>

              {/* Audio / Phone Call Icon */}
              <button
                onClick={() => handleStartCall("audio")}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#007aff] hover:bg-gray-200 active:scale-95 transition-all"
                title="Voice Call"
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

          {/* Bottom Send Input Bar */}
          <div className="shrink-0">
            <SendInput />
          </div>

          {/* Call Modal */}
          <CallModal
            isOpen={callModalOpen}
            onClose={() => setCallModalOpen(false)}
            user={selectedUser}
            authUser={authUser}
            callType={callType}
          />
        </div>
      ) : (
        /* Empty State / WhatsApp Web Splash */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#f0f2f5] border-b-[6px] border-emerald-500 p-8 text-center select-none">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
            <BsChatSquareDots className="text-5xl" />
          </div>
          <h2 className="text-3xl font-light text-[#41525d] mb-3">
            WhatsApp Web
          </h2>
          <p className="text-sm text-[#667781] max-w-md leading-relaxed mb-8">
            Send and receive messages seamlessly. Select a chat from the left or chat with <strong>Meta AI</strong> for answers, coding help, and instant assistance.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
            <IoLockClosed className="text-xs" />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageContainer;
