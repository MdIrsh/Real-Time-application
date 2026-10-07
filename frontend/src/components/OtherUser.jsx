import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { setSelectedGroup } from "../redux/groupSlice";
import { clearUnreadCount } from "../redux/messageSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { IoCheckmarkDoneSharp, IoCheckmarkSharp } from "react-icons/io5";

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
  const { selectedUser, onlineUsers, typingUsers } = useSelector((store) => store.user);
  const { unreadCounts, lastMessages } = useSelector((store) => store.message);

  const isSelected = selectedUser?._id === user?._id;
  const isOnline = onlineUsers?.includes(user?._id);
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

  const formattedTime = lastMsg?.time
    ? new Date(lastMsg.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : isOnline
    ? "online"
    : "";

  return (
    <div
      onClick={selectedUserHandler}
      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors border-b border-[#202c33]/50 select-none relative ${
        isSelected
          ? "bg-[#202c33]"
          : unreadCount > 0
          ? "bg-[#111b21] hover:bg-[#202c33]/60"
          : "hover:bg-[#202c33]/60 bg-[#0b141a]"
      }`}
    >
      {/* Avatar with status */}
      <div className="relative shrink-0">
        <img
          src={getAvatarUrl(user)}
          alt="user-profile"
          className="w-12 h-12 rounded-full object-cover border border-[#202c33]"
          onError={(e) => handleImageError(e, user?.fullName)}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25d366] border-2 border-[#0b141a] rounded-full"></span>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4
            className={`text-[15px] truncate ${
              unreadCount > 0
                ? "font-bold text-[#e9edef]"
                : "font-semibold text-[#e9edef]"
            }`}
          >
            {user?.fullName}
          </h4>
          <span
            className={`text-[11px] shrink-0 ml-1 ${
              unreadCount > 0
                ? "text-[#25d366] font-semibold"
                : isOnline
                ? "text-[#25d366] font-medium"
                : "text-[#8696a0]"
            }`}
          >
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`text-[13px] truncate pr-2 flex items-center gap-1 ${
              unreadCount > 0
                ? "text-[#e9edef] font-medium"
                : "text-[#8696a0]"
            }`}
          >
            {isUserTyping ? (
              <span className="text-[#25d366] font-semibold italic text-xs animate-pulse">
                typing...
              </span>
            ) : lastMsg ? (
              <>
                {lastMsg.isMe && (
                  lastMsg.seen ? (
                    <IoCheckmarkDoneSharp className="text-[#53bdeb] text-sm shrink-0 inline" title="Read" />
                  ) : lastMsg.delivered ? (
                    <IoCheckmarkDoneSharp className="text-[#8696a0] text-sm shrink-0 inline" title="Delivered" />
                  ) : (
                    <IoCheckmarkSharp className="text-[#8696a0] text-sm shrink-0 inline" title="Sent" />
                  )
                )}
                <span className="truncate">{formatPreviewText(lastMsg.text)}</span>
              </>
            ) : (
              <span>@{user?.username}</span>
            )}
          </p>

          {/* Unread Message Count Badge */}
          {unreadCount > 0 && (
            <span className="shrink-0 bg-[#25d366] text-[#0b141a] text-[11px] font-extrabold px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUser;
