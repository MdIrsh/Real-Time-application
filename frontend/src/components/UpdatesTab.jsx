import React, { useEffect, useState } from "react";
import {
  IoAdd,
  IoCamera,
  IoPencil,
  IoMusicalNotes,
  IoChevronForward,
  IoSearchOutline,
  IoEllipsisVertical,
  IoEyeOutline,
  IoHeart,
  IoClose,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  setStatuses,
  setSelectedStatus,
  setIsViewerOpen,
  setStatusLoading,
  addOtherStatus,
  viewStatusLocally,
  reactStatusLocally,
  removeStatus,
} from "../redux/statusSlice";
import { BASE_URL } from "../config/api";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import axios from "axios";

// Helper for relative time
const formatStatusTime = (dateStr) => {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const UpdatesTab = ({ onOpenUpload }) => {
  const { myStatuses, otherStatuses, loading } = useSelector(
    (store) => store.status
  );
  const { authUser } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();

  const [showSearch, setShowSearch] = useState(false);
  const [statusSearch, setStatusSearch] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Real-time listener for incoming statuses, views, reactions & deletions
  useEffect(() => {
    if (!socket) return;

    const handleNewStatus = (incomingStatus) => {
      if (!incomingStatus) return;
      const isFromMe =
        String(incomingStatus.user?._id || incomingStatus.user) ===
        String(authUser?._id);
      if (!isFromMe) {
        dispatch(addOtherStatus(incomingStatus));
      }
    };

    const handleStatusViewed = ({ statusId, viewer }) => {
      dispatch(viewStatusLocally({ statusId, viewer }));
    };

    const handleStatusReacted = ({ statusId, reaction }) => {
      dispatch(reactStatusLocally({ statusId, reaction }));
    };

    const handleStatusDeleted = (statusId) => {
      dispatch(removeStatus(statusId));
    };

    socket.on("newStatus", handleNewStatus);
    socket.on("statusViewed", handleStatusViewed);
    socket.on("statusReacted", handleStatusReacted);
    socket.on("statusDeleted", handleStatusDeleted);

    return () => {
      socket.off("newStatus", handleNewStatus);
      socket.off("statusViewed", handleStatusViewed);
      socket.off("statusReacted", handleStatusReacted);
      socket.off("statusDeleted", handleStatusDeleted);
    };
  }, [socket, authUser?._id, dispatch]);

  // Fetch all statuses from backend
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        dispatch(setStatusLoading(true));
        const res = await axios.get(`${BASE_URL}/api/v1/status/all`, {
          withCredentials: true,
        });
        if (res.data?.success) {
          dispatch(
            setStatuses({
              myStatuses: res.data.myStatuses,
              otherStatuses: res.data.otherStatuses,
              allStatuses: res.data.allStatuses,
            })
          );
        }
      } catch (err) {
        console.error("Error fetching statuses:", err);
      } finally {
        dispatch(setStatusLoading(false));
      }
    };

    fetchStatuses();
  }, [dispatch]);

  const handleOpenStatus = (statusList, index) => {
    dispatch(setSelectedStatus(statusList[index]));
    dispatch(setIsViewerOpen(true));
  };

  const hasMyStatus = myStatuses.length > 0;
  const latestMyStatus = hasMyStatus ? myStatuses[0] : null;
  const orderedMyStatuses = [...myStatuses].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );

  const getUniqueViewCount = (status) => {
    if (!status?.viewers) return 0;
    const seen = new Set();
    for (const v of status.viewers) {
      const uId = String(v.user?._id || v.user || v._id || "");
      if (uId) seen.add(uId);
    }
    return seen.size || status.viewers.length;
  };

  const getGroupUniqueViewCount = (items = []) => {
    const seen = new Set();
    for (const st of items) {
      for (const v of st?.viewers || []) {
        const uId = String(v.user?._id || v.user || v._id || "");
        if (uId) seen.add(uId);
      }
    }
    return seen.size;
  };

  const getGroupReactionCount = (items = []) => {
    return items.reduce((sum, st) => sum + (st?.reactions?.length || 0), 0);
  };

  const filteredOtherStatuses = otherStatuses.filter((s) => {
    if (!statusSearch.trim()) return true;
    const name = s.user?.fullName || s.userName || "";
    const cap = s.caption || "";
    return (
      name.toLowerCase().includes(statusSearch.toLowerCase()) ||
      cap.toLowerCase().includes(statusSearch.toLowerCase())
    );
  });

  // Group multiple statuses from the same friend into ONE unified entry per friend
  const groupedOtherUsers = Object.values(
    filteredOtherStatuses.reduce((acc, st) => {
      const authorId = String(st.user?._id || st.user || st.userName || st._id);
      if (!acc[authorId]) {
        const displayName = st.user?.fullName || st.userName || "Contact";
        const avatar =
          st.user?.profilePhoto ||
          st.userAvatar ||
          getAvatarUrl({ fullName: displayName });
        acc[authorId] = {
          authorId,
          displayName,
          avatar,
          latestStatus: st,
          items: [],
        };
      }
      acc[authorId].items.push(st);
      if (new Date(st.createdAt || 0) > new Date(acc[authorId].latestStatus.createdAt || 0)) {
        acc[authorId].latestStatus = st;
      }
      return acc;
    }, {})
  ).map((grp) => {
    const orderedItems = [...grp.items].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
    const allViewed = orderedItems.every((st) =>
      st.viewers?.some((v) => String(v.user?._id || v.user) === String(authUser?._id))
    );
    const firstUnviewed = orderedItems.find(
      (st) => !st.viewers?.some((v) => String(v.user?._id || v.user) === String(authUser?._id))
    );
    return {
      ...grp,
      items: orderedItems,
      entryStatus: firstUnviewed || orderedItems[0],
      allViewed,
      viewsCount: getGroupUniqueViewCount(orderedItems),
      likesCount: getGroupReactionCount(orderedItems),
    };
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#f8faff] text-[#0f172a] select-none p-3 sm:p-4 pb-28 flex flex-col gap-3.5 sm:gap-4 relative">
      {/* 1. Header matching screenshot ("Status" + "Share what's on your mind" + Search & 3-dots) */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a] leading-tight">Status</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Share what&apos;s on your mind
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => {
              setShowSearch((prev) => !prev);
              setStatusSearch("");
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
              showSearch
                ? "bg-[#2563eb] text-white shadow-sm"
                : "bg-[#eef4fc] hover:bg-[#e0ecfb] text-[#334155]"
            }`}
            title="Search statuses"
          >
            <IoSearchOutline size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowQuickMenu((prev) => !prev)}
            className="w-9 h-9 rounded-full bg-[#eef4fc] hover:bg-[#e0ecfb] text-[#334155] flex items-center justify-center transition cursor-pointer"
            title="Status options"
          >
            <IoEllipsisVertical size={18} />
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-xl border border-blue-100 py-1.5 z-40 text-xs text-[#1e293b]">
              <button
                type="button"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenUpload("image");
                }}
                className="w-full px-3.5 py-2 hover:bg-blue-50 flex items-center gap-2 text-left font-medium cursor-pointer"
              >
                <IoCamera className="text-[#2563eb]" size={15} />
                <span>Photo / Video Status</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenUpload("text");
                }}
                className="w-full px-3.5 py-2 hover:bg-blue-50 flex items-center gap-2 text-left font-medium cursor-pointer"
              >
                <IoPencil className="text-purple-600" size={15} />
                <span>Text Status</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Search Input */}
      {showSearch && (
        <div className="flex items-center bg-white rounded-full px-3.5 py-2 border border-blue-200 shadow-xs">
          <IoSearchOutline size={16} className="text-[#64748b] mr-2 shrink-0" />
          <input
            type="text"
            value={statusSearch}
            onChange={(e) => setStatusSearch(e.target.value)}
            placeholder="Search friend status..."
            className="flex-1 bg-transparent text-xs text-[#0f172a] placeholder-[#94a3b8] outline-none border-none"
            autoFocus
          />
          {statusSearch && (
            <button
              type="button"
              onClick={() => setStatusSearch("")}
              className="text-gray-400 hover:text-gray-700"
            >
              <IoClose size={15} />
            </button>
          )}
        </div>
      )}

      {/* 2. "My Status" Single Unified Card (groups multiple user stories into one card) */}
      <div
        onClick={() => {
          if (hasMyStatus) {
            handleOpenStatus(orderedMyStatuses, 0);
          } else {
            onOpenUpload("image");
          }
        }}
        className="flex items-center justify-between p-3 bg-[#eff6ff] hover:bg-[#e5f0ff] border border-blue-100 rounded-2xl transition cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div
              className={`p-[2px] rounded-full ${
                hasMyStatus
                  ? "bg-gradient-to-tr from-[#22c55e] via-[#06b6d4] to-[#2563eb]"
                  : "border border-blue-200"
              }`}
            >
              <img
                src={getAvatarUrl(authUser)}
                alt="My Status"
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
                onError={(e) => handleImageError(e, authUser?.fullName)}
              />
            </div>

            {/* Blue '+' add button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenUpload("image");
              }}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#2563eb] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 active:scale-95 transition cursor-pointer"
              title="Add status"
            >
              <IoAdd size={13} />
            </button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold text-[#0f172a] leading-tight">
                My Status
              </h4>
              {myStatuses.length > 1 && (
                <span className="text-[10px] font-bold bg-[#2563eb] text-white px-1.5 py-0.5 rounded-full leading-none">
                  {myStatuses.length} stories
                </span>
              )}
            </div>
            <div className="text-xs text-[#64748b] mt-0.5 flex items-center gap-1.5 flex-wrap">
              {hasMyStatus ? (
                <>
                  <span>{formatStatusTime(latestMyStatus.createdAt)}</span>
                  <span className="text-[11px] font-semibold text-[#2563eb] flex items-center gap-1">
                    • <IoEyeOutline size={12} />{" "}
                    {myStatuses.length > 1
                      ? getGroupUniqueViewCount(myStatuses)
                      : getUniqueViewCount(latestMyStatus)}
                  </span>
                  {getGroupReactionCount(myStatuses) > 0 && (
                    <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5">
                      • <IoHeart size={11} /> {getGroupReactionCount(myStatuses)}
                    </span>
                  )}
                </>
              ) : (
                <span>Tap to add status</span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUpload("image");
          }}
          className="w-9 h-9 rounded-full bg-white hover:bg-blue-50 text-[#2563eb] flex items-center justify-center shadow-xs border border-blue-100 transition active:scale-95 shrink-0 cursor-pointer"
          title="Add status"
        >
          <IoCamera size={18} />
        </button>
      </div>

      {/* 3. Horizontal Friends Story Rings Strip (1 ring per friend; duplicate My Status removed) */}
      {groupedOtherUsers.length > 0 && (
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5 shrink-0">
          {groupedOtherUsers.map((grp) => {
            const firstName = grp.displayName.split(" ")[0];
            return (
              <button
                key={`ring-${grp.authorId}`}
                type="button"
                onClick={() => handleOpenStatus([grp.entryStatus], 0)}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div className="relative">
                  <div
                    className={`p-[2.5px] rounded-full ${
                      grp.allViewed
                        ? "bg-slate-300"
                        : "bg-gradient-to-tr from-[#22c55e] via-[#06b6d4] to-[#2563eb] shadow-xs"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white bg-slate-100 shrink-0">
                      <img
                        src={grp.avatar}
                        alt={grp.displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => handleImageError(e, grp.displayName)}
                      />
                    </div>
                  </div>
                  {grp.items.length > 1 && (
                    <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2563eb] text-white text-[10px] font-bold border-2 border-white flex items-center justify-center shadow-xs">
                      {grp.items.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[#334155] truncate max-w-[56px]">
                  {firstName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Recent Updates List (grouped 1 row per friend, multiple statuses combined) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h3 className="font-bold text-sm text-[#0f172a]">Recent Updates</h3>
          <button
            type="button"
            onClick={() => {
              if (groupedOtherUsers.length > 0) {
                handleOpenStatus([groupedOtherUsers[0].entryStatus], 0);
              } else {
                onOpenUpload("image");
              }
            }}
            className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>See All</span>
            <IoChevronForward size={13} />
          </button>
        </div>

        {loading && otherStatuses.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-[#64748b]">
            <div className="w-4 h-4 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin mr-2" />
            <span>Loading updates...</span>
          </div>
        ) : groupedOtherUsers.length === 0 ? (
          <div className="p-4 bg-white rounded-2xl border border-blue-100 text-center text-xs text-[#64748b] shadow-xs">
            No recent updates from friends yet
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {groupedOtherUsers.map((grp, index) => (
              <div
                key={grp.authorId}
                onClick={() => handleOpenStatus([grp.entryStatus], 0)}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer ${
                  index === 0
                    ? "bg-[#eff6ff] border border-blue-100 shadow-xs"
                    : "bg-white hover:bg-[#f1f5f9] border border-transparent hover:border-blue-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Gradient Story Ring */}
                  <div
                    className={`p-[2.5px] rounded-full shrink-0 ${
                      grp.allViewed
                        ? "bg-slate-300"
                        : "bg-gradient-to-tr from-[#22c55e] via-[#06b6d4] to-[#2563eb] shadow-xs"
                    }`}
                  >
                    <img
                      src={grp.avatar}
                      alt={grp.displayName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white"
                      onError={(e) => handleImageError(e, grp.displayName)}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-[#0f172a] truncate">
                        {grp.displayName}
                      </h4>
                      {grp.items.length > 1 && (
                        <span className="text-[10px] font-bold text-[#2563eb] bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                          {grp.items.length}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748b] truncate mt-0.5 flex items-center gap-1.5">
                      <span className="shrink-0">
                        {formatStatusTime(grp.latestStatus.createdAt)}
                      </span>
                      {grp.latestStatus.song?.title && (
                        <span className="text-[10px] text-[#2563eb] font-medium bg-blue-50 px-1.5 py-0.5 rounded-full truncate max-w-[110px] shrink-0">
                          🎵 {grp.latestStatus.song.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Stats: Eye Count + Red Heart Count matching screenshot */}
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#475569]">
                    <IoEyeOutline size={15} className="text-[#475569]" />
                    <span>{grp.viewsCount}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#0f172a]">
                    <IoHeart size={14} className="text-[#ef4444]" />
                    <span>{grp.likesCount}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Quick Creation Cards ("Status Lagayein") */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-blue-100 pb-2">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="font-bold text-sm text-[#0f172a] flex items-center gap-1.5">
            <span>Create Status</span>
            <span className="text-[10px] text-[#2563eb] font-semibold bg-blue-100 px-2 py-0.2 rounded-full">
              New Story
            </span>
          </h3>
        </div>

        {/* Option 1: Photo / Video Status with Song */}
        <div
          onClick={() => onOpenUpload("image")}
          className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#eff6ff] to-white border border-blue-200 hover:border-[#2563eb] transition cursor-pointer flex items-center justify-between gap-2 group active:scale-98 shadow-xs"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1d4ed8] to-[#2563eb] text-white flex items-center justify-center text-lg shadow-sm shrink-0 group-hover:scale-105 transition">
              <IoCamera size={19} />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5 flex-wrap">
                <span>Photo / Video Status</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-[#2563eb] text-white font-black">
                  + SONG
                </span>
              </h5>
              <p className="text-[11px] text-[#64748b] truncate mt-0.5 flex items-center gap-1">
                <IoMusicalNotes size={12} className="text-[#2563eb] shrink-0" />
                <span>Upload photo/video + music</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-[#2563eb] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-blue-100 group-hover:bg-[#2563eb] group-hover:text-white transition shrink-0">
            Upload →
          </span>
        </div>

        {/* Option 2: Colorful Text Status with Song */}
        <div
          onClick={() => onOpenUpload("text")}
          className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-white border border-purple-200 hover:border-purple-500 transition cursor-pointer flex items-center justify-between gap-2 group active:scale-98 shadow-xs"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0 group-hover:scale-105 transition">
              <IoPencil size={17} />
            </div>
            <div className="min-w-0">
              <h5 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5 flex-wrap">
                <span>Text Status</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-black">
                  COLOR
                </span>
              </h5>
              <p className="text-[11px] text-[#64748b] truncate mt-0.5 flex items-center gap-1">
                <IoMusicalNotes size={12} className="text-purple-500 shrink-0" />
                <span>7 vibrant colors &amp; music</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-purple-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-100 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
            Write →
          </span>
        </div>
      </div>
    </div>
  );
};

export default UpdatesTab;
