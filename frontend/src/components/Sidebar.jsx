import React, { useState, useEffect } from "react";
import {
  IoSearchSharp,
  IoLogOutOutline,
  IoShieldCheckmark,
  IoNotificationsOutline,
  IoNotifications,
  IoClose,
} from "react-icons/io5";
import { BsChatLeftTextFill } from "react-icons/bs";
import OtherUsers from "./OtherUsers";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setSelectedUser } from "../redux/userSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { META_AI_USER, MetaAiRing } from "../utils/metaAi";
import { BASE_URL } from "../config/api";
import {
  getNotificationPermission,
  requestNotificationPermission,
  triggerMessageNotification,
} from "../utils/notificationService";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const [notifPermission, setNotifPermission] = useState(() =>
    getNotificationPermission()
  );
  const [dismissBanner, setDismissBanner] = useState(false);

  const { authUser, selectedUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const logoutHandler = async () => {
    try {
      await axios.get(`${BASE_URL}/api/v1/user/logout`);
    } catch (error) {
      console.log("Backend logout error:", error);
    } finally {
      dispatch(setAuthUser(null));
      dispatch(setSelectedUser(null));
      navigate("/login");
      toast.success("Logged out successfully");
    }
  };

  const handleNotificationClick = async () => {
    if (notifPermission !== "granted") {
      const res = await requestNotificationPermission();
      setNotifPermission(res);
      if (res === "granted") {
        toast.success("🔔 Desktop notifications activated!");
        triggerMessageNotification({
          senderName: "WhatsApp Web",
          messageText: "You will now get alerts for incoming messages! 🚀",
          isCurrentChatActive: false,
        });
      } else if (res === "denied") {
        toast.error("Notifications blocked in browser. Allow in site settings.");
      }
    } else {
      // Test chime & notification
      triggerMessageNotification({
        senderName: "Chat Notification",
        messageText: "Incoming message alert & sound working! 🔔",
        isCurrentChatActive: false,
      });
      toast.success("🔔 Notification test played!");
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
            <span className="text-[11px] text-emerald-600 font-medium">
              online
            </span>
          </div>
        </div>

        {/* Header icons: Notifications, Meta AI quick button, Chats, Logout */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Notification Bell with status indicator */}
          <button
            onClick={handleNotificationClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative ${
              notifPermission === "granted"
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-amber-500 hover:bg-amber-50"
            }`}
            title={
              notifPermission === "granted"
                ? "Notifications Active (Click to test sound)"
                : "Enable message notifications"
            }
          >
            {notifPermission === "granted" ? (
              <IoNotifications className="text-xl" />
            ) : (
              <IoNotificationsOutline className="text-xl" />
            )}
            {notifPermission !== "granted" && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            )}
          </button>

          <button
            onClick={openMetaAi}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            title="Open Meta AI"
          >
            <MetaAiRing size="w-7 h-7" />
          </button>

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656f]"
            title="Chats"
          >
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

      {/* Optional Notification Prompt Banner */}
      {notifPermission === "default" && !dismissBanner && (
        <div className="bg-[#182229] text-white px-3.5 py-2.5 flex items-center justify-between text-xs shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base">🔔</span>
            <span className="truncate text-gray-200">
              Get notified of new messages on your device
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <button
              onClick={handleNotificationClick}
              className="text-emerald-400 font-semibold hover:text-emerald-300 underline text-xs"
            >
              Turn on
            </button>
            <button
              onClick={() => setDismissBanner(true)}
              className="text-gray-400 hover:text-white"
              title="Dismiss"
            >
              <IoClose className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar with Meta AI button */}
      <div className="p-2.5 border-b border-gray-100 bg-white shrink-0">
        <form
          onSubmit={searchSubmitHandler}
          className="relative flex items-center"
        >
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
