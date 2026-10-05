import React from "react";
import OtherUser from "./OtherUser";
import useGetOtherUsers from "../hooks/useGetOtherUsers";
import { useSelector } from "react-redux";
import { IoPersonAddOutline, IoShieldCheckmarkOutline } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";

const OtherUsers = ({ search = "", onOpenAddModal }) => {
  useGetOtherUsers();
  const { otherUsers, authUser } = useSelector((store) => store.user);

  if (otherUsers === null) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-[#8696a0] text-xs">
        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <span>Loading friends...</span>
      </div>
    );
  }

  // Pure clean inbox if 0 accepted friends!
  if (otherUsers.length === 0) {
    const inviteText = encodeURIComponent(
      `Hey! Connect with me on our real-time video & audio calling chat app: https://real-time-application-cyan.vercel.app\n\nMy Username is: "${authUser?.username || "User"}"\n(Search my username to start calling!)`
    );

    return (
      <div className="flex flex-col items-center justify-center py-8 px-6 text-center select-none">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
          <IoShieldCheckmarkOutline className="text-2xl" />
        </div>
        <h4 className="text-[15px] font-bold text-[#111b21] mb-1">
          Clean & Private Inbox
        </h4>
        <p className="text-xs text-[#667781] leading-relaxed max-w-[240px] mb-4">
          No strangers can message or call you. Only people you send or accept requests from will appear here.
        </p>
        <div className="flex flex-col w-full max-w-[240px] gap-2">
          <button
            onClick={onOpenAddModal}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <IoPersonAddOutline className="text-sm" />
            <span>Find & Add Friends</span>
          </button>
          <a
            href={`https://api.whatsapp.com/send?text=${inviteText}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <FaWhatsapp className="text-base" />
            <span>Invite to Call on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  const filteredUsers = otherUsers.filter((user) => {
    if (!search.trim()) return true;
    return (
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <p className="text-sm font-semibold text-gray-700 mb-1">
          No friend matching "{search}"
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Want to connect with someone new?
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-200"
        >
          <IoPersonAddOutline className="text-sm" />
          <span>Search All Users to Add</span>
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {filteredUsers.map((user) => (
        <OtherUser key={user._id} user={user} />
      ))}
    </div>
  );
};

export default OtherUsers;
