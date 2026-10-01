import React, { useState } from "react";
import { IoSearchSharp, IoLogOutOutline, IoShieldCheckmark } from "react-icons/io5";
import { BsChatLeftTextFill } from "react-icons/bs";
import OtherUsers from "./OtherUsers";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setSelectedUser } from "../redux/userSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { META_AI_USER, MetaAiRing } from "../utils/metaAi";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const { authUser, selectedUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      await axios.get(`http://localhost:5000/api/v1/user/logout`);
    } catch (error) {
      console.log("Backend logout error:", error);
    } finally {
      dispatch(setAuthUser(null));
      dispatch(setSelectedUser(null));
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  const searchSubmitHandler = (e) => {
    e.preventDefault();
  };

  const openMetaAi = () => {
    dispatch(setSelectedUser(META_AI_USER));
  };

  const isMetaAiSelected = selectedUser?._id === "meta-ai";

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(authUser)}
            alt="my-avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
            onError={(e) => handleImageError(e, authUser?.fullName)}
          />
          <div>
            <h3 className="text-sm font-semibold text-[#111b21] leading-tight">
              {authUser?.fullName || "My Account"}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium">online</span>
          </div>
        </div>

        {/* Header icons: Meta AI quick button, Chats, Logout */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={openMetaAi}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            title="Open Meta AI"
          >
            <MetaAiRing size="w-7 h-7" />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656f]">
            <BsChatLeftTextFill className="text-base" />
          </div>
          <button
            onClick={logoutHandler}
            className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <IoLogOutOutline className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Search Input Bar with Meta AI button */}
      <div className="p-2.5 border-b border-gray-100 bg-white shrink-0">
        <form onSubmit={searchSubmitHandler} className="relative flex items-center">
          <IoSearchSharp className="absolute left-3 text-gray-400 text-lg" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Ask Meta AI or Search"
            className="w-full bg-[#f0f2f5] text-sm text-[#111b21] pl-9 pr-10 py-2 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500/50 transition-all border border-transparent focus:border-gray-200"
          />
          <button
            type="button"
            onClick={openMetaAi}
            className="absolute right-2 p-1 hover:opacity-80 transition-opacity"
            title="Ask Meta AI"
          >
            <MetaAiRing size="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Chat List */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white">
        {/* Pinned Meta AI Contact */}
        {(!search || "meta ai".includes(search.toLowerCase())) && (
          <div
            onClick={openMetaAi}
            className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors border-b border-gray-100 select-none ${
              isMetaAiSelected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6] bg-white"
            }`}
          >
            <MetaAiRing size="w-12 h-12" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h4 className="text-[15px] font-semibold text-[#111b21] truncate">
                    Meta AI
                  </h4>
                  <IoShieldCheckmark className="text-[#0064e0] text-sm shrink-0" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full">
                  AI
                </span>
              </div>
              <p className="text-[13px] text-[#667781] truncate flex items-center gap-1">
                <span>with Llama 3 • Ask anything...</span>
              </p>
            </div>
          </div>
        )}

        {/* Regular users with live search */}
        <OtherUsers search={search} />
      </div>
    </div>
  );
};

export default Sidebar;
