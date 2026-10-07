import React, { useState, useEffect, useRef } from "react";
import {
  IoSearchOutline,
  IoClose,
  IoCameraOutline,
  IoEllipsisVertical,
  IoChatbubbles,
  IoPeople,
  IoCall,
  IoPersonAddOutline,
  IoShieldCheckmark,
  IoNotificationsOutline,
  IoLogOutOutline,
} from "react-icons/io5";
import { FaRupeeSign } from "react-icons/fa";
import OtherUsers from "./OtherUsers";
import FriendRequestsModal from "./FriendRequestsModal";
import AddFriendModal from "./AddFriendModal";
import ProfileModal from "./ProfileModal";
import CallsModal from "./CallsModal";
import UpdatesTab from "./UpdatesTab";
import UploadStatusModal from "./UploadStatusModal";
import StatusViewerModal from "./StatusViewerModal";
import { IoPencil, IoCamera } from "react-icons/io5";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setSelectedUser } from "../redux/userSlice";
import { setIsReelsOpen } from "../redux/reelSlice";
import { setIsUploadOpen } from "../redux/statusSlice";
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
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "unread" | "favorites" | "groups"
  const [activeBottomTab, setActiveBottomTab] = useState("chats"); // "chats" | "updates" | "communities" | "calls"
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [isUploadStatusOpen, setIsUploadStatusOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() =>
    getNotificationPermission()
  );

  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCallsModalOpen, setIsCallsModalOpen] = useState(false);

  const { authUser, selectedUser, friendRequests } = useSelector(
    (store) => store.user
  );
  const { allStatuses, isUploadOpen } = useSelector((store) => store.status);
  const unreadCounts = useSelector((store) => store.message?.unreadCounts || {});
  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (acc, count) => acc + (count || 0),
    0
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Friend requests actions and real-time socket events
  const friendHookActions = useFriendRequests();
  const pendingReceivedCount = friendRequests?.received?.length || 0;

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      toast.success("🔔 Notification test sound played!");
    }
  };

  const openMetaAi = () => {
    dispatch(setSelectedUser(META_AI_USER));
  };

  const isMetaAiSelected = selectedUser?._id === "meta-ai";

  return (
    <div className="flex flex-col h-full bg-[#0b141a] text-[#e9edef] select-none overflow-hidden relative font-sans">
      {/* 1. WhatsApp Mobile Dark Header */}
      <div className="bg-[#0b141a] px-4 py-3 flex items-center justify-between shrink-0 border-b border-[#202c33]/40 z-20">
        {/* WhatsApp Branding */}
        <h1 className="text-xl font-bold tracking-tight text-[#e9edef] flex items-center gap-1.5 font-sans">
          WhatsApp
        </h1>

        {/* Top Right Action Icons: ₹, 📷, ⋮ */}
        <div className="flex items-center gap-1 text-[#8696a0]" ref={menuRef}>
          {/* Rupee / Payments Button */}
          <button
            onClick={() =>
              toast("WhatsApp Payments & UPI 🇮🇳", {
                icon: "💳",
                id: "pay-toast",
                duration: 1500,
              })
            }
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#202c33] hover:text-[#e9edef] transition active:scale-95"
            title="Payments"
          >
            <FaRupeeSign size={17} />
          </button>

          {/* Camera / Reels Button */}
          <button
            onClick={() => dispatch(setIsReelsOpen(true))}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#202c33] hover:text-[#e9edef] transition active:scale-95"
            title="Camera & Reels"
          >
            <IoCameraOutline size={22} />
          </button>

          {/* Three Dots Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#202c33] hover:text-[#e9edef] transition active:scale-95"
              title="More options"
            >
              <IoEllipsisVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            {showMenuDropdown && (
              <div className="absolute right-0 top-11 w-52 bg-[#202c33] rounded-2xl shadow-2xl border border-[#2a3942] py-2 z-50 text-xs text-[#e9edef] animate-fade-in">
                {/* Profile row */}
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#111b21] transition text-left"
                >
                  <img
                    src={getAvatarUrl(authUser)}
                    alt="my-avatar"
                    className="w-6 h-6 rounded-full object-cover border border-[#25d366]"
                    onError={(e) => handleImageError(e, authUser?.fullName)}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {authUser?.fullName || "My Profile"}
                    </p>
                    <span className="text-[10px] text-[#25d366]">Change DP</span>
                  </div>
                </button>

                <div className="h-[1px] bg-[#2a3942] my-1" />

                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#111b21] transition text-left"
                >
                  <IoPersonAddOutline size={16} className="text-[#25d366]" />
                  <span>Add New Friend</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setIsRequestsModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#111b21] transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <IoPeople size={16} className="text-[#25d366]" />
                    <span>Friend Requests</span>
                  </div>
                  {pendingReceivedCount > 0 && (
                    <span className="bg-[#25d366] text-[#0b141a] text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {pendingReceivedCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    handleNotificationClick();
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#111b21] transition text-left"
                >
                  <IoNotificationsOutline size={16} className="text-amber-400" />
                  <span>Sound Notifications</span>
                </button>

                <div className="h-[1px] bg-[#2a3942] my-1" />

                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    logoutHandler();
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 text-red-400 hover:bg-[#111b21] transition text-left"
                >
                  <IoLogOutOutline size={16} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2 & 3 & 4. Conditional Main Body: Updates Tab vs Chats Tab */}
      {activeBottomTab === "updates" ? (
        <UpdatesTab onOpenUpload={() => setIsUploadStatusOpen(true)} />
      ) : (
        <>
          {/* "Ask Meta AI or Search" Pill Input */}
          <div className="px-4 py-2 bg-[#0b141a] shrink-0">
            <div className="relative flex items-center bg-[#202c33] rounded-full px-3.5 py-2 border border-transparent focus-within:border-[#00a884]/40 transition">
              <IoSearchOutline size={18} className="text-[#8696a0] shrink-0 mr-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Ask Meta AI or Search"
                className="w-full bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-hidden"
              />
              {search ? (
                <button
                  onClick={() => setSearch("")}
                  className="text-[#8696a0] hover:text-[#e9edef] transition ml-1 shrink-0"
                >
                  <IoClose size={16} />
                </button>
              ) : (
                <button
                  onClick={openMetaAi}
                  className="ml-1 shrink-0 active:scale-95 transition"
                  title="Ask Meta AI"
                >
                  <MetaAiRing size="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips (All, Unread, Favorites, Groups, +) */}
          <div className="px-4 py-2 bg-[#0b141a] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 select-none">
            {/* "All" Chip */}
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer shrink-0 font-medium ${
                activeFilter === "all"
                  ? "bg-[#103629] text-[#25d366] border border-[#25d366]/40 font-semibold"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              All
            </button>

            {/* "Unread" Chip */}
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer shrink-0 font-medium flex items-center gap-1.5 ${
                activeFilter === "unread"
                  ? "bg-[#103629] text-[#25d366] border border-[#25d366]/40 font-semibold"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeFilter === "unread"
                      ? "bg-[#25d366] text-[#0b141a]"
                      : "bg-[#2a3942] text-[#8696a0]"
                  }`}
                >
                  {totalUnreadCount}
                </span>
              )}
            </button>

            {/* "Favorites" Chip */}
            <button
              onClick={() => setActiveFilter("favorites")}
              className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer shrink-0 font-medium ${
                activeFilter === "favorites"
                  ? "bg-[#103629] text-[#25d366] border border-[#25d366]/40 font-semibold"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              Favorites
            </button>

            {/* "Groups" Chip */}
            <button
              onClick={() => setActiveFilter("groups")}
              className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer shrink-0 font-medium ${
                activeFilter === "groups"
                  ? "bg-[#103629] text-[#25d366] border border-[#25d366]/40 font-semibold"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              Groups
            </button>

            {/* "+" Add Chip */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-7 h-7 rounded-full bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] flex items-center justify-center text-sm shrink-0 transition"
              title="Add Contact"
            >
              +
            </button>
          </div>

          {/* Chats List Container */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-[#0b141a] relative">
            {/* Quick Reels Banner (visible when in "All" filter and not searching) */}
            {!search && activeFilter === "all" && (
              <div
                onClick={() => dispatch(setIsReelsOpen(true))}
                className="mx-3.5 my-2 p-2.5 rounded-2xl bg-gradient-to-r from-pink-900/30 via-purple-900/25 to-blue-900/25 border border-purple-500/30 hover:border-purple-400/60 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-98 shadow-md select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white text-lg shadow-md shrink-0">
                    🎬
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5">
                      Trending Reels & Status
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold tracking-wider">
                        NEW
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#8696a0] truncate">
                      12 Indian Bollywood reels with real music
                    </p>
                  </div>
                </div>
                <span className="text-xs text-pink-400 font-semibold px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 transition shrink-0 ml-1">
                  Watch →
                </span>
              </div>
            )}

            {/* Pinned Meta AI Contact Row */}
            {(!search || "meta ai".includes(search.toLowerCase())) &&
              (activeFilter === "all" || activeFilter === "favorites") && (
                <div
                  onClick={openMetaAi}
                  className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors border-b border-[#202c33]/40 select-none ${
                    isMetaAiSelected ? "bg-[#202c33]" : "hover:bg-[#202c33]/60 bg-[#0b141a]"
                  }`}
                >
                  <MetaAiRing size="w-12 h-12" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-[15px] font-semibold text-[#e9edef] truncate">
                          Meta AI
                        </h4>
                        <IoShieldCheckmark className="text-[#0064e0] text-sm shrink-0" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full">
                        AI
                      </span>
                    </div>
                    <p className="text-[13px] text-[#8696a0] truncate flex items-center gap-1 mt-0.5">
                      <span>with Llama 3 • Ask anything...</span>
                    </p>
                  </div>
                </div>
              )}

            {/* Accepted Friends List */}
            <OtherUsers
              search={search}
              activeFilter={activeFilter}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>
        </>
      )}

      {/* 5. Floating Action Buttons */}
      {activeBottomTab === "updates" ? (
        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-3 z-30 pointer-events-auto select-none">
          {/* Pencil Button for Text Status */}
          <button
            onClick={() => setIsUploadStatusOpen(true)}
            className="w-10 h-10 rounded-full bg-[#202c33] hover:bg-[#2a3942] active:scale-95 shadow-xl border border-[#2a3942] text-[#e9edef] flex items-center justify-center transition-all cursor-pointer"
            title="Text Status"
          >
            <IoPencil size={18} />
          </button>

          {/* Camera Button for Photo/Video Status */}
          <button
            onClick={() => setIsUploadStatusOpen(true)}
            className="w-13 h-13 rounded-2xl bg-[#00a884] hover:bg-[#02906f] active:scale-95 text-[#0b141a] shadow-2xl flex items-center justify-center transition-all cursor-pointer font-bold"
            title="Photo / Video Status"
          >
            <IoCamera size={22} className="text-[#0b141a]" />
          </button>
        </div>
      ) : (
        <div className="absolute right-4 bottom-20 flex flex-col items-center gap-3 z-30 pointer-events-auto select-none">
          {/* Meta AI Circular Floating Button */}
          <button
            onClick={openMetaAi}
            className="w-11 h-11 rounded-full bg-[#111b21] hover:bg-[#202c33] active:scale-95 shadow-2xl border border-[#202c33] flex items-center justify-center transition-all cursor-pointer group"
            title="Ask Meta AI"
          >
            <MetaAiRing size="w-7 h-7" />
          </button>

          {/* WhatsApp Green New Chat (+) Floating Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-13 h-13 rounded-2xl bg-[#00a884] hover:bg-[#02906f] active:scale-95 text-[#0b141a] shadow-2xl flex items-center justify-center transition-all cursor-pointer font-bold"
            title="New Chat / Add Friend"
          >
            <IoPersonAddOutline size={22} className="text-[#0b141a]" />
          </button>
        </div>
      )}

      {/* 6. WhatsApp Fixed Bottom Navigation Bar (Chats, Updates, Communities, Calls) */}
      <div className="h-16 bg-[#0b141a] border-t border-[#202c33] flex items-center justify-around px-2 shrink-0 select-none z-20">
        {/* Chats Tab */}
        <button
          onClick={() => setActiveBottomTab("chats")}
          className="flex flex-col items-center gap-1 group cursor-pointer transition active:scale-95 relative"
        >
          <div
            className={`px-5 py-1 rounded-full flex items-center justify-center transition-all relative ${
              activeBottomTab === "chats"
                ? "bg-[#103629] text-[#25d366]"
                : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
          >
            <IoChatbubbles size={20} />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#25d366] text-[#0b141a] text-[10px] font-extrabold px-1.5 min-w-[17px] h-4 rounded-full flex items-center justify-center shadow">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </div>
          <span
            className={`text-xs ${
              activeBottomTab === "chats"
                ? "font-bold text-[#e9edef]"
                : "font-normal text-[#8696a0]"
            }`}
          >
            Chats
          </span>
        </button>

        {/* Updates / Reels Tab */}
        <button
          onClick={() => {
            setActiveBottomTab("updates");
            dispatch(setIsReelsOpen(true));
          }}
          className="flex flex-col items-center gap-1 group cursor-pointer transition active:scale-95 relative"
        >
          <div
            className={`px-5 py-1 rounded-full flex items-center justify-center transition-all relative ${
              activeBottomTab === "updates"
                ? "bg-[#103629] text-[#25d366]"
                : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
          >
            {/* Status / Updates segmented circle icon with green notification dot */}
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#25d366] rounded-full ring-2 ring-[#0b141a] animate-pulse" />
            </div>
          </div>
          <span
            className={`text-xs ${
              activeBottomTab === "updates"
                ? "font-bold text-[#e9edef]"
                : "font-normal text-[#8696a0]"
            }`}
          >
            Updates
          </span>
        </button>

        {/* Communities / Friends Tab */}
        <button
          onClick={() => {
            setActiveBottomTab("communities");
            setIsRequestsModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 group cursor-pointer transition active:scale-95 relative"
        >
          <div
            className={`px-5 py-1 rounded-full flex items-center justify-center transition-all relative ${
              activeBottomTab === "communities"
                ? "bg-[#103629] text-[#25d366]"
                : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
          >
            <IoPeople size={22} />
            {pendingReceivedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#25d366] text-[#0b141a] text-[10px] font-extrabold px-1.5 min-w-[17px] h-4 rounded-full flex items-center justify-center shadow">
                {pendingReceivedCount}
              </span>
            )}
          </div>
          <span
            className={`text-xs ${
              activeBottomTab === "communities"
                ? "font-bold text-[#e9edef]"
                : "font-normal text-[#8696a0]"
            }`}
          >
            Communities
          </span>
        </button>

        {/* Calls Tab */}
        <button
          onClick={() => {
            setActiveBottomTab("calls");
            setIsCallsModalOpen(true);
          }}
          className="flex flex-col items-center gap-1 group cursor-pointer transition active:scale-95 relative"
        >
          <div
            className={`px-5 py-1 rounded-full flex items-center justify-center transition-all relative ${
              activeBottomTab === "calls"
                ? "bg-[#103629] text-[#25d366]"
                : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
          >
            <IoCall size={20} />
          </div>
          <span
            className={`text-xs ${
              activeBottomTab === "calls"
                ? "font-bold text-[#e9edef]"
                : "font-normal text-[#8696a0]"
            }`}
          >
            Calls
          </span>
        </button>
      </div>

      {/* Modals */}
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

      <CallsModal
        isOpen={isCallsModalOpen}
        onClose={() => setIsCallsModalOpen(false)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* WhatsApp Status Modals */}
      <UploadStatusModal
        isOpen={isUploadStatusOpen || isUploadOpen}
        onClose={() => {
          setIsUploadStatusOpen(false);
          dispatch(setIsUploadOpen(false));
        }}
      />

      <StatusViewerModal statuses={allStatuses} />
    </div>
  );
};

export default Sidebar;
