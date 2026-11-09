import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { setSelectedGroup } from "../redux/groupSlice";
import { clearUnreadCount } from "../redux/messageSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { IoCheckmarkDoneSharp, IoCheckmarkSharp, IoChevronForward } from "react-icons/io5";
import { getActiveUserStatus } from "../utils/statusHelper";

// Clean preview text for sidebar
const formatPreviewText = (text) => {
  if (!text) return "";
  if (text.includes("[REEL_SHARE:")) {
    const m = text.match(/\[REEL_SHARE:(\{.*?\})\]/);
    if (m) {
      try {
        const p = JSON.parse(m[1]);
        return `🎬 Reel by @${p.creatorName || "Creator"}`;
      } catch (e) {}
    }
    return "🎬 Shared a Reel";
  }
  if (text.includes("🎬 Watch this Reel")) return "🎬 Shared a Reel";
  if (text.includes("[STATUS_REPLY:")) return "💬 Replied to status";
  if (text.includes("[STATUS_REACT:")) return "❤️ Reacted to status";
  return text;
};

const OtherUser = ({ user }) => {
  const dispatch = useDispatch();
  const { selectedUser, onlineUsers, typingUsers, userStatuses } = useSelector((store) => store.user);
  const { unreadCounts, lastMessages } = useSelector((store) => store.message);

  const isSelected = selectedUser?._id === user?._id;
  const activeStatus = getActiveUserStatus(user, onlineUsers, userStatuses);
  const isOnline = activeStatus === "Online";
  const isAway = activeStatus === "Away";
  const isUserTyping = Boolean(typingUsers?.[user?._id]);

  const unreadCount = unreadCounts?.[user?._id] || 0;
  const lastMsg = lastMessages?.[user?._id];

  const selectedUserHandler = () => {
    dispatch(setSelectedUser(user));
    dispatch(setSelectedGroup(null));
    if (unreadCount > 0) {
      dispatch(clearUnreadCount(user?._id));
    }
  };

  const statusLabel = isOnline ? "online" : isAway ? "away" : "offline";
  const formattedTime = lastMsg?.time
    ? new Date(lastMsg.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : statusLabel;

  return (
    <div
      onClick={selectedUserHandler}
      className={`mx-3 my-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 select-none relative flex items-center gap-3 border shadow-xs group ${
        isSelected
          ? "bg-[#111e3b] border-blue-500/80 shadow-[0_0_15px_rgba(37,99,235,0.25)] ring-1 ring-blue-500/30"
          : unreadCount > 0
          ? "bg-[#0d1629]/95 hover:bg-[#131f3a] border-blue-900/40 hover:border-blue-700/50"
          : "bg-[#0c1325]/85 hover:bg-[#111b33] border-[#182442] hover:border-[#223358]"
      }`}
    >
      {/* Avatar with single active status badge */}
      <div className="relative shrink-0">
        <img
          src={getAvatarUrl(user)}
          alt="user-profile"
          className="w-12 h-12 rounded-full object-cover border border-[#1e2c4f] shadow-xs"
          onError={(e) => handleImageError(e, user?.fullName)}
        />
        {/* Strictly ONE active status badge */}
        {isOnline ? (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#22c55e] border-2 border-[#0c1325] rounded-full shadow-[0_0_6px_rgba(34,197,94,0.7)]" title="Online" />
        ) : isAway ? (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-400 border-2 border-[#0c1325] rounded-full shadow-[0_0_6px_rgba(251,191,36,0.7)]" title="Away" />
        ) : (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-gray-500 border-2 border-[#0c1325] rounded-full" title="Offline" />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4
            className={`text-[15px] tracking-wide truncate ${
              unreadCount > 0
                ? "font-bold text-white"
                : "font-semibold text-[#f1f5f9]"
            }`}
          >
            {user?.fullName}
          </h4>
          <span
            className={`text-[11px] shrink-0 ml-1 font-medium ${
              unreadCount > 0
                ? "text-[#38bdf8] font-bold"
                : isOnline
                ? "text-[#38bdf8]"
                : isAway
                ? "text-amber-400"
                : "text-[#64748b]"
            }`}
          >
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`text-[13px] truncate pr-2 flex items-center gap-1 ${
              unreadCount > 0
                ? "text-white font-medium"
                : "text-[#8ea2c6]"
            }`}
          >
            {isUserTyping ? (
              <span className="text-[#38bdf8] font-semibold italic text-xs animate-pulse">
                typing...
              </span>
            ) : lastMsg ? (
              <>
                {lastMsg.isMe && (
                  lastMsg.seen ? (
                    <IoCheckmarkDoneSharp className="text-[#38bdf8] text-sm shrink-0 inline" title="Read" />
                  ) : lastMsg.delivered ? (
                    <IoCheckmarkDoneSharp className="text-[#64748b] text-sm shrink-0 inline" title="Delivered" />
                  ) : (
                    <IoCheckmarkSharp className="text-[#64748b] text-sm shrink-0 inline" title="Sent" />
                  )
                )}
                <span className="truncate">{formatPreviewText(lastMsg.text)}</span>
              </>
            ) : (
              <span className="truncate">{statusLabel === "online" ? "Online now" : statusLabel}</span>
            )}
          </p>

          {/* Unread Message Count Badge */}
          {unreadCount > 0 && (
            <span className="shrink-0 bg-[#22c55e] text-[#050814] text-[11px] font-black px-2 min-w-[20px] h-5 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Right chevron > matching screenshot */}
      <IoChevronForward className="text-[#4b5e86] text-base shrink-0 group-hover:text-[#38bdf8] group-hover:translate-x-0.5 transition-all" />
    </div>
  );
};

export default OtherUser;
