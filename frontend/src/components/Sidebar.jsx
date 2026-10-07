import React, { useState, useEffect } from "react";
import {
  IoSearchSharp,
  IoLogOutOutline,
  IoShieldCheckmark,
  IoNotificationsOutline,
  IoNotifications,
  IoClose,
  IoPersonAddOutline,
  IoPeopleOutline,
  IoCamera,
} from "react-icons/io5";
import OtherUsers from "./OtherUsers";
import FriendRequestsModal from "./FriendRequestsModal";
import AddFriendModal from "./AddFriendModal";
import ProfileModal from "./ProfileModal";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setSelectedUser } from "../redux/userSlice";
import { setIsReelsOpen } from "../redux/reelSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { META_AI_USER, MetaAiRing } from "../utils/metaAi";
import { BASE_URL } from "../config/api";
import useFriendRequests from "../hooks/useFriendRequests";
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
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { authUser, selectedUser, friendRequests } = useSelector(
    (store) => store.user
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Friend requests actions and real-time socket events
  const friendHookActions = useFriendRequests();

  const pendingReceivedCount = friendRequests?.received?.length || 0;

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const logoutHandler = async () => {
    try {
      await axios.get(`${BASE_URL}/api/v1/user/logout`);
    } catch (error) {
      console.log("Backend logout error:", error);
    } finally {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("chat-user");
      } catch (e) {}
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
    <div className="flex flex-col h-full bg-white select-none overflow-hidden relative">
      {/* Top Header */}
      <div className="bg-[#f0f2f5] px-3.5 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
        {/* Touch-optimized Clickable Profile Card to edit photo & details */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2.5 min-w-0 p-1 -m-1 rounded-xl hover:bg-gray-200/70 active:bg-gray-300 active:scale-98 transition-all group text-left cursor-pointer touch-manipulation select-none"
          title="Click to view & change profile photo"
        >
          <div className="relative shrink-0">
            <img
              src={getAvatarUrl(authUser)}
              alt="my-avatar"
              className="w-10 h-10 rounded-full object-cover border border-gray-300 transition-opacity group-hover:opacity-85 shadow-sm"
              onError={(e) => handleImageError(e, authUser?.fullName)}
            />
            {/* Camera icon badge always visible on mobile & desktop */}
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-md border border-white">
              <IoCamera className="text-[10px]" />
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#111b21] leading-tight truncate group-hover:text-emerald-700 transition-colors">
              {authUser?.fullName || "My Account"}
            </h3>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span>online</span>
              <span className="text-[10px] text-gray-400 group-hover:text-emerald-600 transition-colors">
                • Change DP
              </span>
            </span>
          </div>
        </button>

        {/* Header icons: Add Friend, Requests Badge, Notifications, Meta AI, Logout */}
        <div className="flex items-center gap-1">
          {/* Add Friend Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656f] hover:bg-gray-200 transition-colors"
            title="Add Friend"
          >
            <IoPersonAddOutline className="text-lg" />
          </button>

          {/* Friend Requests Button with Notification Badge */}
          <button
            onClick={() => setIsRequestsModalOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656f] hover:bg-gray-200 transition-colors relative"
            title="Friend Requests"
          >
            <IoPeopleOutline className="text-xl" />
            {pendingReceivedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow animate-pulse">
                {pendingReceivedCount > 9 ? "9+" : pendingReceivedCount}
              </span>
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={handleNotificationClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative ${
              notifPermission === "granted"
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-amber-500 hover:bg-amber-50"
            }`}
            title={
              notifPermission === "granted"
                ? "Notifications Active (Click to test)"
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

          {/* Watch Reels Button */}
          <button
            onClick={() => dispatch(setIsReelsOpen(true))}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-90 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            title="Watch Reels 🎬"
          >
            <span className="text-xs">🎬</span>
            <span className="font-semibold hidden sm:inline">Reels</span>
          </button>

          {/* Meta AI Quick Button */}
          <button
            onClick={openMetaAi}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            title="Open Meta AI"
          >
            <MetaAiRing size="w-7 h-7" />
          </button>

          {/* Logout */}
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

      {/* Friend Request Notice Banner if pending requests exist */}
      {pendingReceivedCount > 0 && (
        <div
          onClick={() => setIsRequestsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 flex items-center justify-between text-xs font-medium cursor-pointer transition-colors shadow-sm shrink-0"
        >
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span>
              {pendingReceivedCount}{" "}
              {pendingReceivedCount === 1 ? "friend request" : "friend requests"}{" "}
              waiting for you
            </span>
          </div>
          <span className="text-[11px] underline font-semibold">View</span>
        </div>
      )}

      {/* Search Input Bar with Add Friend shortcut */}
      <div className="p-2.5 border-b border-gray-100 bg-white shrink-0">
        <form
          onSubmit={searchSubmitHandler}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1 flex items-center">
            <IoSearchSharp className="absolute left-3 text-gray-400 text-lg" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search chats..."
              className="w-full bg-[#f0f2f5] text-sm text-[#111b21] pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500/50 transition-all border border-transparent focus:border-gray-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 text-gray-400 hover:text-gray-600"
              >
                <IoClose className="text-base" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 shrink-0"
            title="Search all users to add friend"
          >
            <IoPersonAddOutline className="text-base" />
          </button>
        </form>
      </div>

      {/* Chat List */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white">
        {/* Quick Reels Banner */}
        {!search && (
          <div
            onClick={() => dispatch(setIsReelsOpen(true))}
            className="mx-3 my-2.5 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-200/70 hover:border-purple-300 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-98 shadow-xs select-none"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white text-base shadow-sm shrink-0">
                🎬
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  Trending Reels
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold tracking-wider">
                    NEW
                  </span>
                </h4>
                <p className="text-[11px] text-gray-500 truncate">
                  Watch & share short videos with friends
                </p>
              </div>
            </div>
            <span className="text-xs text-purple-600 font-semibold px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 transition shrink-0 ml-1">
              Watch →
            </span>
          </div>
        )}

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

        {/* Regular accepted friends only (clean empty state if 0) */}
        <OtherUsers
          search={search}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* Modals for Friend Requests & Add Friend */}
      <FriendRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        hookActions={friendHookActions}
      />

      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hookActions={friendHookActions}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
