import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  IoClose,
  IoSend,
  IoPause,
  IoVolumeMute,
  IoVolumeHigh,
  IoEyeOutline,
  IoTrashOutline,
  IoHappyOutline,
  IoHeart,
  IoChevronBack,
  IoThumbsUp,
  IoPeople,
  IoArrowUndo,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsViewerOpen,
  viewStatusLocally,
  reactStatusLocally,
  removeStatus,
} from "../redux/statusSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { setMessages } from "../redux/messageSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const QUICK_REACTIONS = ["😂", "❤️", "🔥", "👏", "😍", "😮", "😢", "💯"];

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
  const { authUser, selectedUser } = useSelector((store) => store.user);
  const { messages } = useSelector((store) => store.message);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();

  // Filter statuses cleanly to the selected author's stories (all multiple statuses in one viewer, oldest -> newest)
  const effectiveStatuses = useMemo(() => {
    const source = statuses && statuses.length > 0 ? statuses : allStatuses || [];
    if (!selectedStatus) return source;
    const targetAuthorId = String(selectedStatus.user?._id || selectedStatus.user || "");
    const authorMatches = source.filter((s) => {
      const sAuthorId = String(s.user?._id || s.user || "");
      if (targetAuthorId && sAuthorId) {
        return sAuthorId === targetAuthorId;
      }
      return (s.userName || "") === (selectedStatus.userName || "");
    });
    const list = authorMatches.length > 0 ? authorMatches : [selectedStatus];
    return [...list].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );
  }, [statuses, allStatuses, selectedStatus]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [isDeletingStatus, setIsDeletingStatus] = useState(false);
  const [showEmojiRow, setShowEmojiRow] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);

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

    const getAudioSrc = (url) => {
      if (!url) return "";
      if (url.includes("jio.com") || url.includes("jiotune") || url.includes("saavn")) {
        return `${BASE_URL}/api/v1/status/stream-audio?url=${encodeURIComponent(url)}`;
      }
      return url;
    };

    const primaryUrl = getAudioSrc(currentSongUrl);
    const audio = new Audio(primaryUrl);
    audio.volume = 0.85;
    audio.muted = isMuted;
    audio.loop = true;
    audio.onerror = () => {
      // Fallback to direct URL if proxy fails
      if (primaryUrl !== currentSongUrl) {
        const directAudio = new Audio(currentSongUrl);
        directAudio.volume = 0.85;
        directAudio.muted = isMuted;
        directAudio.loop = true;
        directAudio.play().catch(() => {});
        audioPlayerRef.current = directAudio;
      }
    };
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

    const handleStatusReacted = ({ statusId, reaction }) => {
      dispatch(reactStatusLocally({ statusId, reaction }));
    };

    const handleStatusDeleted = (statusId) => {
      dispatch(removeStatus(statusId));
    };

    socket.on("statusViewed", handleStatusViewed);
    socket.on("statusReacted", handleStatusReacted);
    socket.on("statusDeleted", handleStatusDeleted);

    return () => {
      socket.off("statusViewed", handleStatusViewed);
      socket.off("statusReacted", handleStatusReacted);
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
      const token = localStorage.getItem("token");
      axios
        .put(
          `${BASE_URL}/api/v1/status/view/${activeStatus._id}`,
          {},
          {
            withCredentials: true,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isViewerOpen, activeStatus?._id, isMyStatus, authUser?._id, dispatch]);

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

  // Auto-advancing timer (paused when holding, viewers sheet open, typing reply, or input focused)
  useEffect(() => {
    const shouldPause =
      !isViewerOpen ||
      isPaused ||
      showViewersSheet ||
      isInputFocused ||
      replyText.trim().length > 0 ||
      !activeStatus;

    if (shouldPause) return;

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
  }, [
    isViewerOpen,
    isPaused,
    showViewersSheet,
    isInputFocused,
    replyText,
    activeStatus,
    handleNext,
  ]);

  // Send reply as a chat message to the status creator
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStatus) return;

    const targetUserId = activeStatus.user?._id || activeStatus.user;
    const authorName =
      activeStatus.user?.fullName || activeStatus.userName || "Contact";

    if (!targetUserId) {
      toast.success("Replied to status! 💬", { id: "reply-toast" });
      setReplyText("");
      setIsInputFocused(false);
      setIsPaused(false);
      return;
    }

    try {
      setIsSendingReply(true);
      const payload = {
        caption: activeStatus.caption || "",
        mediaUrl: activeStatus.mediaUrl || "",
        mediaType:
          activeStatus.mediaType || (activeStatus.mediaUrl ? "image" : "text"),
        bgColor: activeStatus.bgColor || "#128c7e",
        songTitle: activeStatus.song?.title || "",
        authorName,
      };
      const textToSend = `[STATUS_REPLY:${JSON.stringify(payload)}] ${replyText.trim()}`;

      const res = await axios.post(
        `${BASE_URL}/api/v1/message/send/${targetUserId}`,
        { message: textToSend },
        { withCredentials: true }
      );

      if (res.data?.newMessage) {
        if (
          selectedUser?._id &&
          String(selectedUser._id) === String(targetUserId)
        ) {
          dispatch(setMessages([...(messages || []), res.data.newMessage]));
        }
        toast.success(`Reply sent to ${authorName}! 💬`, {
          id: "reply-toast",
        });
        setReplyText("");
        setIsInputFocused(false);
        setIsPaused(false);
      }
    } catch (err) {
      console.error("Reply error:", err);
      toast.error(err.response?.data?.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Quick 1-tap reaction (❤️, 😂, 👍, 🔥) with multi-bubble burst float animation + instant count + post-animation owner notification
  const handleSendQuickReaction = async (emoji) => {
    if (!activeStatus) return;
    const statusSnapshot = activeStatus;
    const targetUserId = statusSnapshot.user?._id || statusSnapshot.user;
    const authorName =
      statusSnapshot.user?.fullName || statusSnapshot.userName || "Contact";
    const ownerSelf =
      authUser?._id &&
      targetUserId &&
      String(targetUserId) === String(authUser._id);

    // 1. Spawn 18 floating multi-bubble emojis spreading smoothly across screen
    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const burst = Array.from({ length: 18 }).map((_, idx) => ({
      id: `${batchId}-${idx}`,
      emoji,
      leftPct: 6 + Math.random() * 88, // spread wide across 6%..94%
      bottomPct: 8 + Math.random() * 14,
      txMid: `${(Math.random() - 0.5) * 90}px`,
      txEnd: `${(Math.random() - 0.5) * 160}px`,
      rot: `${(Math.random() - 0.5) * 55}deg`,
      dur: `${1.3 + Math.random() * 0.65}s`,
      delay: `${idx * 35}ms`,
      sizePx: 24 + Math.floor(Math.random() * 22),
    }));

    setFloatingHearts((prev) => [...prev.slice(-36), ...burst]);
    setTimeout(() => {
      setFloatingHearts((prev) =>
        prev.filter((item) => !String(item.id).startsWith(String(batchId)))
      );
    }, 2400);

    // 2. Instant local UI reaction count update
    if (authUser?._id) {
      dispatch(
        reactStatusLocally({
          statusId: statusSnapshot._id,
          reaction: {
            user: authUser,
            emoji,
            reactedAt: new Date().toISOString(),
          },
        })
      );
    }

    toast.success(`Reacted ${emoji}${ownerSelf ? "" : ` to ${authorName}'s status`}!`, {
      id: "react-toast",
      duration: 1500,
    });

    // 3. After floating bubble animation completes (~1.35s), persist & notify status owner
    setTimeout(async () => {
      if (statusSnapshot._id) {
        try {
          await axios.put(
            `${BASE_URL}/api/v1/status/react/${statusSnapshot._id}`,
            { emoji },
            { withCredentials: true }
          );
        } catch (err) {}
      }

      if (targetUserId && !ownerSelf) {
        try {
          const payload = {
            caption: statusSnapshot.caption || "",
            mediaUrl: statusSnapshot.mediaUrl || "",
            mediaType:
              statusSnapshot.mediaType || (statusSnapshot.mediaUrl ? "image" : "text"),
            bgColor: statusSnapshot.bgColor || "#128c7e",
            songTitle: statusSnapshot.song?.title || "",
            authorName,
            emoji,
          };
          const textToSend = `[STATUS_REACT:${JSON.stringify(payload)}]`;

          const res = await axios.post(
            `${BASE_URL}/api/v1/message/send/${targetUserId}`,
            { message: textToSend },
            { withCredentials: true }
          );
          if (res.data?.newMessage) {
            if (
              selectedUser?._id &&
              String(selectedUser._id) === String(targetUserId)
            ) {
              dispatch(setMessages([...(messages || []), res.data.newMessage]));
            }
          }
        } catch (err) {
          console.error("React error:", err);
        }
      }
    }, 1350);
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
  const displayName = isMyStatus
    ? "My Status"
    : activeStatus.user?.fullName || activeStatus.userName || "Contact";
  const avatarUrl =
    activeStatus.user?.profilePhoto ||
    activeStatus.userAvatar ||
    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      displayName
    )}`;

  const hasSong = !!activeStatus.song?.title;

  // Deduplicate viewers so 1 person viewing multiple times is always strictly 1 view
  const viewersList = (() => {
    if (!activeStatus?.viewers) return [];
    const seen = new Set();
    const unique = [];
    for (const v of activeStatus.viewers) {
      const uId = String(v.user?._id || v.user || v._id || "");
      if (uId && !seen.has(uId)) {
        seen.add(uId);
        unique.push(v);
      } else if (!uId) {
        unique.push(v);
      }
    }
    return unique;
  })();

  const reactionsList = activeStatus?.reactions || [];
  const myReaction = authUser?._id
    ? reactionsList.find(
        (r) => String(r.user?._id || r.user || "") === String(authUser._id)
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none animate-fade-in">
      {/* 9:16 Mobile Story Player Container matching screenshot */}
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
        {/* Top Header Overlay: Progress Bars + Back + Avatar + Name + Music Badge */}
        <div className="absolute top-0 left-0 right-0 z-40 p-3 pt-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex flex-col gap-2.5">
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
            <div className="flex items-center gap-2 min-w-0">
              {/* Back Chevron matching screenshot */}
              <button
                type="button"
                onClick={() => {
                  if (audioPlayerRef.current) audioPlayerRef.current.pause();
                  dispatch(setIsViewerOpen(false));
                }}
                className="w-8 h-8 rounded-full hover:bg-white/15 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                title="Back"
              >
                <IoChevronBack size={22} />
              </button>

              {/* Avatar */}
              <div className="p-[1.5px] bg-gradient-to-tr from-[#22c55e] via-[#06b6d4] to-[#2563eb] rounded-full shrink-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-9 h-9 rounded-full object-cover border border-white/60"
                />
              </div>

              <div className="min-w-0 text-white">
                <h4 className="font-semibold text-sm truncate leading-tight drop-shadow flex items-center gap-1.5">
                  <span>{displayName}</span>
                  {isMyStatus && (
                    <span className="text-[9px] bg-[#2563eb] text-white font-bold px-1.5 py-0.2 rounded-full">
                      YOU
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-gray-200 drop-shadow">
                  {formatStatusTime(activeStatus.createdAt)}
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
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-red-900/60 text-gray-200 hover:text-red-400 flex items-center justify-center transition active:scale-95 cursor-pointer"
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

          {/* Music Badge Sticker */}
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

              {!isMuted && !isPaused && !showViewersSheet && (
                <div className="flex items-end gap-[2px] h-3 shrink-0 ml-1">
                  <span className="w-[2px] h-2 bg-[#38bdf8] rounded-full animate-pulse" />
                  <span className="w-[2px] h-3 bg-[#38bdf8] rounded-full animate-bounce" />
                  <span className="w-[2px] h-1.5 bg-[#38bdf8] rounded-full animate-pulse" />
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
            className="absolute left-0 top-16 bottom-44 w-1/3 z-20 cursor-pointer"
            title="Previous status"
          />

          {/* Tap Right Half for Next */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-0 top-16 bottom-44 w-1/3 z-20 cursor-pointer"
            title="Next status"
          />

          {isTextStatus ? (
            /* Text Status */
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
                className="w-full h-full object-cover sm:object-contain"
              />

              {/* Caption Overlay */}
              {activeStatus.caption && (
                <div className="absolute top-24 left-4 right-4 z-30 bg-black/55 backdrop-blur-md px-4 py-2 rounded-2xl text-center shadow-lg border border-white/10 pointer-events-none">
                  <p className="text-white text-sm font-medium leading-snug drop-shadow">
                    {activeStatus.caption}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Floating Animated Multi-Bubble Emojis Spread Across Full Screen */}
          {floatingHearts.length > 0 && (
            <div className="fixed inset-0 z-[75] pointer-events-none overflow-hidden">
              {floatingHearts.map((item) => (
                <span
                  key={item.id}
                  className="absolute animate-status-bubble drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] select-none"
                  style={{
                    left: `${item.leftPct ?? 50}%`,
                    bottom: `${item.bottomPct ?? 14}%`,
                    fontSize: `${item.sizePx ?? 28}px`,
                    "--tx-mid": item.txMid || "12px",
                    "--tx-end": item.txEnd || "-18px",
                    "--rot": item.rot || "10deg",
                    "--dur": item.dur || "1.5s",
                    animationDelay: item.delay || "0ms",
                  }}
                >
                  {item.emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Frosted Interaction Section matching screenshot */}
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="p-3.5 pb-5 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-40 flex flex-col gap-2.5"
        >
          {/* "❤️ You reacted" pill if user reacted */}
          {myReaction && !isMyStatus && (
            <div className="flex justify-center">
              <span className="bg-black/55 backdrop-blur-md border border-white/15 text-white text-xs font-medium px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <span>{myReaction.emoji}</span>
                <span>You reacted</span>
              </span>
            </div>
          )}

          {/* Stats Pill: 👁️ 12 Seen | ❤️ 3 matching screenshot */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsPaused(true);
                setShowViewersSheet(true);
              }}
              className="bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/15 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-2.5 shadow-lg transition cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <IoEyeOutline size={15} />
                <span>{viewersList.length} Seen</span>
              </span>
              <span className="text-white/30">|</span>
              <span className="flex items-center gap-1">
                <IoHeart size={14} className="text-[#f43f5e]" />
                <span>{reactionsList.length}</span>
              </span>
            </button>
          </div>

          {/* Seen by Avatar Preview Strip matching screenshot */}
          {viewersList.length > 0 && (
            <div
              onClick={() => {
                setIsPaused(true);
                setShowViewersSheet(true);
              }}
              className="bg-black/45 hover:bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 cursor-pointer transition shadow-lg"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white mb-2">
                <IoPeople size={13} className="text-gray-200" />
                <span>Seen by ({viewersList.length})</span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                {viewersList.slice(0, 4).map((v, idx) => {
                  const vUser = v.user || {};
                  const vName = (vUser.fullName || vUser.username || "User").split(" ")[0];
                  const vAvatar = getAvatarUrl(vUser);
                  return (
                    <div key={v._id || idx} className="flex flex-col items-center gap-0.5 shrink-0">
                      <img
                        src={vAvatar}
                        alt={vName}
                        className="w-9 h-9 rounded-full object-cover border border-white/40"
                        onError={(e) => handleImageError(e, vName)}
                      />
                      <span className="text-[10px] text-gray-200 truncate max-w-[44px]">
                        {vName}
                      </span>
                    </div>
                  );
                })}
                {viewersList.length > 4 && (
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className="w-9 h-9 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold flex items-center justify-center">
                      +{viewersList.length - 4}
                    </div>
                    <span className="text-[10px] text-gray-300">More</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Floating Reaction Circles (👍, ❤️, 😂, 🔥) with bubble burst animation */}
          <div className="flex items-center justify-center gap-3.5 py-0.5">
            {[
              { emoji: "👍", label: "Like", icon: <IoThumbsUp size={19} />, isPrimary: false },
              { emoji: "❤️", label: "Heart", icon: <IoHeart size={22} />, isPrimary: true },
              { emoji: "😂", label: "Laugh", icon: <span className="text-xl leading-none">😂</span>, isPrimary: false },
              { emoji: "🔥", label: "Fire", icon: <span className="text-xl leading-none">🔥</span>, isPrimary: false },
            ].map((btn) => {
              const count = reactionsList.filter((r) => r.emoji === btn.emoji).length;
              return (
                <button
                  key={btn.emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendQuickReaction(btn.emoji);
                  }}
                  className={`relative rounded-full flex items-center justify-center shadow-lg transition hover:scale-115 active:scale-90 cursor-pointer ${
                    btn.isPrimary
                      ? "w-12 h-12 bg-gradient-to-tr from-[#f43f5e] to-[#ec4899] text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                      : "w-11 h-11 bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/15 text-white"
                  }`}
                  title={btn.label}
                >
                  {btn.icon}
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#0f172a] text-[10px] font-black flex items-center justify-center shadow border border-black/15">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Optional Quick Emoji Picker Row */}
          {!isMyStatus && showEmojiRow && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/15 shadow-xl animate-fade-in">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendQuickReaction(emoji);
                    setShowEmojiRow(false);
                  }}
                  className="text-xl hover:scale-125 active:scale-90 transition-transform cursor-pointer p-1"
                  title={`React ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Reply Capsule matching screenshot */}
          {!isMyStatus && (
            <form
              onSubmit={handleSendReply}
              className="flex items-center gap-2"
            >
              <div className="flex-1 flex items-center gap-2 bg-black/55 backdrop-blur-xl rounded-full px-3.5 py-2 border border-white/20 focus-within:border-[#38bdf8] shadow-xl transition-all">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiRow((prev) => !prev);
                  }}
                  className={`transition cursor-pointer shrink-0 ${
                    showEmojiRow ? "text-[#38bdf8]" : "text-gray-300 hover:text-white"
                  }`}
                  title="Quick Emoji Reactions"
                >
                  {showEmojiRow ? <IoHappyOutline size={18} /> : <IoArrowUndo size={16} />}
                </button>

                <input
                  type="text"
                  placeholder="Reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => {
                    setIsInputFocused(true);
                    setIsPaused(true);
                  }}
                  onBlur={() => {
                    setIsInputFocused(false);
                    if (!replyText.trim()) setIsPaused(false);
                  }}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-300 outline-none border-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingReply}
                className="w-10 h-10 rounded-full bg-black/60 hover:bg-[#2563eb] border border-white/20 text-white flex items-center justify-center transition active:scale-90 cursor-pointer shrink-0 shadow-lg"
                title="Send Reply"
              >
                <IoSend size={16} className="ml-0.5" />
              </button>
            </form>
          )}
        </div>

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
