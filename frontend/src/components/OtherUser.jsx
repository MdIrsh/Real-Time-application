import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";

const OtherUser = ({ user }) => {
  const dispatch = useDispatch();
  const { selectedUser, onlineUsers } = useSelector((store) => store.user);

  const isSelected = selectedUser?._id === user?._id;
  const isOnline = onlineUsers?.includes(user?._id);

  const selectedUserHandler = () => {
    dispatch(setSelectedUser(user));
  };

  return (
    <div
      onClick={selectedUserHandler}
      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors border-b border-gray-100 select-none ${
        isSelected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6] bg-white"
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
          <h4 className="text-[15px] font-semibold text-[#111b21] truncate">
            {user?.fullName}
          </h4>
          <span className="text-[11px] text-[#8696a0]">
            {isOnline ? "online" : ""}
          </span>
        </div>
        <p className="text-[13px] text-[#667781] truncate">
          @{user?.username}
        </p>
      </div>
    </div>
  );
};

export default OtherUser;
