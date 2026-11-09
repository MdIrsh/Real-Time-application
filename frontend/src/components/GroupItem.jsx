import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedGroup } from "../redux/groupSlice";
import { setSelectedUser } from "../redux/userSlice";
import { IoPeople, IoChevronForward } from "react-icons/io5";

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
      className={`mx-3 my-1.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 select-none relative flex items-center gap-3 border shadow-xs group ${
        isSelected
          ? "bg-[#111e3b] border-blue-500/80 shadow-[0_0_15px_rgba(37,99,235,0.25)] ring-1 ring-blue-500/30"
          : "bg-[#0c1325]/85 hover:bg-[#111b33] border-[#182442] hover:border-[#223358]"
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
            className="w-12 h-12 rounded-full object-cover border border-[#1e2c4f] shadow-xs"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0f2240] to-[#1e3a8a] border border-[#2563eb]/40 flex items-center justify-center text-xl text-[#38bdf8] shadow-inner font-bold">
            {group?.groupAvatar && group.groupAvatar.length <= 4
              ? group.groupAvatar
              : group?.name?.charAt(0)?.toUpperCase() || "👥"}
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#10b981] text-[#050814] border border-[#0c1325] flex items-center justify-center text-[10px] font-black shadow-xs">
          <IoPeople size={10} />
        </span>
      </div>

      {/* Group Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-[15px] font-semibold text-[#f1f5f9] tracking-wide truncate">
              {group?.name}
            </h4>
            <span className="text-[10px] text-[#050814] bg-[#22c55e] px-1.5 py-0.2 rounded-full font-black shrink-0 shadow-xs">
              {participantCount}
            </span>
          </div>
          <span className="text-[11px] text-[#64748b] shrink-0 ml-1 font-medium">
            {formattedTime}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[13px] text-[#8ea2c6] truncate pr-2">
            {lastMsg?.text ? (
              <>
                <span className="font-semibold text-white">
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

      {/* Right chevron > */}
      <IoChevronForward className="text-[#4b5e86] text-base shrink-0 group-hover:text-[#38bdf8] group-hover:translate-x-0.5 transition-all" />
    </div>
  );
};

export default GroupItem;
