import React, { useState, useEffect, useRef } from "react";
import {
  IoSearchOutline,
  IoClose,
  IoCameraOutline,
  IoEllipsisVertical,
  IoPeople,
  IoPersonAddOutline,
  IoShieldCheckmark,
  IoNotificationsOutline,
  IoLogOutOutline,
  IoGrid,
  IoStar,
  IoChatboxOutline,
  IoChevronForward,
  IoFilmOutline,
  IoCallOutline,
  IoRadioButtonOn,
  IoChatbubbleEllipses,
} from "react-icons/io5";
import OtherUsers from "./OtherUsers";
import FriendRequestsModal from "./FriendRequestsModal";
import AddFriendModal from "./AddFriendModal";
import ProfileModal from "./ProfileModal";
import CallsModal from "./CallsModal";
import UpdatesTab from "./UpdatesTab";
import UploadStatusModal from "./UploadStatusModal";
import StatusViewerModal from "./StatusViewerModal";
import CreateGroupModal from "./CreateGroupModal";
import { IoPencil, IoCamera } from "react-icons/io5";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setAuthUser, setSelectedUser, setUserStatus } from "../redux/userSlice";
import UserStatusDropdown from "./UserStatusDropdown";
import { STATUS_OPTIONS } from "../utils/statusHelper";
import { setIsReelsOpen } from "../redux/reelSlice";
import { openCamera } from "../redux/cameraSlice";
import { setIsUploadOpen } from "../redux/statusSlice";
import { setIsCreateGroupOpen, setSelectedGroup } from "../redux/groupSlice";
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
  const [statusUploadType, setStatusUploadType] = useState("image"); // "image" | "text"
  const [notifPermission, setNotifPermission] = useState(() =>
    getNotificationPermission()
  );

  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCallsModalOpen, setIsCallsModalOpen] = useState(false);

  const { authUser, selectedUser, friendRequests, userStatuses } = useSelector(
    (store) => store.user
  );
  const { socket } = useSelector((store) => store.socket);
  const { allStatuses, isUploadOpen } = useSelector((store) => store.status);
  const { isReelsOpen } = useSelector((store) => store.reel);
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

  const handleStatusChange = async (newStatus) => {
    if (!authUser?._id) return;
    dispatch(setUserStatus({ userId: authUser._id, userStatus: newStatus }));
    if (socket && socket.connected) {
      socket.emit("changeUserStatus", { userStatus: newStatus });
    }
    try {
      axios.defaults.withCredentials = true;
      await axios.put(
        `${BASE_URL}/api/v1/user/profile/status`,
        { userStatus: newStatus },
        { withCredentials: true }
      );
      toast.success(`Status updated to ${newStatus} ✨`);
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

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
    dispatch(setSelectedGroup(null));
  };

  const isMetaAiSelected = selectedUser?._id === "meta-ai";

  return (
    <div className="flex flex-col h-full bg-[#050814] text-[#e2e8f0] select-none overflow-hidden relative font-sans">
      {/* Ethereal Neon Blue Aurora Wave Header Gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none select-none overflow-hidden z-0">
        <div
          className="absolute -top-16 -right-10 w-96 h-56 rounded-full blur-3xl opacity-50"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(147,51,234,0.3) 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute top-0 left-0 w-80 h-40 rounded-full blur-3xl opacity-35"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.45) 0%, transparent 70%)",
          }}
        />
        <svg
          className="absolute top-0 right-0 w-full h-44 opacity-25"
          viewBox="0 0 400 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-50 40 C 100 130, 240 -20, 450 60"
            stroke="url(#blueGlowA)"
            strokeWidth="4"
            filter="blur(1px)"
          />
          <path
            d="M-20 70 C 130 150, 270 10, 450 90"
            stroke="url(#blueGlowB)"
            strokeWidth="2"
            filter="blur(2px)"
          />
          <defs>
            <linearGradient id="blueGlowA" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="blueGlowB" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Top Header matching screenshot */}
      <div className="px-3 sm:px-4 pt-3 pb-2.5 flex items-center justify-between gap-2 shrink-0 border-b border-[#18233c]/60 z-20 relative">
        {/* IRSHAD • Official Messenger Branding */}
        <div
          onClick={() => setIsProfileModalOpen(true)}
          className="flex flex-col cursor-pointer group select-none py-0.5 min-w-0"
          title="IRSHAD • Official Messenger (Tap to view profile)"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
            <span
              className="font-signature text-[28px] sm:text-4xl text-white font-normal tracking-wide inline-block truncate"
              style={{
                textShadow: "0 0 16px rgba(255,255,255,0.45), 0 0 25px rgba(59,130,246,0.6)",
              }}
            >
              Irshad
            </span>
            <span
              className="inline-flex items-center justify-center w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-[#1d9bf0] text-white text-[9px] sm:text-[10px] font-black shrink-0 shadow-[0_0_10px_rgba(29,155,240,0.8)]"
              title="Verified Official"
            >
              ✓
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 mt-1 leading-none">
            <IoShieldCheckmark size={12} className="text-[#38bdf8] shrink-0" />
            <span className="text-[11px] sm:text-[12px] font-medium text-[#60a5fa] tracking-wide truncate">
              Official Messenger
            </span>
          </div>
        </div>

        {/* Top Right Action Icons: Status Selector, 📷, ⋮ */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[#8ea2c6] shrink-0" ref={menuRef}>
          {/* Active Presence Status Dropdown (Online, Away, Offline) */}
          <UserStatusDropdown />

          {/* Camera Button */}
          <button
            onClick={() => dispatch(openCamera())}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#0d1629]/80 hover:bg-[#1a284a] border border-[#1d2b4f] text-white flex items-center justify-center transition active:scale-95 shadow-xs shrink-0"
            title="Camera"
          >
            <IoCameraOutline size={18} />
          </button>

          {/* Three Dots Menu Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#0d1629]/80 hover:bg-[#1a284a] border border-[#1d2b4f] text-white flex items-center justify-center transition active:scale-95 shadow-xs"
              title="More options"
            >
              <IoEllipsisVertical size={17} />
            </button>

            {/* Dropdown Menu */}
            {showMenuDropdown && (
              <div className="absolute right-0 top-11 w-52 max-w-[calc(100vw-24px)] bg-[#202c33] rounded-2xl shadow-2xl border border-[#2a3942] py-2 z-50 text-xs text-[#e9edef] animate-fade-in">
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

                {/* Active Presence Status Section in 3-Dots Menu */}
                <div className="px-3.5 py-2 border-y border-[#2a3942]/70 bg-[#111b21]/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8696a0]">
                      My Status
                    </span>
                    <span className="text-[10px] font-bold text-[#25d366]">
                      {userStatuses?.[authUser?._id] || authUser?.userStatus || "Online"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {STATUS_OPTIONS.map((opt) => {
                      const isActive =
                        (userStatuses?.[authUser?._id] || authUser?.userStatus || "Online") === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            handleStatusChange(opt.id);
                            setShowMenuDropdown(false);
                          }}
                          className={`py-1 px-1 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                            isActive
                              ? "bg-[#25d366] text-[#0b141a] shadow-xs font-bold"
                              : "bg-[#202c33] hover:bg-[#2a3942] text-[#d1d7db]"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opt.dotClass}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                    dispatch(setIsCreateGroupOpen(true));
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#111b21] transition text-left"
                >
                  <IoPeople size={16} className="text-[#25d366]" />
                  <span>New Group</span>
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
        <UpdatesTab
          onOpenUpload={(type = "image") => {
            setStatusUploadType(type);
            setIsUploadStatusOpen(true);
          }}
        />
      ) : (
        <>
          {/* "Ask Meta AI or Search" Pill Input matching screenshot */}
          <div className="px-4 py-2 shrink-0 z-10">
            <div className="relative flex items-center bg-[#0a1224]/90 rounded-2xl px-4 h-12 border border-[#1a294d] shadow-[0_0_20px_rgba(37,99,235,0.12)] focus-within:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <IoSearchOutline size={19} className="text-[#38bdf8] shrink-0 mr-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Ask Meta AI or Search..."
                className="w-full bg-transparent text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none border-none focus:outline-none focus:ring-0 leading-normal"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="w-6 h-6 rounded-full bg-[#1e293b] hover:bg-[#334155] text-gray-300 hover:text-white flex items-center justify-center transition ml-1 shrink-0"
                >
                  <IoClose size={15} />
                </button>
              ) : (
                <button
                  onClick={openMetaAi}
                  className="ml-1 shrink-0 active:scale-95 transition"
                  title="Ask Meta AI"
                >
                  <MetaAiRing size="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips (All, Unread, Favorites, Groups, +) matching screenshot */}
          <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 select-none z-10">
            {/* "All" Chip */}
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3.5 py-1.5 rounded-2xl text-xs transition cursor-pointer shrink-0 font-medium flex items-center gap-1.5 ${
                activeFilter === "all"
                  ? "bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] font-semibold"
                  : "bg-[#0c1427] text-[#8ea2c6] hover:text-white border border-[#1e2a4a]"
              }`}
            >
              <IoGrid size={14} />
              <span>All</span>
            </button>

            {/* "Unread" Chip */}
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-3.5 py-1.5 rounded-2xl text-xs transition cursor-pointer shrink-0 font-medium flex items-center gap-1.5 ${
                activeFilter === "unread"
                  ? "bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] font-semibold"
                  : "bg-[#0c1427] text-[#8ea2c6] hover:text-white border border-[#1e2a4a]"
              }`}
            >
              <IoChatboxOutline size={14} />
              <span>Unread</span>
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8] ml-0.5" />
            </button>

            {/* "Favorites" Chip */}
            <button
              onClick={() => setActiveFilter("favorites")}
              className={`px-3.5 py-1.5 rounded-2xl text-xs transition cursor-pointer shrink-0 font-medium flex items-center gap-1.5 ${
                activeFilter === "favorites"
                  ? "bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] font-semibold"
                  : "bg-[#0c1427] text-[#8ea2c6] hover:text-white border border-[#1e2a4a]"
              }`}
            >
              <IoStar size={14} className={activeFilter === "favorites" ? "text-amber-300" : "text-[#38bdf8]"} />
              <span>Favorites</span>
            </button>

            {/* "Groups" Chip */}
            <button
              onClick={() => setActiveFilter("groups")}
              className={`px-3.5 py-1.5 rounded-2xl text-xs transition cursor-pointer shrink-0 font-medium flex items-center gap-1.5 ${
                activeFilter === "groups"
                  ? "bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] font-semibold"
                  : "bg-[#0c1427] text-[#8ea2c6] hover:text-white border border-[#1e2a4a]"
              }`}
            >
              <IoPeople size={15} />
              <span>Groups</span>
            </button>

            {/* "+" Add Chip */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-8 h-8 rounded-2xl bg-[#0c1427] border border-[#1e2a4a] text-[#8ea2c6] hover:text-white flex items-center justify-center text-base shrink-0 transition hover:border-blue-500/50 cursor-pointer"
              title="Add Contact"
            >
              +
            </button>
          </div>

          {/* Chats List Container */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-transparent relative z-10">
            {/* Pinned Meta AI Card matching screenshot */}
            {(!search || "meta ai".includes(search.toLowerCase())) &&
              (activeFilter === "all" || activeFilter === "favorites") && (
                <div
                  onClick={openMetaAi}
                  className={`mx-3 my-2 p-3.5 rounded-3xl bg-gradient-to-r from-[#0d1838]/95 via-[#0c142e]/95 to-[#16123e]/95 border ${
                    isMetaAiSelected ? "border-blue-500 ring-2 ring-blue-500/30" : "border-[#283870]"
                  } shadow-[0_0_25px_rgba(59,130,246,0.18)] hover:border-blue-500/60 transition-all duration-200 cursor-pointer flex items-center justify-between select-none group`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <MetaAiRing size="w-12 h-12" />
                      <span className="w-3.5 h-3.5 bg-[#22c55e] border-2 border-[#0d1838] rounded-full absolute bottom-0 right-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[15px] font-bold text-white tracking-wide truncate">
                          Meta AI
                        </h4>
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white text-[8px] font-black shrink-0">
                          ✓
                        </span>
                      </div>
                      <p className="text-[13px] text-[#8ea2c6] truncate mt-0.5">
                        with Llama 3 • Ask anything...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#6366f1] to-[#a855f7] text-white px-2.5 py-0.5 rounded-lg shadow-sm">
                      AI
                    </span>
                    <IoChevronForward className="text-[#4b5e86] text-base group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
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

      {/* 5. Floating Action Buttons - +Friend Logo Removed as requested */}
      {activeBottomTab === "updates" ? (
        <div className="absolute right-3 sm:right-4 bottom-[84px] flex flex-col items-center gap-2.5 z-30 pointer-events-auto select-none">
          {/* Pencil Button for Text Status */}
          <button
            onClick={() => {
              setStatusUploadType("text");
              setIsUploadStatusOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-[#0d1629] hover:bg-[#152244] active:scale-95 shadow-xl border border-[#1d2b4f] text-[#e2e8f0] flex items-center justify-center transition-all cursor-pointer"
            title="Text Status"
          >
            <IoPencil size={18} />
          </button>

          {/* Camera Button for Photo/Video Status */}
          <button
            onClick={() => {
              setStatusUploadType("image");
              setIsUploadStatusOpen(true);
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:brightness-110 active:scale-95 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center transition-all cursor-pointer font-bold"
            title="Photo / Video Status"
          >
            <IoCamera size={22} />
          </button>
        </div>
      ) : null}

      {/* 6. Floating Glassmorphic Bottom Navigation Dock matching screenshot */}
      <div className="mx-2 sm:mx-3 mb-2 pb-[env(safe-area-inset-bottom)] rounded-3xl bg-[#080d1e]/95 backdrop-blur-xl border border-[#1a2748] min-h-[64px] px-1 sm:px-2 py-1 grid grid-cols-5 items-center shrink-0 select-none z-20 shadow-[0_0_30px_rgba(0,0,0,0.85)]">
        {/* Chats Tab */}
        <button
          onClick={() => setActiveBottomTab("chats")}
          className="flex flex-col items-center justify-center cursor-pointer transition active:scale-95 relative min-w-0"
        >
          <div
            className={`px-2.5 sm:px-4 py-1.5 rounded-2xl flex flex-col items-center justify-center transition-all relative max-w-full ${
              activeBottomTab === "chats"
                ? "bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] text-white shadow-[0_0_18px_rgba(37,99,235,0.6)]"
                : "text-[#64748b] hover:text-[#cbd5e1]"
            }`}
          >
            <IoChatbubbleEllipses size={19} />
            <span className="text-[10px] sm:text-[11px] font-bold mt-0.5 leading-none truncate max-w-full">Chats</span>
            {totalUnreadCount > 0 && activeBottomTab !== "chats" && (
              <span className="absolute -top-1 -right-1 bg-[#22c55e] text-[#050814] text-[10px] font-black px-1.5 min-w-[17px] h-4 rounded-full flex items-center justify-center shadow">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </div>
        </button>

        {/* Updates Tab */}
        <button
          onClick={() => setActiveBottomTab("updates")}
          className="flex flex-col items-center justify-center cursor-pointer transition active:scale-95 relative min-w-0"
        >
          <div
            className={`px-1.5 sm:px-3 py-1 rounded-2xl flex flex-col items-center justify-center transition-all max-w-full ${
              activeBottomTab === "updates"
                ? "bg-[#111c3a] border border-blue-500/40"
                : ""
            }`}
          >
            <div className="relative text-[#64748b] hover:text-[#cbd5e1]">
              <IoRadioButtonOn
                size={19}
                className={activeBottomTab === "updates" ? "text-blue-400" : "text-[#64748b]"}
              />
              {/* Green dot on top right matching screenshot */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#22c55e] rounded-full ring-2 ring-[#080d1e] shadow-[0_0_6px_#22c55e]" />
            </div>
            <span
              className={`text-[10px] sm:text-[11px] mt-0.5 leading-none whitespace-nowrap ${
                activeBottomTab === "updates" ? "font-bold text-white" : "font-medium text-[#64748b]"
              }`}
            >
              Updates
            </span>
          </div>
        </button>

        {/* Dedicated Reels Tab */}
        <button
          onClick={() => dispatch(setIsReelsOpen(true))}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 relative px-1 py-1 text-[#64748b] hover:text-[#cbd5e1] min-w-0"
        >
          <IoFilmOutline
            size={19}
            className={isReelsOpen ? "text-pink-400" : "text-[#64748b]"}
          />
          <span
            className={`text-[10px] sm:text-[11px] truncate max-w-full leading-none ${
              isReelsOpen ? "font-bold text-pink-400" : "font-medium text-[#64748b]"
            }`}
          >
            Reels
          </span>
        </button>

        {/* Communities / Friends Tab */}
        <button
          onClick={() => {
            setActiveBottomTab("communities");
            setIsRequestsModalOpen(true);
          }}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 relative px-1 py-1 text-[#64748b] hover:text-[#cbd5e1] min-w-0"
        >
          <div className="relative">
            <IoPeople
              size={20}
              className={activeBottomTab === "communities" ? "text-blue-400" : "text-[#64748b]"}
            />
            {pendingReceivedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 rounded-full shadow">
                {pendingReceivedCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] truncate max-w-full leading-none ${
              activeBottomTab === "communities"
                ? "font-bold text-white"
                : "font-medium text-[#64748b]"
            }`}
          >
            Groups
          </span>
        </button>

        {/* Calls Tab */}
        <button
          onClick={() => setIsCallsModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 relative px-1 py-1 text-[#64748b] hover:text-[#cbd5e1] min-w-0"
        >
          <IoCallOutline size={19} />
          <span className="text-[10px] sm:text-[11px] font-medium text-[#64748b] truncate max-w-full leading-none">
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
        initialType={statusUploadType}
        onClose={() => {
          setIsUploadStatusOpen(false);
          dispatch(setIsUploadOpen(false));
        }}
      />

      <StatusViewerModal statuses={allStatuses} />

      {/* WhatsApp Create Group Modal */}
      <CreateGroupModal />
    </div>
  );
};

export default Sidebar;
