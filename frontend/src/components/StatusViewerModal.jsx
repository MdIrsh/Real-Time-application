import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  IoClose,
  IoSend,
  IoPause,
  IoVolumeMute,
  IoVolumeHigh,
  IoEyeOutline,
  IoChevronUpOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsViewerOpen,
  viewStatusLocally,
  removeStatus,
} from "../redux/statusSlice";
import { setMessages } from "../redux/messageSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

// Helper for WhatsApp relative time ("Today, 4:20 PM" or "25m ago")
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

const StatusViewerModal = ({ statuses = [], initialIndex = 0 }) => {
  const { isViewerOpen, selectedStatus, allStatuses } = useSelector(
    (store) => store.status
  );
  const { authUser } = useSelector((store) => store.user);
  const { messages } = useSelector((store) => store.message);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();

  // Use statuses passed as prop, or fallback to allStatuses from Redux store
  const effectiveStatuses = useMemo(() => {
    return statuses && statuses.length > 0 ? statuses : allStatuses || [];
  }, [statuses, allStatuses]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [isDeletingStatus, setIsDeletingStatus] = useState(false);

  const audioPlayerRef = useRef(null);

  const DURATION_MS = 6000; // 6 seconds per status
  const INTERVAL_MS = 60; // 60ms tick

  // Synchronize index when viewer opens or selectedStatus changes
  useEffect(() => {
    if (!isViewerOpen) {
      setProgress(0);
      setShowViewersSheet(false);
      return;
    }

    if (selectedStatus && effectiveStatuses.length > 0) {
      const targetId = selectedStatus._id;
      const idx = effectiveStatuses.findIndex(
        (s) => String(s._id) === String(targetId)
      );
      if (idx !== -1) {
        setCurrentIndex(idx);
        setProgress(0);
        return;
      }
    }

    setCurrentIndex(
      Math.min(initialIndex || 0, Math.max(0, effectiveStatuses.length - 1))
    );
    setProgress(0);
  }, [isViewerOpen, selectedStatus, effectiveStatuses, initialIndex]);

  const activeStatus = effectiveStatuses[currentIndex] || null;

  const isMyStatus = Boolean(
    authUser?._id &&
      activeStatus &&
      String(activeStatus.user?._id || activeStatus.user) ===
        String(authUser._id)
  );

  const currentSongUrl = activeStatus?.song?.audioUrl;

  // Handle Audio Playback for Status Stories with Music
  useEffect(() => {
    if (!isViewerOpen || !currentSongUrl) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      return;
    }

    // Clean up previous audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    const audio = new Audio(currentSongUrl);
    audio.volume = 0.85;
    audio.muted = isMuted;
    audio.loop = true;
    audio
      .play()
      .then(() => {
        if (isPaused || showViewersSheet) {
          audio.pause();
        }
      })
      .catch(() => {});

    audioPlayerRef.current = audio;

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isViewerOpen, currentSongUrl]);

  // Pause / Resume Audio when user holds the screen or opens viewers sheet
  useEffect(() => {
    if (!audioPlayerRef.current) return;

    if (isPaused || showViewersSheet) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play().catch(() => {});
    }
  }, [isPaused, showViewersSheet]);

  // Handle Mute / Unmute
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Real-time socket events for viewer notifications & status deletions
  useEffect(() => {
    if (!socket) return;

    const handleStatusViewed = ({ statusId, viewer }) => {
      dispatch(viewStatusLocally({ statusId, viewer }));
    };

    const handleStatusDeleted = (statusId) => {
      dispatch(removeStatus(statusId));
    };

    socket.on("statusViewed", handleStatusViewed);
    socket.on("statusDeleted", handleStatusDeleted);

    return () => {
      socket.off("statusViewed", handleStatusViewed);
      socket.off("statusDeleted", handleStatusDeleted);
    };
  }, [socket, dispatch]);

  // Mark status as viewed in backend and locally (only if viewing another user's status)
  useEffect(() => {
    if (isViewerOpen && activeStatus && activeStatus._id && !isMyStatus) {
      if (authUser?._id) {
        dispatch(
          viewStatusLocally({
            statusId: activeStatus._id,
            viewer: {
              user: authUser,
              viewedAt: new Date().toISOString(),
            },
          })
        );
      }
      axios
        .put(
          `${BASE_URL}/api/v1/status/view/${activeStatus._id}`,
          {},
          { withCredentials: true }
        )
        .catch(() => {});
    }
  }, [currentIndex, isViewerOpen, activeStatus, isMyStatus, authUser, dispatch]);

  const handleNext = useCallback(() => {
    if (currentIndex < effectiveStatuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      setShowViewersSheet(false);
    } else {
      dispatch(setIsViewerOpen(false));
    }
  }, [currentIndex, effectiveStatuses.length, dispatch]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      setShowViewersSheet(false);
    }
  }, [currentIndex]);

  // Auto-advancing timer (paused when holding or when viewers sheet is open)
  useEffect(() => {
    if (!isViewerOpen || isPaused || showViewersSheet || !activeStatus) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (INTERVAL_MS / DURATION_MS) * 100;
      });
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isViewerOpen, isPaused, showViewersSheet, activeStatus, handleNext]);

  // Send reply as a chat message to the status creator
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStatus) return;

    const targetUserId = activeStatus.user?._id || activeStatus.user;
    if (!targetUserId) {
      toast.success("Replied to status! 💬", { id: "reply-toast" });
      setReplyText("");
      return;
    }

    try {
      setIsSendingReply(true);
      const textToSend = `[Replied to status: "${
        activeStatus.caption || "Status"
      }"] ${replyText.trim()}`;
      const res = await axios.post(
        `${BASE_URL}/api/v1/message/send/${targetUserId}`,
        { message: textToSend },
        { withCredentials: true }
      );

      if (res.data?.newMessage) {
        dispatch(setMessages([...(messages || []), res.data.newMessage]));
        toast.success(`Reply sent to ${activeStatus.userName}! 💬`, {
          id: "reply-toast",
        });
        setReplyText("");
      }
    } catch (err) {
      console.error("Reply error:", err);
      toast.success("Reply sent! 💬", { id: "reply-toast" });
      setReplyText("");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Delete status action (only for status author)
  const handleDeleteStatus = async () => {
    if (!activeStatus?._id) return;
    if (!window.confirm("Are you sure you want to delete this status?")) return;

    try {
      setIsDeletingStatus(true);
      await axios.delete(`${BASE_URL}/api/v1/status/${activeStatus._id}`, {
        withCredentials: true,
      });
      dispatch(removeStatus(activeStatus._id));
      toast.success("Status deleted! 🗑️");
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      dispatch(setIsViewerOpen(false));
    } catch (err) {
      console.error("Delete status error:", err);
      toast.error("Failed to delete status");
    } finally {
      setIsDeletingStatus(false);
      setShowViewersSheet(false);
    }
  };

  if (!isViewerOpen || !activeStatus) return null;

  const isTextStatus =
    activeStatus.mediaType === "text" || !activeStatus.mediaUrl;
  const avatarUrl =
    activeStatus.userAvatar ||
    activeStatus.user?.profilePhoto ||
    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      activeStatus.userName || "Contact"
    )}`;

  const hasSong = !!activeStatus.song?.title;
  const viewersList = activeStatus.viewers || [];

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none animate-fade-in">
      {/* 9:16 WhatsApp Mobile Story Player Container */}
      <div
        className="relative w-full max-w-[440px] h-full flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          backgroundColor: isTextStatus
            ? activeStatus.bgColor || "#128c7e"
            : "#000",
        }}
        onMouseDown={() => !showViewersSheet && setIsPaused(true)}
        onMouseUp={() => !showViewersSheet && setIsPaused(false)}
        onTouchStart={() => !showViewersSheet && setIsPaused(true)}
        onTouchEnd={() => !showViewersSheet && setIsPaused(false)}
      >
        {/* Top Header Overlay: Progress Bars + User Info + Music Badge + Close */}
        <div className="absolute top-0 left-0 right-0 z-40 p-3 pt-4 bg-gradient-to-b from-black/85 via-black/45 to-transparent flex flex-col gap-2.5">
          {/* Segmented Story Progress Bar */}
          <div className="flex items-center gap-1.5 w-full">
            {effectiveStatuses.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                        ? `${progress}%`
                        : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Row + Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar with WhatsApp green status border */}
              <div className="p-[2px] bg-[#25d366] rounded-full shrink-0">
                <img
                  src={avatarUrl}
                  alt={activeStatus.userName}
                  className="w-9 h-9 rounded-full object-cover border border-black"
                />
              </div>

              <div className="min-w-0 text-white">
                <h4 className="font-bold text-xs truncate leading-tight drop-shadow flex items-center gap-1.5">
                  <span>{isMyStatus ? "My Status" : activeStatus.userName}</span>
                  {isMyStatus && (
                    <span className="text-[9px] bg-[#25d366] text-[#0b141a] font-extrabold px-1.5 py-0.2 rounded-full">
                      YOU
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-gray-200 drop-shadow">
                  {formatStatusTime(activeStatus.createdAt)}
                  {isMyStatus && ` • 👁️ ${viewersList.length} views`}
                </p>
              </div>
            </div>

            {/* Actions: Trash (if my status), Mute, Pause indicator, Close */}
            <div className="flex items-center gap-1.5 text-white">
              {isMyStatus && (
                <button
                  type="button"
                  onClick={handleDeleteStatus}
                  disabled={isDeletingStatus}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-red-900/60 text-gray-300 hover:text-red-400 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  title="Delete this status"
                >
                  <IoTrashOutline size={17} />
                </button>
              )}

              {hasSong && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition active:scale-95 text-white cursor-pointer"
                  title={isMuted ? "Unmute music" : "Mute music"}
                >
                  {isMuted ? (
                    <IoVolumeMute size={18} />
                  ) : (
                    <IoVolumeHigh size={18} />
                  )}
                </button>
              )}

              {isPaused && !showViewersSheet && (
                <div className="p-1 rounded-full bg-black/40 text-amber-300">
                  <IoPause size={14} />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (audioPlayerRef.current) audioPlayerRef.current.pause();
                  dispatch(setIsViewerOpen(false));
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          {/* Instagram / WhatsApp Music Badge Sticker */}
          {hasSong && (
            <div className="mx-auto mt-0.5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white shadow-xl animate-fade-in max-w-[88%] select-none">
              <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/40">
                <img
                  src={activeStatus.song.coverUrl}
                  alt="Album Art"
                  className={`w-full h-full object-cover ${
                    !isPaused && !isMuted && !showViewersSheet
                      ? "animate-spin"
                      : ""
                  }`}
                  style={{ animationDuration: "5s" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold truncate flex items-center gap-1.5">
                  <span className="text-white drop-shadow truncate">
                    {activeStatus.song.title}
                  </span>
                  <span className="text-gray-300 text-[10px] truncate">
                    • {activeStatus.song.artist}
                  </span>
                </p>
              </div>

              {/* Animated Sound Equalizer Waves */}
              {!isMuted && !isPaused && !showViewersSheet && (
                <div className="flex items-end gap-[2px] h-3 shrink-0 ml-1">
                  <span className="w-[2px] h-2 bg-[#25d366] rounded-full animate-pulse" />
                  <span className="w-[2px] h-3 bg-[#25d366] rounded-full animate-bounce" />
                  <span className="w-[2px] h-1.5 bg-[#25d366] rounded-full animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Story Content Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Tap Left Half for Previous */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
            title="Previous status"
          />

          {/* Tap Right Half for Next */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-16 bottom-20 w-1/3 z-20 cursor-pointer"
            title="Next status"
          />

          {isTextStatus ? (
            /* WhatsApp Text Status */
            <div className="p-8 text-center max-w-sm flex flex-col items-center justify-center">
              <p className="text-white text-2xl md:text-3xl font-extrabold tracking-wide leading-relaxed drop-shadow-lg select-text">
                {activeStatus.caption}
              </p>
            </div>
          ) : (
            /* Photo / Video Media Status */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={activeStatus.mediaUrl}
                alt="Status Media"
                className="w-full h-full object-contain"
              />

              {/* Caption Overlay */}
              {activeStatus.caption && (
                <div className="absolute bottom-20 left-4 right-4 z-30 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center shadow-lg border border-white/10">
                  <p className="text-white text-sm font-medium leading-snug drop-shadow">
                    {activeStatus.caption}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar: Viewers Bar for My Status VS Reply Bar for Friends */}
        {isMyStatus ? (
          <div className="p-3 pb-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-40 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setIsPaused(true);
                setShowViewersSheet(true);
              }}
              className="flex items-center gap-2 py-1.5 px-4 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-xl transition active:scale-95 cursor-pointer group"
            >
              <IoEyeOutline size={16} className="text-[#25d366]" />
              <span className="text-xs font-semibold">
                {viewersList.length} {viewersList.length === 1 ? "view" : "views"}
              </span>
              <IoChevronUpOutline
                size={14}
                className="text-gray-300 group-hover:-translate-y-0.5 transition-transform"
              />
            </button>
          </div>
        ) : (
          <div className="p-3 pb-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-40">
            <form
              onSubmit={handleSendReply}
              className="flex items-center gap-2 bg-[#202c33]/90 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 focus-within:border-[#25d366]"
            >
              <input
                type="text"
                placeholder={`Reply to ${activeStatus.userName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-400 outline-hidden"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSendingReply}
                className="w-7 h-7 rounded-full bg-[#00a884] text-[#0b141a] flex items-center justify-center disabled:opacity-40 transition active:scale-95 cursor-pointer font-bold shrink-0"
              >
                <IoSend size={13} />
              </button>
            </form>
          </div>
        )}

        {/* WhatsApp Viewers ("Seen by") Bottom Sheet */}
        {showViewersSheet && (
          <div className="absolute inset-x-0 bottom-0 top-1/3 bg-[#111b21] rounded-t-3xl border-t border-[#202c33] z-50 flex flex-col shadow-2xl animate-slide-up">
            {/* Sheet Handle + Header */}
            <div className="p-3.5 border-b border-[#202c33] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IoEyeOutline size={18} className="text-[#25d366]" />
                <h4 className="font-bold text-sm text-[#e9edef]">
                  Viewed by ({viewersList.length})
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteStatus}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded-lg hover:bg-red-500/10 transition cursor-pointer flex items-center gap-1"
                >
                  <IoTrashOutline size={14} />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewersSheet(false);
                    setIsPaused(false);
                  }}
                  className="w-7 h-7 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-gray-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <IoClose size={18} />
                </button>
              </div>
            </div>

            {/* Viewers List Body */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#202c33]/40">
              {viewersList.length === 0 ? (
                <div className="py-12 px-4 text-center text-xs text-[#8696a0] flex flex-col items-center gap-2 select-none">
                  <div className="w-12 h-12 rounded-full bg-[#202c33] flex items-center justify-center text-[#8696a0]">
                    <IoEyeOutline size={24} />
                  </div>
                  <h5 className="font-bold text-sm text-[#e9edef] mt-1">
                    No views yet
                  </h5>
                  <p className="text-[11px] text-[#8696a0] max-w-xs leading-relaxed">
                    Jab koi bhi user ya friend aapka status dekhega, unka profile photo, naam aur exact time yahan live dikhayi dega!
                  </p>
                </div>
              ) : (
                viewersList.map((viewerRecord, idx) => {
                  const viewerObj = viewerRecord.user || {};
                  const viewerName =
                    viewerObj.fullName || viewerObj.username || "Friend";
                  const viewerPhoto =
                    viewerObj.profilePhoto ||
                    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
                      viewerName
                    )}`;

                  return (
                    <div
                      key={viewerRecord._id || idx}
                      className="flex items-center justify-between p-2.5 hover:bg-[#202c33]/50 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={viewerPhoto}
                          alt={viewerName}
                          className="w-10 h-10 rounded-full object-cover border border-[#202c33] shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#e9edef] truncate">
                            {viewerName}
                          </h5>
                          <p className="text-[10px] text-[#8696a0] truncate mt-0.5">
                            {formatStatusTime(viewerRecord.viewedAt)}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-[#25d366] bg-[#103629] px-2 py-0.5 rounded-full shrink-0">
                        Seen
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusViewerModal;
