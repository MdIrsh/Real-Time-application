import React, { useState } from "react";
import SendInput from "./SendInput";
import Messages from "./Messages";
import GroupInfoModal from "./GroupInfoModal";
import { useCall } from "../context/CallContext";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { setMessages } from "../redux/messageSlice";
import { setSelectedGroup, setGroupMessages } from "../redux/groupSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { MetaAiRing } from "../utils/metaAi";
import { openGroupCall } from "../redux/groupCallSlice";
import {
  IoChevronBack,
  IoCallOutline,
  IoVideocamOutline,
  IoPeopleOutline,
  IoPeople,
  IoEllipsisVertical,
  IoLockClosed,
  IoShieldCheckmark,
  IoTrashOutline,
  IoCloseCircleOutline,
  IoInformationCircleOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import toast from "react-hot-toast";
import axios from "axios";
import { BASE_URL } from "../config/api";

const MessageContainer = () => {
  const { authUser, selectedUser, otherUsers, onlineUsers, typingUsers } =
    useSelector((store) => store.user);
  const { selectedGroup } = useSelector((store) => store.group);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();
  const { startCall } = useCall();

  const [showMenu, setShowMenu] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const isMetaAi = selectedUser?._id === "meta-ai";
  // Accepted friend verification: must be Meta AI or in accepted friends list (otherUsers)
  const isAcceptedFriend =
    isMetaAi ||
    Boolean(otherUsers?.some((u) => u._id === selectedUser?._id));

  // 1-on-1 Call handler
  const handleStartCall = (type) => {
    if (!isAcceptedFriend) {
      toast.error("🔒 Calling is locked until friend request is accepted!");
      return;
    }
    startCall({ user: selectedUser, type });
  };

  // 1-on-1 launch group call
  const handleStartGroupCallFromDirect = () => {
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

  // Group Call Room Handler for all Group participants
  const handleStartGroupCallRoom = (callType = "video") => {
    if (!selectedGroup) return;
    const roomId = `room-group-${selectedGroup._id}`;
    dispatch(
      openGroupCall({
        roomId,
        callType,
        roomTitle: `${selectedGroup.name} (${callType === "video" ? "Video" : "Voice"} Call)`,
      })
    );

    // Broadcast invite to all participants in this group who are online
    if (socket && selectedGroup.participants) {
      selectedGroup.participants.forEach((p) => {
        const pId = p._id || p;
        if (pId && String(pId) !== String(authUser?._id)) {
          socket.emit("inviteToGroupCall", {
            toUserId: pId,
            roomId,
            fromUser: authUser,
            callType,
            roomTitle: selectedGroup.name,
          });
        }
      });
      toast.success(`Group Call ringing for ${selectedGroup.name} members! 👥📞`);
    }
  };

  const clearChatHandler = () => {
    if (selectedGroup) {
      dispatch(setGroupMessages([]));
      toast.success("Group chat view cleared!");
    } else {
      if (selectedUser?._id === "meta-ai") {
        localStorage.removeItem("meta_ai_chat_history");
      }
      dispatch(setMessages([]));
      toast.success("Chat history cleared!");
    }
    setShowMenu(false);
  };

  const closeChatHandler = () => {
    dispatch(setSelectedUser(null));
    dispatch(setSelectedGroup(null));
    setShowMenu(false);
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm(`Are you sure you want to leave "${selectedGroup.name}"?`))
      return;
    try {
      await axios.post(
        `${BASE_URL}/api/v1/group/leave/${selectedGroup._id}`,
        {},
        { withCredentials: true }
      );
      toast.success("Left group successfully");
      dispatch(setSelectedGroup(null));
      setShowMenu(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave group");
    }
  };

  const isOnline = isMetaAi || onlineUsers?.includes(selectedUser?._id);
  const isTyping = Boolean(selectedUser?._id && typingUsers?.[selectedUser._id]);

  const hasActiveChat = Boolean(selectedUser || selectedGroup);

  return (
    <>
      {hasActiveChat ? (
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0 overflow-hidden">
          {/* Header */}
          <div className="bg-[#f0f2f5] px-3 sm:px-4 py-2 flex items-center justify-between border-b border-gray-200 shadow-sm z-10 select-none shrink-0 relative">
            {/* Left: Back button + Avatar + Name + Subtitle */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={closeChatHandler}
                className="flex items-center text-[#007aff] hover:opacity-80 transition-opacity pr-1 text-sm font-medium"
                title="Back to chats"
              >
                <IoChevronBack className="text-2xl" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Group View Avatar vs User View Avatar */}
              {selectedGroup ? (
                <div
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="relative shrink-0 cursor-pointer"
                >
                  {selectedGroup.groupAvatar &&
                  (selectedGroup.groupAvatar.startsWith("data:image") ||
                    selectedGroup.groupAvatar.startsWith("http")) ? (
                    <img
                      src={selectedGroup.groupAvatar}
                      alt={selectedGroup.name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#103629] border border-[#25d366]/40 flex items-center justify-center text-lg font-bold text-[#25d366] shadow-sm">
                      {selectedGroup.groupAvatar && selectedGroup.groupAvatar.length <= 4
                        ? selectedGroup.groupAvatar
                        : selectedGroup.name?.charAt(0)?.toUpperCase() || "👥"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#103629] text-[#25d366] rounded-full flex items-center justify-center text-[9px] border border-white">
                    <IoPeople size={9} />
                  </span>
                </div>
              ) : (
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
              )}

              {/* Title & Subtitle */}
              {selectedGroup ? (
                <div
                  onClick={() => setIsGroupInfoOpen(true)}
                  className="flex flex-col min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[#111b21] font-semibold text-base leading-tight truncate">
                      {selectedGroup.name}
                    </h3>
                    <span className="text-[10px] text-[#25d366] bg-[#103629] px-1.5 py-0.2 rounded font-bold shrink-0">
                      Group
                    </span>
                  </div>
                  <span className="text-xs text-[#667781] leading-tight truncate">
                    {selectedGroup.participants
                      ? `${selectedGroup.participants.length} members: ${selectedGroup.participants
                          .map((p) => p.fullName || p.username || "Member")
                          .slice(0, 3)
                          .join(", ")}${
                          selectedGroup.participants.length > 3 ? "..." : ""
                        }`
                      : "Tap for group details"}
                  </span>
                </div>
              ) : (
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
              )}
            </div>

            {/* Right: Calling icons & more */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {selectedGroup ? (
                /* Group Chat Calling Icons */
                <>
                  {/* Group Video Call */}
                  <button
                    onClick={() => handleStartGroupCallRoom("video")}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#007aff] hover:bg-gray-200 transition active:scale-95"
                    title="Start Group Video Call 👥📹"
                  >
                    <IoVideocamOutline className="text-2xl" />
                  </button>

                  {/* Group Voice Call */}
                  <button
                    onClick={() => handleStartGroupCallRoom("audio")}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#007aff] hover:bg-gray-200 transition active:scale-95"
                    title="Start Group Voice Call 👥📞"
                  >
                    <IoCallOutline className="text-xl" />
                  </button>
                </>
              ) : (
                /* 1-on-1 Calling Icons */
                <>
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
                    onClick={handleStartGroupCallFromDirect}
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
                </>
              )}

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
                    {selectedGroup && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setIsGroupInfoOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <IoInformationCircleOutline className="text-[#00a884]" />
                        <span>Group Info</span>
                      </button>
                    )}

                    <button
                      onClick={clearChatHandler}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <IoTrashOutline className="text-red-500" />
                      <span>Clear Chat</span>
                    </button>

                    {selectedGroup && (
                      <button
                        onClick={handleLeaveGroup}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <IoLogOutOutline />
                        <span>Leave Group</span>
                      </button>
                    )}

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
            {selectedGroup || isAcceptedFriend ? (
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

          {/* Group Details Modal */}
          <GroupInfoModal
            isOpen={isGroupInfoOpen}
            onClose={() => setIsGroupInfoOpen(false)}
          />
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
            Send and receive messages privately. Create Groups, start Audio/Video Group Calls, watch Reels & Status, and chat with <strong>Meta AI</strong> anytime.
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
