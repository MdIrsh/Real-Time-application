import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { clearUnreadCount } from "../redux/messageSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { IoCheckmarkDoneSharp, IoCheckmarkSharp } from "react-icons/io5";

const OtherUser = ({ user }) => {
  const dispatch = useDispatch();
  const { selectedUser, onlineUsers } = useSelector((store) => store.user);
  const { unreadCounts, lastMessages } = useSelector((store) => store.message);

  const isSelected = selectedUser?._id === user?._id;
  const isOnline = onlineUsers?.includes(user?._id);

  const unreadCount = unreadCounts?.[user?._id] || 0;
  const lastMsg = lastMessages?.[user?._id];

  const selectedUserHandler = () => {
    dispatch(setSelectedUser(user));
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
      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors border-b border-gray-100 select-none relative ${
        isSelected
          ? "bg-[#f0f2f5]"
          : unreadCount > 0
          ? "bg-emerald-50/40 hover:bg-emerald-50/70"
          : "hover:bg-[#f5f6f6] bg-white"
      }`}
    >
      {/* Avatar with status */}
      <div className="relative shrink-0">
        <img
          src={getAvatarUrl(user)}
          alt="user-profile"
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
          onError={(e) => handleImageError(e, user?.fullName)}
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4
            className={`text-[15px] truncate ${
              unreadCount > 0
                ? "font-bold text-[#111b21]"
                : "font-semibold text-[#111b21]"
            }`}
          >
            {user?.fullName}
          </h4>
          <span
            className={`text-[11px] shrink-0 ml-1 ${
              unreadCount > 0
                ? "text-emerald-600 font-semibold"
                : isOnline
                ? "text-emerald-500 font-medium"
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
                ? "text-[#111b21] font-semibold"
                : "text-[#667781]"
            }`}
          >
            {lastMsg ? (
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
                <span className="truncate">{lastMsg.text}</span>
              </>
            ) : (
              <span>@{user?.username}</span>
            )}
          </p>

          {/* Unread Message Count Badge */}
          {unreadCount > 0 && (
            <span className="shrink-0 bg-[#25d366] text-white text-[11px] font-bold px-1.5 min-w-[20px] h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherUser;
