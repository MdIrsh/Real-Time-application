import React, { useEffect } from "react";
import {
  IoAdd,
  IoCamera,
  IoPlayCircle,
  IoChevronForward,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  setStatuses,
  setSelectedStatus,
  setIsViewerOpen,
  setStatusLoading,
  addOtherStatus,
  viewStatusLocally,
  removeStatus,
} from "../redux/statusSlice";
import { setIsReelsOpen } from "../redux/reelSlice";
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

  // Real-time listener for incoming statuses & viewer notifications from friends
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

    const handleStatusDeleted = (statusId) => {
      dispatch(removeStatus(statusId));
    };

    socket.on("newStatus", handleNewStatus);
    socket.on("statusViewed", handleStatusViewed);
    socket.on("statusDeleted", handleStatusDeleted);

    return () => {
      socket.off("newStatus", handleNewStatus);
      socket.off("statusViewed", handleStatusViewed);
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

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#0b141a] text-[#e9edef] select-none p-3.5 flex flex-col gap-5">
      {/* 1. Status Section Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-base text-[#e9edef]">Status</h3>
        </div>

        {/* My Status Card */}
        <div className="flex items-center justify-between p-2 hover:bg-[#202c33]/50 rounded-2xl transition cursor-pointer">
          <div
            onClick={() => {
              if (hasMyStatus) {
                handleOpenStatus(myStatuses, 0);
              } else {
                onOpenUpload();
              }
            }}
            className="flex items-center gap-3.5 min-w-0 flex-1"
          >
            {/* Avatar with Green '+' Badge or Story Ring */}
            <div className="relative shrink-0">
              <div
                className={`p-[2px] rounded-full ${
                  hasMyStatus
                    ? "bg-[#25d366]"
                    : "border-2 border-dashed border-[#8696a0]"
                }`}
              >
                <img
                  src={getAvatarUrl(authUser)}
                  alt="My Status"
                  className="w-12 h-12 rounded-full object-cover border border-[#0b141a]"
                  onError={(e) => handleImageError(e, authUser?.fullName)}
                />
              </div>

              {/* Green '+' add button */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenUpload();
                }}
                className="absolute bottom-0 right-0 w-5 h-5 bg-[#00a884] text-white rounded-full flex items-center justify-center border-2 border-[#0b141a] shadow-sm hover:scale-110 active:scale-95 transition"
                title="Add status"
              >
                <IoAdd size={14} className="font-bold" />
              </div>
            </div>

            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[#e9edef] leading-tight">
                My status
              </h4>
              <div className="text-xs text-[#8696a0] mt-0.5 flex items-center gap-1.5 flex-wrap">
                {hasMyStatus ? (
                  <>
                    <span className="shrink-0">
                      {formatStatusTime(latestMyStatus.createdAt)}
                    </span>
                    <span className="text-[10px] text-[#25d366] font-semibold bg-[#103629] px-1.5 py-0.2 rounded-full shrink-0">
                      👁️ {latestMyStatus.viewers?.length || 0} views
                    </span>
                    {latestMyStatus.song?.title && (
                      <span className="text-[10px] text-[#25d366] font-medium truncate max-w-[110px] shrink-0">
                        🎵 {latestMyStatus.song.title}
                      </span>
                    )}
                  </>
                ) : (
                  <span>Tap to add status update</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Camera & Pencil Floating Shortcuts */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => onOpenUpload()}
              className="w-8 h-8 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-[#25d366] flex items-center justify-center transition active:scale-95"
              title="Add text or photo status"
            >
              <IoCamera size={16} />
            </button>
          </div>
        </div>

        {/* 2. Recent Updates List */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider mb-2 px-2">
            Recent updates
          </h4>

          {loading && otherStatuses.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-xs text-[#8696a0]">
              <div className="w-4 h-4 border-2 border-[#25d366] border-t-transparent rounded-full animate-spin mr-2" />
              <span>Loading updates...</span>
            </div>
          ) : otherStatuses.length === 0 ? (
            <div className="p-4 bg-[#111b21] rounded-2xl text-center text-xs text-[#8696a0]">
              No recent updates from friends
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#202c33]/30">
              {otherStatuses.map((status, index) => {
                const avatar =
                  status.userAvatar ||
                  status.user?.profilePhoto ||
                  `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
                    status.userName || "Friend"
                  )}`;

                const isViewed = status.viewers?.some(
                  (v) => String(v.user?._id || v.user) === String(authUser?._id)
                );

                return (
                  <div
                    key={status._id || index}
                    onClick={() => handleOpenStatus(otherStatuses, index)}
                    className="flex items-center justify-between p-2.5 hover:bg-[#202c33]/50 rounded-2xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar with Status Ring (Green if unviewed, Gray if viewed) */}
                      <div
                        className={`p-[2.5px] rounded-full shrink-0 ${
                          isViewed
                            ? "border-2 border-[#8696a0]/40"
                            : "bg-gradient-to-tr from-[#25d366] to-[#00a884] shadow-xs"
                        }`}
                      >
                        <img
                          src={avatar}
                          alt={status.userName}
                          className="w-11 h-11 rounded-full object-cover border border-[#0b141a]"
                        />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#e9edef] truncate">
                          {status.userName}
                        </h4>
                        <div className="text-xs text-[#8696a0] truncate mt-0.5 flex items-center gap-1.5">
                          <span className="shrink-0">{formatStatusTime(status.createdAt)}</span>
                          {status.song?.title && (
                            <span className="text-[10px] text-[#25d366] font-semibold bg-[#103629] px-1.5 py-0.2 rounded-full truncate flex items-center gap-0.5 shrink-0 max-w-[120px]">
                              🎵 {status.song.title}
                            </span>
                          )}
                          {status.caption && (
                            <span className="truncate">• {status.caption}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <IoChevronForward size={16} className="text-[#8696a0] shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="h-[1px] bg-[#202c33] my-1" />

      {/* 3. Channels & Reels Section */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-bold text-base text-[#e9edef]">Trending Reels</h3>
          <button
            onClick={() => dispatch(setIsReelsOpen(true))}
            className="text-xs font-bold text-[#25d366] hover:underline"
          >
            See all →
          </button>
        </div>

        {/* Big Reels Banner */}
        <div
          onClick={() => dispatch(setIsReelsOpen(true))}
          className="p-4 rounded-2xl bg-gradient-to-r from-pink-900/40 via-purple-900/35 to-blue-900/35 border border-purple-500/30 hover:border-purple-400 flex items-center justify-between cursor-pointer transition shadow-xl group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shrink-0 group-hover:scale-105 transition">
              🎬
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[#e9edef] flex items-center gap-2">
                Instagram & Bollywood Reels
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold tracking-wider">
                  HOT
                </span>
              </h4>
              <p className="text-xs text-[#8696a0] truncate mt-0.5">
                Watch full 9:16 vertical reels with Kesariya, Apna Bana Le & more
              </p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-[#25d366] group-hover:text-[#0b141a] text-white flex items-center justify-center transition shrink-0 ml-2">
            <IoPlayCircle size={22} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatesTab;
