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
  IoCheckmarkCircle,
  IoEllipsisVertical,
  IoBookmark,
  IoBookmarkOutline,
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

// Format numbers like Instagram (1420 -> 1.4K, 120000 -> 120K)
const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num);
};

// Single Reel Item Component (Pure Instagram Reels Aesthetic)
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
  const [progress, setProgress] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLikedLocally, setIsLikedLocally] = useState(() => {
    return reel.likes?.some(
      (uId) => String(uId?._id || uId) === String(currentUserId)
    );
  });
  const [likesCount, setLikesCount] = useState(reel.likes?.length || 1420);
  const [isSaved, setIsSaved] = useState(false);
  const tapTimerRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLikedLocally(
      reel.likes?.some(
        (uId) => String(uId?._id || uId) === String(currentUserId)
      )
    );
    setLikesCount(reel.likes?.length || (Math.floor(Math.random() * 4000) + 1200));
  }, [reel.likes, currentUserId]);

  // Video progress bar updater
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100
      );
    }
  };

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
      setProgress(0);
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
      setIsLikedLocally(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Double tap to like or Single tap to play/pause/unmute
  const handleVideoTap = () => {
    if (tapTimerRef.current) {
      // Double tap detected!
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
      if (!isLikedLocally) {
        handleToggleLike();
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapTimerRef.current = null;
      // Single tap: toggle Play/Pause or unmute if muted
      if (isMuted) {
        onToggleMute();
      }
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
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
    }, 240);
  };

  const creatorAvatar =
    reel.creatorAvatar ||
    reel.author?.profilePhoto ||
    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      reel.creatorName || "InstagramCreator"
    )}`;

  const creatorName =
    reel.creatorName || reel.author?.username || reel.author?.fullName || "desi_creator";

  return (
    <div className="relative w-full h-full snap-start snap-always flex items-center justify-center bg-black overflow-hidden select-none">
      {/* 9:16 Fullscreen Video Element */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="w-full h-full object-cover cursor-pointer select-none"
        loop
        playsInline
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onClick={handleVideoTap}
      />

      {/* Synced Bollywood Background Music Track */}
      {reel.audioUrl && (
        <audio
          ref={audioRef}
          src={reel.audioUrl}
          loop
          preload="auto"
        />
      )}

      {/* Floating Instagram "Tap for sound" Badge */}
      {isMuted && isActive && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/85 hover:bg-black/95 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-2xl border border-white/20 animate-pulse transition active:scale-95"
        >
          <IoVolumeMute size={16} className="text-amber-400" />
          <span>Tap for sound 🔊</span>
        </div>
      )}

      {/* Play/Pause icon indicator when paused */}
      {!isPlaying && (
        <div
          onClick={handleVideoTap}
          className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-auto z-10"
        >
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border border-white/20">
            <IoPlay size={32} className="ml-1" />
          </div>
        </div>
      )}

      {/* Double Tap Jumping Instagram Heart */}
      {showHeartAnim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
          <IoHeart size={110} className="text-red-500 fill-current drop-shadow-[0_10px_20px_rgba(239,68,68,0.8)]" />
        </div>
      )}

      {/* Right Action Bar (Identical to Instagram) */}
      <div className="absolute right-3 bottom-14 flex flex-col items-center gap-4.5 z-20">
        {/* Like Button */}
        <button
          onClick={handleToggleLike}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
              isLikedLocally ? "text-red-500 scale-110" : "text-white hover:text-white/80"
            }`}
          >
            {isLikedLocally ? (
              <IoHeart size={28} className="text-red-500 fill-current drop-shadow-md animate-bounce-short" />
            ) : (
              <IoHeartOutline size={28} className="drop-shadow-md" />
            )}
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(likesCount)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => onOpenComments(reel)}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white/80 transition">
            <IoChatbubbleEllipses size={26} className="drop-shadow-md" />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(reel.comments?.length || 240)}
          </span>
        </button>

        {/* Direct Share Button */}
        <button
          onClick={() => onOpenShare(reel)}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white/80 transition">
            <IoPaperPlane size={24} className="-rotate-12 ml-0.5 drop-shadow-md" />
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(reel.sharesCount || 420)}
          </span>
        </button>

        {/* Save / Bookmark Button */}
        <button
          onClick={() => {
            setIsSaved(!isSaved);
            toast.success(isSaved ? "Removed from Saved" : "Saved to your Collection 🔖", { id: "save-toast", duration: 1200 });
          }}
          className="flex flex-col items-center group transition active:scale-125"
        >
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white/80 transition">
            {isSaved ? (
              <IoBookmark size={24} className="text-white fill-current drop-shadow-md" />
            ) : (
              <IoBookmarkOutline size={24} className="drop-shadow-md" />
            )}
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Save
          </span>
        </button>

        {/* Audio Mute/Unmute Toggle Button */}
        <button
          onClick={onToggleMute}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white/80 transition active:scale-110"
        >
          {isMuted ? (
            <IoVolumeMute size={24} className="drop-shadow-md text-amber-400" />
          ) : (
            <IoVolumeHigh size={24} className="drop-shadow-md" />
          )}
        </button>

        {/* 3 Dots Menu Button */}
        <button
          onClick={() => toast("Instagram Reel Options", { id: "menu-toast", duration: 1000 })}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white/80 transition active:scale-110"
        >
          <IoEllipsisVertical size={20} className="drop-shadow-md" />
        </button>

        {/* Rotating Music Vinyl Disc with Album Art */}
        <div className="relative mt-1">
          <div
            className={`w-10 h-10 rounded-full border-2 border-white/80 p-0.5 bg-gradient-to-tr from-gray-900 via-gray-800 to-black flex items-center justify-center shadow-xl ${
              isPlaying ? "animate-spin" : ""
            }`}
            style={{ animationDuration: "3.5s" }}
          >
            <img
              src={reel.musicCover || creatorAvatar}
              alt="Song Art"
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.src = creatorAvatar;
              }}
            />
          </div>
          {/* Floating musical note indicator */}
          {isPlaying && (
            <IoMusicalNotes
              size={12}
              className="absolute -top-1 -right-1 text-pink-400 animate-bounce drop-shadow"
            />
          )}
        </div>
      </div>

      {/* Bottom Left Creator, Caption & Bollywood Song Overlay */}
      <div className="absolute left-4 bottom-5 right-16 z-20 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        {/* Creator Info + Instagram Follow Button */}
        <div className="flex items-center gap-2 mb-2">
          {/* Creator Avatar with Instagram gradient story border */}
          <div className="p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full shrink-0">
            <img
              src={creatorAvatar}
              alt={creatorName}
              className="w-8 h-8 rounded-full object-cover border border-black shrink-0"
              onError={(e) => {
                e.target.src = "https://api.dicebear.com/10.x/personas/svg?seed=Creator";
              }}
            />
          </div>

          <h4 className="font-bold text-xs text-white tracking-wide truncate max-w-[150px] flex items-center gap-1">
            @{creatorName}
            <IoCheckmarkCircle size={14} className="text-blue-400 shrink-0" />
          </h4>

          {/* Follow Button */}
          <button
            onClick={() => {
              setIsFollowing(!isFollowing);
              toast.success(isFollowing ? "Unfollowed" : "Following @ " + creatorName);
            }}
            className={`ml-1 px-3 py-1 rounded-lg text-[11px] font-semibold transition active:scale-95 ${
              isFollowing
                ? "bg-white/20 text-white border border-white/40"
                : "bg-transparent text-white border border-white hover:bg-white/20"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-xs text-gray-100 line-clamp-2 max-w-sm mb-2.5 font-normal leading-relaxed drop-shadow-md">
            {reel.caption}
          </p>
        )}

        {/* Bollywood Music Sound Bar with Animated Equalizer Bars */}
        <div className="flex items-center gap-2 text-[11px] text-white bg-black/50 backdrop-blur-md px-3 py-1 rounded-full w-fit max-w-[270px] border border-white/15 shadow-lg">
          {/* Animated 4 Equalizer Bars */}
          <div className="flex items-end gap-[2px] h-3 shrink-0">
            <span className="w-[2px] h-full bg-pink-400 animate-pulse" />
            <span className="w-[2px] h-2 bg-pink-400 animate-ping" />
            <span className="w-[2px] h-3 bg-pink-400 animate-bounce" />
            <span className="w-[2px] h-1.5 bg-pink-400 animate-pulse" />
          </div>
          <span className="truncate font-medium tracking-wide">
            {reel.musicTitle || "Original Audio • Trending Sound 🎵"}
          </span>
        </div>
      </div>

      {/* Instagram Bottom Video Progress Bar (1px-2px moving bar) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20 z-40">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Main Reels View (Instagram Style)
const ReelsModal = () => {
  const { isReelsOpen, reels, loading } = useSelector((store) => store.reel);
  const { authUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCommentsReel, setSelectedCommentsReel] = useState(null);
  const [selectedShareReel, setSelectedShareReel] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [feedReels, setFeedReels] = useState([]);

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

  // Shuffle helper for fresh variety
  const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

  // Initialize and append feedReels for endless infinite scroll
  useEffect(() => {
    if (reels && reels.length > 0) {
      setFeedReels([...reels]);
    }
  }, [reels]);

  // Infinite Scroll: automatically append shuffled batch when user scrolls near the end!
  useEffect(() => {
    if (reels && reels.length > 0 && feedReels.length > 0 && activeIndex >= feedReels.length - 2) {
      setFeedReels((prev) => [...prev, ...shuffleArray(reels)]);
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

  // Keyboard navigation for Instagram desktop experience (Up/Down arrow, m, Escape)
  useEffect(() => {
    if (!isReelsOpen) return;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (containerRef.current) {
          const nextIndex = Math.min(feedReels.length - 1, activeIndex + 1);
          containerRef.current.scrollTo({
            top: nextIndex * containerRef.current.clientHeight,
            behavior: "smooth",
          });
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        if (containerRef.current) {
          const prevIndex = Math.max(0, activeIndex - 1);
          containerRef.current.scrollTo({
            top: prevIndex * containerRef.current.clientHeight,
            behavior: "smooth",
          });
        }
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === "Escape") {
        dispatch(setIsReelsOpen(false));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReelsOpen, activeIndex, feedReels.length]);

  if (!isReelsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-fade-in select-none">
      {/* Top Instagram Header */}
      <div className="absolute top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
        {/* Back Button */}
        <button
          onClick={() => dispatch(setIsReelsOpen(false))}
          className="flex items-center gap-1.5 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95"
        >
          <IoArrowBack size={18} />
          <span>Chats</span>
        </button>

        {/* Reels Title (Instagram style) */}
        <div className="flex items-center gap-1.5">
          <h2 className="text-white font-extrabold text-lg tracking-wide italic font-serif">
            Reels
          </h2>
        </div>

        {/* Create / Post Reel Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1 text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-90 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95"
        >
          <IoAddCircle size={17} />
          <span>Post</span>
        </button>
      </div>

      {/* Main Snap Scroll Container (9:16 aspect ratio feel) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full max-w-[440px] h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative shadow-2xl bg-black"
        style={{ scrollbarWidth: "none" }}
      >
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
            <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading Bollywood reels...</p>
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
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-xs font-semibold"
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

      {/* Comments Drawer */}
      <ReelCommentsDrawer
        reel={selectedCommentsReel}
        isOpen={Boolean(selectedCommentsReel)}
        onClose={() => setSelectedCommentsReel(null)}
      />

      {/* Share Modal */}
      <ShareReelModal
        reel={selectedShareReel}
        isOpen={Boolean(selectedShareReel)}
        onClose={() => setSelectedShareReel(null)}
      />

      {/* Upload Modal */}
      <UploadReelModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default ReelsModal;
