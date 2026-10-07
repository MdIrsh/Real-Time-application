import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedGroup } from "../redux/groupSlice";
import { setSelectedUser } from "../redux/userSlice";
import { IoPeople } from "react-icons/io5";

const GroupItem = ({ group }) => {
  const dispatch = useDispatch();
  const { selectedGroup } = useSelector((store) => store.group);

  const isSelected = selectedGroup?._id === group?._id;
  const participantCount = group?.participants?.length || 0;
  const lastMsg = group?.lastMessage;

  const formattedTime = lastMsg?.time
    ? new Date(lastMsg.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  const handleSelectGroup = (e) => {
    if (e) {
      e.stopPropagation();
    }
    dispatch(setSelectedGroup(group));
    dispatch(setSelectedUser(null));
  };

  return (
    <div
      onClick={handleSelectGroup}
      role="button"
      tabIndex={0}
      className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors border-b border-[#202c33]/50 select-none relative active:bg-[#202c33] ${
        isSelected
          ? "bg-[#202c33]"
          : "hover:bg-[#202c33]/60 bg-[#0b141a]"
      }`}
    >
      {/* Group Avatar / Icon Badge */}
      <div className="relative shrink-0">
        {group?.groupAvatar &&
        (group.groupAvatar.startsWith("data:image") ||
          group.groupAvatar.startsWith("http")) ? (
          <img
            src={group.groupAvatar}
            alt={group.name}
            className="w-12 h-12 rounded-full object-cover border border-[#202c33]"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#103629] to-[#00a884]/30 border border-[#25d366]/40 flex items-center justify-center text-xl text-[#25d366] shadow-inner font-bold">
            {group?.groupAvatar && group.groupAvatar.length <= 4
              ? group.groupAvatar
              : group?.name?.charAt(0)?.toUpperCase() || "👥"}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#103629] text-[#25d366] border border-[#0b141a] flex items-center justify-center text-[10px]">
          <IoPeople size={10} />
        </span>
      </div>

      {/* Group Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-[15px] font-semibold text-[#e9edef] truncate">
              {group?.name}
            </h4>
            <span className="text-[10px] text-[#25d366] bg-[#103629] px-1.5 py-0.2 rounded font-bold shrink-0">
              {participantCount}
            </span>
          </div>
          <span className="text-[11px] text-[#8696a0] shrink-0 ml-1">
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[13px] text-[#8696a0] truncate pr-2">
            {lastMsg?.text ? (
              <>
                <span className="font-semibold text-gray-300">
                  {lastMsg.senderName ? `${lastMsg.senderName}: ` : ""}
                </span>
                <span>{lastMsg.text}</span>
              </>
            ) : (
              <span>Tap to chat in this group</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupItem;
