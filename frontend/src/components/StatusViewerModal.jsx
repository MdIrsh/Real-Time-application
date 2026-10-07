import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  IoClose,
  IoSend,
  IoPause,
  IoVolumeMute,
  IoVolumeHigh,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { setIsViewerOpen, viewStatusLocally } from "../redux/statusSlice";
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

  const audioPlayerRef = useRef(null);

  const DURATION_MS = 6000; // 6 seconds per status
  const INTERVAL_MS = 60; // 60ms tick

  // Synchronize index when viewer opens or selectedStatus changes
  useEffect(() => {
    if (!isViewerOpen) {
      setProgress(0);
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

    setCurrentIndex(Math.min(initialIndex || 0, Math.max(0, effectiveStatuses.length - 1)));
    setProgress(0);
  }, [isViewerOpen, selectedStatus, effectiveStatuses, initialIndex]);

  const activeStatus = effectiveStatuses[currentIndex] || null;

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
        if (isPaused) {
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

  // Pause / Resume Audio when user holds the screen
  useEffect(() => {
    if (!audioPlayerRef.current) return;

    if (isPaused) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play().catch(() => {});
    }
  }, [isPaused]);

  // Handle Mute / Unmute
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Mark status as viewed in backend and locally
  useEffect(() => {
    if (isViewerOpen && activeStatus && activeStatus._id) {
      if (authUser?._id) {
        dispatch(
          viewStatusLocally({
            statusId: activeStatus._id,
            userId: authUser._id,
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
  }, [currentIndex, isViewerOpen, activeStatus, authUser?._id, dispatch]);

  const handleNext = useCallback(() => {
    if (currentIndex < effectiveStatuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      dispatch(setIsViewerOpen(false));
    }
  }, [currentIndex, effectiveStatuses.length, dispatch]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Auto-advancing timer
  useEffect(() => {
    if (!isViewerOpen || isPaused || !activeStatus) return;

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
  }, [isViewerOpen, isPaused, activeStatus, handleNext]);

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
      const textToSend = `[Replied to status: "${activeStatus.caption || 'Status'}"] ${replyText.trim()}`;
      const res = await axios.post(
        `${BASE_URL}/api/v1/message/send/${targetUserId}`,
        { message: textToSend },
        { withCredentials: true }
      );

      if (res.data?.newMessage) {
        dispatch(setMessages([...(messages || []), res.data.newMessage]));
        toast.success(`Reply sent to ${activeStatus.userName}! 💬`, { id: "reply-toast" });
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

  if (!isViewerOpen || !activeStatus) return null;

  const isTextStatus = activeStatus.mediaType === "text" || !activeStatus.mediaUrl;
  const avatarUrl =
    activeStatus.userAvatar ||
    activeStatus.user?.profilePhoto ||
    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      activeStatus.userName || "Contact"
    )}`;

  const hasSong = !!activeStatus.song?.title;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none animate-fade-in">
      {/* 9:16 WhatsApp Mobile Story Player Container */}
      <div
        className="relative w-full max-w-[440px] h-full flex flex-col justify-between overflow-hidden shadow-2xl"
        style={{
          backgroundColor: isTextStatus ? activeStatus.bgColor || "#128c7e" : "#000",
        }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
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
                <h4 className="font-bold text-xs truncate leading-tight drop-shadow">
                  {activeStatus.userName}
                </h4>
                <p className="text-[11px] text-gray-200 drop-shadow">
                  {formatStatusTime(activeStatus.createdAt)}
                </p>
              </div>
            </div>

            {/* Mute + Pause indicator + Close Button */}
            <div className="flex items-center gap-2 text-white">
              {hasSong && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition active:scale-95 text-white"
                  title={isMuted ? "Unmute music" : "Mute music"}
                >
                  {isMuted ? <IoVolumeMute size={18} /> : <IoVolumeHigh size={18} />}
                </button>
              )}

              {isPaused && (
                <div className="p-1 rounded-full bg-black/40 text-amber-300">
                  <IoPause size={14} />
                </div>
              )}

              <button
                onClick={() => {
                  if (audioPlayerRef.current) audioPlayerRef.current.pause();
                  dispatch(setIsViewerOpen(false));
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center transition active:scale-95"
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
                    !isPaused && !isMuted ? "animate-spin" : ""
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
              {!isMuted && !isPaused && (
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

        {/* Bottom Status Reply Bar */}
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
      </div>
    </div>
  );
};

export default StatusViewerModal;
