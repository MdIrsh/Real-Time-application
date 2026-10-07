import React from "react";
import OtherUser from "./OtherUser";
import GroupItem from "./GroupItem";
import useGetOtherUsers from "../hooks/useGetOtherUsers";
import useGetMyGroups from "../hooks/useGetMyGroups";
import { useSelector, useDispatch } from "react-redux";
import { setIsCreateGroupOpen } from "../redux/groupSlice";
import {
  IoPersonAddOutline,
  IoShieldCheckmarkOutline,
  IoPeople,
  IoAdd,
} from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";

const OtherUsers = ({ search = "", onOpenAddModal, activeFilter = "all" }) => {
  useGetOtherUsers();
  useGetMyGroups();

  const dispatch = useDispatch();
  const { otherUsers, authUser, onlineUsers } = useSelector((store) => store.user);
  const { groups } = useSelector((store) => store.group);
  const { unreadCounts } = useSelector((store) => store.message);

  if (otherUsers === null) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-[#8696a0] text-xs bg-[#0b141a]">
        <div className="w-5 h-5 border-2 border-[#25d366] border-t-transparent rounded-full animate-spin mb-2"></div>
        <span>Loading chats...</span>
      </div>
    );
  }

  // Filter groups
  const filteredGroups = (groups || []).filter((group) => {
    if (!search.trim()) return true;
    return (
      group.name?.toLowerCase().includes(search.toLowerCase()) ||
      group.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Filter users
  const filteredUsers = (otherUsers || []).filter((user) => {
    // Search match
    const matchesSearch =
      !search.trim() ||
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Filter chip match
    if (activeFilter === "unread") {
      return (unreadCounts?.[user._id] || 0) > 0;
    }
    if (activeFilter === "favorites") {
      return onlineUsers?.includes(user._id);
    }
    if (activeFilter === "groups") {
      return false;
    }
    return true;
  });

  // Dedicated "Groups" Tab
  if (activeFilter === "groups") {
    return (
      <div className="flex flex-col bg-[#0b141a]">
        {/* Create Group Quick Button */}
        <div
          onClick={() => dispatch(setIsCreateGroupOpen(true))}
          className="flex items-center gap-3 px-3.5 py-3 cursor-pointer hover:bg-[#202c33]/60 transition-colors border-b border-[#202c33]/60 select-none group"
        >
          <div className="w-12 h-12 rounded-full bg-[#103629] border border-[#25d366]/40 text-[#25d366] flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
            <IoAdd size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[15px] font-semibold text-[#25d366] truncate flex items-center gap-1.5">
              <span>New Group</span>
            </h4>
            <p className="text-xs text-[#8696a0] truncate">
              Create a group and invite friends
            </p>
          </div>
        </div>

        {/* Groups List */}
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#0b141a]">
            <div className="w-12 h-12 rounded-full bg-[#103629] text-[#25d366] flex items-center justify-center text-2xl mb-3">
              <IoPeople />
            </div>
            <p className="text-sm font-semibold text-[#e9edef] mb-1">
              {search ? `No group matching "${search}"` : "No groups yet"}
            </p>
            <p className="text-xs text-[#8696a0] mb-4 max-w-[220px]">
              Stay in touch with your family, friends, or team with group chat & calls!
            </p>
            <button
              onClick={() => dispatch(setIsCreateGroupOpen(true))}
              className="px-4 py-2 bg-[#25d366] hover:bg-[#20ba59] text-[#0b141a] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
            >
              <IoPeople size={16} />
              <span>Create New Group 👥</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#202c33]/40">
            {filteredGroups.map((group) => (
              <GroupItem key={group._id} group={group} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Pure clean inbox if 0 accepted friends and 0 groups!
  if (otherUsers.length === 0 && (!groups || groups.length === 0)) {
    const inviteText = encodeURIComponent(
      `Hey! Connect with me on our real-time video & audio calling chat app: https://real-time-application-cyan.vercel.app\n\nMy Username is: "${authUser?.username || "User"}"\n(Search my username to start calling!)`
    );

    return (
      <div className="flex flex-col items-center justify-center py-8 px-6 text-center select-none bg-[#0b141a]">
        <div className="w-14 h-14 rounded-full bg-[#103629] flex items-center justify-center text-[#25d366] mb-3 shadow-inner">
          <IoShieldCheckmarkOutline className="text-2xl" />
        </div>
        <h4 className="text-[15px] font-bold text-[#e9edef] mb-1">
          Clean & Private Inbox
        </h4>
        <p className="text-xs text-[#8696a0] leading-relaxed max-w-[240px] mb-4">
          No strangers can message or call you. Only people you send or accept requests from will appear here.
        </p>
        <div className="flex flex-col w-full max-w-[240px] gap-2">
          <button
            onClick={onOpenAddModal}
            className="w-full py-2.5 bg-[#00a884] hover:bg-[#02906f] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <IoPersonAddOutline className="text-sm" />
            <span>Find & Add Friends</span>
          </button>
          <a
            href={`https://api.whatsapp.com/send?text=${inviteText}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-[#0b141a] text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FaWhatsapp className="text-base" />
            <span>Invite on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  // All / Unread / Favorites Feed
  const hasNoItems =
    filteredUsers.length === 0 &&
    (activeFilter !== "all" || filteredGroups.length === 0);

  if (hasNoItems) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#0b141a]">
        <p className="text-sm font-semibold text-[#e9edef] mb-1">
          {activeFilter === "unread"
            ? "No unread messages"
            : activeFilter === "favorites"
            ? "No online favorites right now"
            : `No contact matching "${search}"`}
        </p>
        <p className="text-xs text-[#8696a0] mb-3">
          Want to connect with someone new?
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 bg-[#103629] hover:bg-[#154636] text-[#25d366] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-[#25d366]/30 cursor-pointer"
        >
          <IoPersonAddOutline className="text-sm" />
          <span>Search All Users to Add</span>
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#202c33]/40 bg-[#0b141a]">
      {/* If "All" filter, render groups at top or in the list */}
      {activeFilter === "all" && filteredGroups.length > 0 && (
        <>
          {filteredGroups.map((group) => (
            <GroupItem key={group._id} group={group} />
          ))}
        </>
      )}

      {/* Render Direct User Chats */}
      {filteredUsers.map((user) => (
        <OtherUser key={user._id} user={user} />
      ))}
    </div>
  );
};

export default OtherUsers;
