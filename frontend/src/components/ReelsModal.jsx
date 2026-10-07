import React, { useState, useEffect, useRef } from "react";
import {
  IoArrowBack,
  IoHeart,
  IoHeartOutline,
  IoChatbubbleEllipses,
  IoPaperPlane,
  IoVolumeMute,
  IoVolumeHigh,
  IoAddCircle,
  IoPlay,
  IoMusicalNotes,
} from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsReelsOpen,
  setReels,
  updateReelLikes,
  setReelsLoading,
} from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import ReelCommentsDrawer from "./ReelCommentsDrawer";
import ShareReelModal from "./ShareReelModal";
import UploadReelModal from "./UploadReelModal";

// Single Reel Item Component
const ReelCard = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onOpenComments,
  onOpenShare,
  currentUserId,
}) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isLikedLocally, setIsLikedLocally] = useState(() => {
    return reel.likes?.some(
      (uId) =>
        String(uId?._id || uId) === String(currentUserId)
    );
  });
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);
  const lastTapRef = useRef(0);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLikedLocally(
      reel.likes?.some(
        (uId) =>
          String(uId?._id || uId) === String(currentUserId)
      )
    );
    setLikesCount(reel.likes?.length || 0);
  }, [reel.likes, currentUserId]);

  // Auto-play when active, pause when inactive (with Audio synchronization)
  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.volume = isMuted ? 0 : 1;
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // If browser blocks unmuted playback, fallback to muted playback
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
          });
      }
      if (audioRef.current && reel.audioUrl) {
        audioRef.current.currentTime = 0;
        audioRef.current.muted = isMuted;
        audioRef.current.volume = isMuted ? 0 : 1;
        audioRef.current.play().catch(() => {});
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isActive, isMuted, reel.audioUrl]);

  // Handle Mute state change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = isMuted ? 0 : 1;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = isMuted ? 0 : 1;
      if (!isMuted && isActive) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, isActive]);

  // Toggle Like API
  const handleToggleLike = async () => {
    const nextLiked = !isLikedLocally;
    setIsLikedLocally(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await axios.put(
        `${BASE_URL}/api/v1/reel/like/${reel._id}`,
        {},
        { withCredentials: true }
      );
      if (res.data?.likes) {
        dispatch(
          updateReelLikes({
            reelId: reel._id,
            likes: res.data.likes,
          })
        );
      }
    } catch (e) {
      console.error("Like reel error:", e);
      // Revert if error
      setIsLikedLocally(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Double tap to like
  const handleVideoTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap triggered!
      if (!isLikedLocally) {
        handleToggleLike();
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    } else {
      // Single tap -> Play / Pause
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          if (audioRef.current && reel.audioUrl) {
            audioRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          if (audioRef.current) {
            audioRef.current.pause();
          }
          setIsPlaying(false);
        }
      }
    }
    lastTapRef.current = now;
  };

  const creatorAvatar =
    reel.creatorAvatar ||
    reel.author?.profilePhoto ||
    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      reel.creatorName || "Creator"
    )}`;

  const creatorName =
    reel.creatorName || reel.author?.fullName || reel.author?.username || "Creator";

  return (
    <div className="relative w-full h-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden select-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-contain md:object-cover cursor-pointer"
        loop
        playsInline
        muted={isMuted}
        onClick={handleVideoTap}
      />

      {/* Background Audio Track if provided (Synced with Reel) */}
      {reel.audioUrl && (
        <audio
          ref={audioRef}
          src={reel.audioUrl}
          loop
          preload="auto"
        />
      )}

      {/* Tap to Unmute Banner if audio is muted */}
      {isMuted && isActive && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/80 hover:bg-black/95 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xl border border-white/20 animate-pulse transition active:scale-95"
        >
          <IoVolumeMute size={17} className="text-amber-400" />
          <span>Tap to Unmute 🔊</span>
        </div>
      )}

      {/* Play/Pause overlay indicator */}
      {!isPlaying && (
        <div
          onClick={handleVideoTap}
          className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-auto"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white shadow-xl">
            <IoPlay size={32} className="ml-1" />
          </div>
        </div>
      )}

      {/* Double tap jumping Heart animation */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
          <IoHeart size={100} className="text-red-500 drop-shadow-2xl" />
        </div>
      )}

      {/* Right Action Bar (Instagram / TikTok Style) */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
        {/* Like Button */}
        <button
          onClick={handleToggleLike}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              isLikedLocally
                ? "bg-red-500/20 text-red-500"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            {isLikedLocally ? (
              <IoHeart size={26} className="text-red-500 fill-current animate-bounce-short" />
            ) : (
              <IoHeartOutline size={26} />
            )}
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-md mt-1">
            {likesCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => onOpenComments(reel)}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md transition">
            <IoChatbubbleEllipses size={24} />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-md mt-1">
            {reel.comments?.length || 0}
          </span>
        </button>

        {/* Share in Chat Button */}
        <button
          onClick={() => onOpenShare(reel)}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md transition">
            <IoPaperPlane size={22} className="-rotate-12 ml-0.5" />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-md mt-1">
            {reel.sharesCount || 0}
          </span>
        </button>

        {/* Mute / Unmute Button */}
        <button
          onClick={onToggleMute}
          className="w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md transition active:scale-110"
        >
          {isMuted ? <IoVolumeMute size={22} /> : <IoVolumeHigh size={22} />}
        </button>

        {/* Spinning Vinyl Audio Record */}
        <div className="relative mt-2">
          <div
            className={`w-10 h-10 rounded-full border-2 border-white/60 bg-gradient-to-tr from-gray-900 to-black flex items-center justify-center shadow-lg ${
              isPlaying ? "animate-spin" : ""
            }`}
            style={{ animationDuration: "4s" }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-gray-400 border border-white" />
          </div>
        </div>
      </div>

      {/* Bottom Left Creator & Caption Overlay */}
      <div className="absolute left-4 bottom-6 right-16 z-20 text-white drop-shadow-md">
        {/* Creator Info */}
        <div className="flex items-center gap-2.5 mb-2">
          <img
            src={creatorAvatar}
            alt={creatorName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md shrink-0"
            onError={(e) => {
              e.target.src = "https://api.dicebear.com/10.x/personas/svg?seed=Creator";
            }}
          />
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white tracking-wide truncate">
              @{creatorName}
            </h4>
          </div>
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-xs text-gray-200 line-clamp-2 max-w-sm mb-2 font-normal leading-relaxed">
            {reel.caption}
          </p>
        )}

        {/* Music Sound Title */}
        <div className="flex items-center gap-1.5 text-[11px] text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full w-fit max-w-[280px] border border-white/10 shadow-md">
          <IoMusicalNotes size={13} className="text-pink-400 shrink-0 animate-pulse" />
          <span className="truncate font-medium">{reel.musicTitle || "Original Audio"}</span>
        </div>
      </div>
    </div>
  );
};

// Main Reels Modal View
const ReelsModal = () => {
  const { isReelsOpen, reels, loading } = useSelector((store) => store.reel);
  const { authUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCommentsReel, setSelectedCommentsReel] = useState(null);
  const [selectedShareReel, setSelectedShareReel] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const containerRef = useRef(null);

  // Fetch Reels on mount or when opening
  useEffect(() => {
    if (isReelsOpen) {
      const fetchReels = async () => {
        try {
          dispatch(setReelsLoading(true));
          const res = await axios.get(`${BASE_URL}/api/v1/reel/all`, {
            withCredentials: true,
          });
          if (res.data?.reels) {
            dispatch(setReels(res.data.reels));
          }
        } catch (err) {
          console.error("Error fetching reels:", err);
          toast.error("Could not load reels");
        } finally {
          dispatch(setReelsLoading(false));
        }
      };

      fetchReels();
    }
  }, [isReelsOpen, dispatch]);

  const [feedReels, setFeedReels] = useState([]);

  // Initialize and append feedReels for endless infinite scroll
  useEffect(() => {
    if (reels && reels.length > 0) {
      setFeedReels([...reels]);
    }
  }, [reels]);

  // Infinite Scroll: automatically append more reels when user scrolls near the end!
  useEffect(() => {
    if (reels && reels.length > 0 && feedReels.length > 0 && activeIndex >= feedReels.length - 2) {
      setFeedReels((prev) => [...prev, ...reels]);
    }
  }, [activeIndex, feedReels.length, reels]);

  // Track active reel on scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollPosition / height);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < feedReels.length) {
      setActiveIndex(newIndex);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      toast.success("🔊 Sound Unmuted!", { id: "sound-toast", duration: 1500 });
    } else {
      toast("🔇 Sound Muted", { id: "sound-toast", duration: 1500 });
    }
  };

  if (!isReelsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 px-4 py-3.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Back Button */}
        <button
          onClick={() => dispatch(setIsReelsOpen(false))}
          className="flex items-center gap-1.5 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium transition"
        >
          <IoArrowBack size={18} />
          <span>Chats</span>
        </button>

        {/* Reels Title */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🎬</span>
          <h2 className="text-white font-extrabold text-base tracking-wide bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Reels
          </h2>
        </div>

        {/* Upload Reel Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg shadow-purple-600/30 transition active:scale-95"
        >
          <IoAddCircle size={17} />
          <span>Post</span>
        </button>
      </div>

      {/* Main Snap Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-[480px] h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative shadow-2xl bg-black"
        style={{ scrollbarWidth: "none" }}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading reels & music...</p>
          </div>
        ) : feedReels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
            <span className="text-5xl mb-3">🎬</span>
            <h3 className="font-bold text-lg">No Reels Yet!</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Be the first one to create a trending short reel with music!
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-semibold"
            >
              Upload First Reel 🚀
            </button>
          </div>
        ) : (
          feedReels.map((reel, index) => (
            <ReelCard
              key={`${reel._id || "reel"}-${index}`}
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onOpenComments={(r) => setSelectedCommentsReel(r)}
              onOpenShare={(r) => setSelectedShareReel(r)}
              currentUserId={authUser?._id}
            />
          ))
        )}
      </div>

      {/* Modals & Drawers */}
      <ReelCommentsDrawer
        reel={selectedCommentsReel}
        isOpen={Boolean(selectedCommentsReel)}
        onClose={() => setSelectedCommentsReel(null)}
      />

      <ShareReelModal
        reel={selectedShareReel}
        isOpen={Boolean(selectedShareReel)}
        onClose={() => setSelectedShareReel(null)}
      />

      <UploadReelModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default ReelsModal;
