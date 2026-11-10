import React, { useState } from "react";
import SendInput from "./SendInput";
import Messages from "./Messages";
import GroupInfoModal from "./GroupInfoModal";
import { useCall } from "../context/CallContext";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser, setUserStatus } from "../redux/userSlice";
import { setMessages } from "../redux/messageSlice";
import {
  setSelectedGroup,
  setGroupMessages,
  updateGroupPinned,
} from "../redux/groupSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { MetaAiRing } from "../utils/metaAi";
import { openGroupCall } from "../redux/groupCallSlice";
import { getActiveUserStatus, STATUS_OPTIONS } from "../utils/statusHelper";
import {
  IoArrowBack,
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
  const { authUser, selectedUser, otherUsers, onlineUsers, typingUsers, userStatuses } =
    useSelector((store) => store.user);
  const { selectedGroup } = useSelector((store) => store.group);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();
  const { startCall } = useCall();

  const [showMenu, setShowMenu] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  // Status change handler from chat screen menu
  const handleMyStatusChange = async (newStatus) => {
    if (!authUser?._id) return;
    dispatch(setUserStatus({ userId: authUser._id, userStatus: newStatus }));
    if (socket && socket.connected) {
      socket.emit("changeUserStatus", { userStatus: newStatus });
    }
    try {
      axios.defaults.withCredentials = true;
      await axios.put(
        `${BASE_URL}/api/v1/user/profile/status`,
        { userStatus: newStatus },
        { withCredentials: true }
      );
      toast.success(`Status updated to ${newStatus} ✨`);
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

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
    const otherMembers = (selectedGroup.participants || []).filter(
      (p) => String(p?._id || p) !== String(authUser?._id)
    );
    dispatch(
      openGroupCall({
        roomId,
        callType,
        groupId: selectedGroup._id,
        roomTitle: `${selectedGroup.name} (${callType === "video" ? "Video" : "Voice"} Call)`,
        invitedMembers: otherMembers.filter((m) => typeof m === "object"),
      })
    );

    // Broadcast single unified invite (server notifies all group members & multi-tab sockets)
    if (socket && authUser?._id) {
      socket.emit("inviteToGroupCall", {
        groupId: selectedGroup._id,
        toUserIds: otherMembers.map((p) => p?._id || p).filter(Boolean),
        roomId,
        fromUser: authUser,
        callType,
        roomTitle: selectedGroup.name,
      });
      toast.success(`Group ${callType === "video" ? "Video" : "Voice"} Call ringing for ${selectedGroup.name} members! 👥📞`);
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

  const handleUnpinMessage = async () => {
    if (!selectedGroup?._id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${BASE_URL}/api/v1/group/pin/${selectedGroup._id}`,
        { messageId: null },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      dispatch(
        updateGroupPinned({
          groupId: selectedGroup._id,
          pinnedMessage: res.data?.pinnedMessage || null,
        })
      );
      toast.success("Pinned message removed");
    } catch (err) {
      toast.error("Failed to unpin message");
    }
  };

  const scrollToPinnedMessage = () => {
    const msgId = selectedGroup?.pinnedMessage?.messageId;
    if (!msgId) return;
    const targetEl = document.getElementById(`msg-${msgId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("ring-2", "ring-[#2563eb]", "transition-all");
      setTimeout(() => {
        targetEl.classList.remove("ring-2", "ring-[#2563eb]");
      }, 1500);
    }
  };

  const activeStatus = getActiveUserStatus(selectedUser, onlineUsers, userStatuses);
  const isOnline = activeStatus === "Online";
  const isAway = activeStatus === "Away";
  const isTyping = Boolean(selectedUser?._id && typingUsers?.[selectedUser._id]);

  const hasActiveChat = Boolean(selectedUser || selectedGroup);

  return (
    <>
      {hasActiveChat ? (
        <div className="flex-1 flex flex-col h-full bg-[#edf3fc] relative min-w-0 overflow-hidden">
          {/* Royal Blue Wave Header matching screenshot */}
          <div className="bg-gradient-to-r from-[#0d47a1] via-[#1565c0] to-[#1e88e5] px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-md z-20 select-none shrink-0 relative">
            {/* Decorative Blue Wave Background Layer (clipped inside absolute wrapper so dropdown is never clipped) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  background:
                    "radial-gradient(circle at 20% -30%, rgba(56,189,248,0.55) 0%, transparent 55%), radial-gradient(circle at 85% 130%, rgba(14,165,233,0.45) 0%, transparent 60%)",
                }}
              />
              <svg
                className="absolute inset-0 w-full h-full opacity-25"
                viewBox="0 0 600 80"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M0 60 C 180 10, 350 90, 600 20 L 600 0 L 0 0 Z"
                  fill="rgba(255,255,255,0.22)"
                />
              </svg>
            </div>

            {/* Left: Back button + Avatar + Name + Subtitle */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 relative z-10">
              <button
                onClick={closeChatHandler}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition active:scale-95 cursor-pointer shrink-0"
                title="Back to chats"
              >
                <IoArrowBack className="text-xl" />
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
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/70 flex items-center justify-center text-lg font-bold text-white shadow-sm">
                      {selectedGroup.groupAvatar && selectedGroup.groupAvatar.length <= 4
                        ? selectedGroup.groupAvatar
                        : selectedGroup.name?.charAt(0)?.toUpperCase() || "👥"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22c55e] text-white rounded-full flex items-center justify-center text-[9px] border border-white">
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
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-xs"
                        onError={(e) => handleImageError(e, selectedUser?.fullName)}
                      />
                      {/* Exactly ONE active status badge dot */}
                      {isOnline ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-white rounded-full shadow-xs" title="Online" />
                      ) : isAway ? (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-400 border-2 border-white rounded-full shadow-xs" title="Away" />
                      ) : (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full shadow-xs" title="Offline" />
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
                    <h3 className="text-white font-semibold text-base leading-tight truncate">
                      {selectedGroup.name}
                    </h3>
                    <span className="text-[10px] text-white bg-white/20 px-1.5 py-0.2 rounded font-bold shrink-0">
                      Group
                    </span>
                  </div>
                  <span className="text-xs text-blue-100 leading-tight truncate flex items-center gap-1.5">
                    {(() => {
                      const parts = selectedGroup.participants || [];
                      const onlineCount = parts.filter((p) => {
                        const pid = typeof p === "string" ? p : p?._id;
                        return pid === authUser?._id || onlineUsers?.includes(pid);
                      }).length;
                      return (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block shrink-0" />
                          <span>
                            {parts.length} members • Online {onlineCount}
                          </span>
                        </>
                      );
                    })()}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-white font-semibold text-base leading-tight truncate">
                      {selectedUser?.fullName}
                    </h3>
                    {isMetaAi && (
                      <IoShieldCheckmark className="text-sky-200 text-sm shrink-0" />
                    )}
                  </div>
                  <span className="text-xs leading-tight">
                    {isTyping ? (
                      <span className="text-white font-semibold flex items-center gap-1 animate-pulse">
                        typing...
                      </span>
                    ) : isMetaAi ? (
                      <span className="text-blue-100 font-medium">
                        with Llama 3 • AI Assistant
                      </span>
                    ) : !isAcceptedFriend ? (
                      <span className="text-amber-200 font-medium">
                        Connection pending
                      </span>
                    ) : isOnline ? (
                      <span className="text-blue-50 font-medium">Online</span>
                    ) : isAway ? (
                      <span className="text-amber-200 font-medium">Away</span>
                    ) : (
                      <span className="text-blue-200/80">Offline</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Calling icons & more (Video, Phone, 3-dots) matching screenshot */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative z-10">
              {selectedGroup ? (
                /* Group Chat Calling Icons */
                <>
                  {/* Group Video Call */}
                  <button
                    onClick={() => handleStartGroupCallRoom("video")}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition active:scale-95 cursor-pointer"
                    title="Start Group Video Call 👥📹"
                  >
                    <IoVideocamOutline className="text-2xl" />
                  </button>

                  {/* Group Voice Call */}
                  <button
                    onClick={() => handleStartGroupCallRoom("audio")}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition active:scale-95 cursor-pointer"
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
                        ? "text-white hover:bg-white/15 active:scale-95 cursor-pointer"
                        : "text-white/40 cursor-not-allowed"
                    }`}
                    title={
                      isAcceptedFriend
                        ? "Video Call"
                        : "Calling locked (Accept friend request first)"
                    }
                  >
                    <IoVideocamOutline className="text-2xl" />
                  </button>

                  {/* Audio / Phone Call Icon */}
                  <button
                    disabled={!isAcceptedFriend}
                    onClick={() => handleStartCall("audio")}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isAcceptedFriend
                        ? "text-white hover:bg-white/15 active:scale-95 cursor-pointer"
                        : "text-white/40 cursor-not-allowed"
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors cursor-pointer"
                  title="More options"
                >
                  <IoEllipsisVertical className="text-lg" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-blue-100 py-1.5 z-40 text-sm">
                    {/* User's own status switcher from chat screen */}
                    <div className="px-3 py-2 border-b border-gray-100 bg-blue-50/50 select-none">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          My Status
                        </span>
                        <span className="text-[10px] font-bold text-[#1d4ed8]">
                          {userStatuses?.[authUser?._id] || authUser?.userStatus || "Online"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {STATUS_OPTIONS.map((opt) => {
                          const isActive =
                            (userStatuses?.[authUser?._id] || authUser?.userStatus || "Online") === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                handleMyStatusChange(opt.id);
                                setShowMenu(false);
                              }}
                              className={`py-1 px-1 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                                isActive
                                  ? "bg-[#1d4ed8] text-white shadow-xs font-bold"
                                  : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${opt.dotClass}`} />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!selectedGroup && isAcceptedFriend && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleStartGroupCallFromDirect();
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50/60 flex items-center gap-2 cursor-pointer"
                      >
                        <IoPeopleOutline className="text-[#1d4ed8]" />
                        <span>Start Group Call Room</span>
                      </button>
                    )}

                    {selectedGroup && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setIsGroupInfoOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50/60 flex items-center gap-2 cursor-pointer"
                      >
                        <IoInformationCircleOutline className="text-[#1d4ed8]" />
                        <span>Group Info</span>
                      </button>
                    )}

                    <button
                      onClick={clearChatHandler}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50/60 flex items-center gap-2 cursor-pointer"
                    >
                      <IoTrashOutline className="text-red-500" />
                      <span>Clear Chat</span>
                    </button>

                    {selectedGroup && (
                      <button
                        onClick={handleLeaveGroup}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <IoLogOutOutline />
                        <span>Leave Group</span>
                      </button>
                    )}

                    <button
                      onClick={closeChatHandler}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50/60 flex items-center gap-2 cursor-pointer"
                    >
                      <IoCloseCircleOutline />
                      <span>Close Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Group Pinned Message Banner */}
          {selectedGroup?.pinnedMessage?.messageId && (
            <div
              onClick={scrollToPinnedMessage}
              className="bg-[#f0f6ff] hover:bg-[#e5f0ff] border-b border-blue-100/90 px-4 py-2 flex items-center justify-between gap-3 cursor-pointer transition-colors shrink-0 shadow-2xs select-none"
              title="Jump to pinned message"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[#1d4ed8] text-base shrink-0 leading-none">
                  📌
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#1d4ed8] leading-tight">
                    Pinned Message
                  </p>
                  <p className="text-[13px] text-[#334155] truncate leading-snug">
                    {selectedGroup.pinnedMessage.text || "Pinned message"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnpinMessage();
                }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#64748b] hover:text-[#1e293b] hover:bg-blue-100 transition shrink-0 cursor-pointer text-xs font-bold"
                title="Unpin message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Area with Soft Sky-Blue Doodle Wallpaper */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col chat-sky-bg">
            <Messages />
          </div>

          {/* Bottom Send Input Bar or Locked Notice */}
          <div className="shrink-0">
            {selectedGroup || isAcceptedFriend ? (
              <SendInput />
            ) : (
              <div className="bg-[#f4f7fc] p-3 text-center border-t border-blue-100 text-xs text-gray-600 flex items-center justify-center gap-2 select-none">
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
        /* Empty State / Desktop & Tablet Splash in Dark Aurora Theme */
        <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-[#050814] border-b-[4px] border-[#2563eb] p-6 lg:p-10 text-center select-none text-[#e9edef] relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(37,99,235,0.22) 0%, transparent 60%)",
            }}
          />
          <div className="relative mb-5">
            <img
              src="/irshad_3d_signature_transparent.png"
              alt="Irshad 3D Signature"
              className="h-20 lg:h-28 w-auto object-contain filter drop-shadow-[0_0_25px_rgba(234,179,8,0.45)]"
              style={{ mixBlendMode: "screen" }}
            />
          </div>
          {/* 3D Cursive Official Messenger Main Brand Title */}
          <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-3 flex-wrap relative">
            <span className="text-3d-official text-3xl lg:text-5xl font-bold tracking-wide">
              Official Messenger
            </span>
            <span
              className="badge-3d-verified inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-black shrink-0 transform hover:rotate-12 transition-transform cursor-pointer"
              title="Verified Official Messenger"
            >
              ✓
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8ea2c6] max-w-md leading-relaxed mb-8 relative">
            Send and receive messages privately. Create Groups, start Audio/Video Group Calls, watch Reels &amp; Status, and chat with <strong className="text-white">Meta AI</strong> anytime.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#64748b] relative">
            <IoLockClosed className="text-xs text-[#38bdf8]" />
            <span>End-to-end encrypted • Private connections only</span>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageContainer;
