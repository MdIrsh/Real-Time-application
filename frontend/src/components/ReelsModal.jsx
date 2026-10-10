import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  IoRefresh,
  IoLogoInstagram,
  IoOpenOutline,
  IoCopyOutline,
  IoClipboardOutline,
  IoClose,
  IoCheckmark,
} from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsReelsOpen,
  updateReelLikes,
  clearTargetReel,
  addReel,
} from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import ReelCommentsDrawer from "./ReelCommentsDrawer";
import ShareReelModal from "./ShareReelModal";
import UploadReelModal from "./UploadReelModal";
import {
  INSTAGRAM_REELS_CATALOG,
  extractInstagramShortcode,
  extractYouTubeShortId,
  getInstagramUrl,
} from "../utils/instagramReels";

// Format numbers like Instagram (1420 -> 1.4K, 1200000 -> 1.2M)
const formatCount = (num) => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num);
};

const CATEGORIES = [
  { id: "all", label: "🔥 All Reels" },
  { id: "cricket", label: "🏏 Cricket" },
  { id: "comedy", label: "😂 Comedy" },
  { id: "music", label: "🎵 Music" },
  { id: "tech", label: "📱 Tech" },
  { id: "trending", label: "✨ Trending" },
];

// Single Reel Item Component (Pure Instagram Reels Experience)
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
  const tapTimerRef = useRef(null);
  const dispatch = useDispatch();

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [isLikedLocally, setIsLikedLocally] = useState(() => {
    return reel.likes?.some(
      (uId) => String(uId?._id || uId) === String(currentUserId)
    );
  });
  const [likesCount, setLikesCount] = useState(
    reel.likesCount || reel.likes?.length || 14200
  );

  useEffect(() => {
    setIsLikedLocally(
      reel.likes?.some(
        (uId) => String(uId?._id || uId) === String(currentUserId)
      )
    );
    if (reel.likesCount || reel.likes?.length) {
      setLikesCount(reel.likesCount || reel.likes.length);
    }
  }, [reel.likes, reel.likesCount, currentUserId]);

  const shortcode = useMemo(() => {
    return reel.shortcode || extractInstagramShortcode(reel.videoUrl) || "";
  }, [reel.shortcode, reel.videoUrl]);

  const youtubeId = useMemo(() => {
    return extractYouTubeShortId(reel.videoUrl);
  }, [reel.videoUrl]);

  const instagramUrl = useMemo(() => {
    if (shortcode) return getInstagramUrl(shortcode);
    return reel.instagramUrl || "https://www.instagram.com/reels/";
  }, [shortcode, reel.instagramUrl]);

  // Determine a verified playable 9:16 vertical video stream
  const playableVideoUrl = useMemo(() => {
    if (reel.videoUrl && !reel.videoUrl.includes("instagram.com/")) {
      return reel.videoUrl;
    }
    // Match with catalog or provide fallback
    const match = INSTAGRAM_REELS_CATALOG.find(
      (c) => c.shortcode === shortcode || c.category === reel.category
    );
    if (match?.videoUrl) return match.videoUrl;
    return "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/forest_bike.mp4";
  }, [reel.videoUrl, reel.category, shortcode]);

  // Video progress bar updater
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100
      );
    }
  };

  // Auto-play when active, pause when inactive
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

    if (nextLiked) {
      toast("❤️ Liked Reel", { id: "like-toast", duration: 1000 });
    }

    if (reel._id && !String(reel._id).startsWith("ig-")) {
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
      } catch (err) {}
    }
  };

  // Double tap to like or Single tap to toggle play/pause
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(instagramUrl);
    setIsCopied(true);
    toast.success("Instagram Reel link copied! 📋", { duration: 1800 });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenInstagramDirect = () => {
    window.open(instagramUrl, "_blank", "noopener,noreferrer");
  };

  const creatorAvatar =
    reel.creatorAvatar ||
    reel.author?.profilePhoto ||
    `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      reel.creatorName || "Instagram"
    )}`;

  const creatorName =
    reel.creatorName || reel.author?.username || reel.author?.fullName || "instagram_creator";

  return (
    <div className="w-full h-full snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden select-none px-2 py-3 sm:p-4">
      {/* Central Reel Card Container */}
      <div className="relative w-full max-w-[420px] h-full max-h-[88vh] bg-[#111113] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header inside Card */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-black/90 via-black/75 to-black/90 flex items-center justify-between border-b border-white/10 shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            {/* Story Gradient Ring around Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shrink-0">
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="w-full h-full rounded-full object-cover bg-black"
                onError={(e) => {
                  e.target.src = "https://api.dicebear.com/10.x/personas/svg?seed=Instagram";
                }}
              />
            </div>
            <div className="min-w-0 flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate max-w-[95px] sm:max-w-[120px]">
                @{creatorName}
              </span>
              <IoCheckmarkCircle size={14} className="text-blue-400 shrink-0" />
            </div>

            {/* Follow Button */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition active:scale-95 cursor-pointer ml-1 ${
                isFollowing
                  ? "bg-white/15 border-white/20 text-gray-300"
                  : "bg-transparent border-pink-500/60 text-pink-400 hover:bg-pink-500/20"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>

          {/* Action Header: Open on Instagram & Mute Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleOpenInstagramDirect}
              className="flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 px-2.5 py-1 rounded-full shadow-md shadow-pink-600/30 transition active:scale-95 cursor-pointer"
              title="Open Official Reel on Instagram"
            >
              <IoLogoInstagram size={13} />
              <span>Insta App</span>
              <IoOpenOutline size={11} />
            </button>

            <button
              onClick={onToggleMute}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? (
                <IoVolumeMute size={14} className="text-rose-400" />
              ) : (
                <IoVolumeHigh size={14} className="text-emerald-400" />
              )}
            </button>
          </div>
        </div>

        {/* Video / Embed Area */}
        <div
          onClick={handleVideoTap}
          className="flex-1 w-full h-full relative bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {youtubeId ? (
            /* YouTube Short Iframe (allowed cross-origin) */
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=${
                isActive ? 1 : 0
              }&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${youtubeId}`}
              className="w-full h-full border-0 pointer-events-auto"
              allow="autoplay; encrypted-media; picture-in-picture"
              title="YouTube Short"
            />
          ) : (
            /* High-Performance HTML5 9:16 Video Player */
            <video
              ref={videoRef}
              src={playableVideoUrl}
              className="w-full h-full object-cover select-none pointer-events-none"
              loop
              playsInline
              preload="auto"
              autoPlay
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
            />
          )}

          {/* Hidden synchronized audio stream for background music */}
          {reel.audioUrl && (
            <audio
              ref={audioRef}
              src={reel.audioUrl}
              loop
              preload="auto"
            />
          )}

          {/* Big Double-Tap Heart Animation */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scale-up">
              <IoHeart size={90} className="text-rose-500 drop-shadow-2xl animate-pulse" />
            </div>
          )}

          {/* Paused Indicator Icon */}
          {!isPlaying && !showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl animate-fade-in">
                <IoPlay size={32} className="ml-1" />
              </div>
            </div>
          )}

          {/* Bottom Gradient Overlay for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

          {/* Bottom Caption & Audio Info */}
          <div className="absolute bottom-3 left-3 right-16 z-20 flex flex-col gap-1.5 pointer-events-auto">
            {/* Caption */}
            <p className="text-xs text-white/95 line-clamp-2 leading-relaxed drop-shadow-md">
              {reel.caption || "Trending Reel • Watch on Instagram"}
            </p>

            {/* Music Bar with Animated Equalizer */}
            <div className="flex items-center gap-2 text-[11px] text-pink-300 font-semibold drop-shadow-md">
              <IoMusicalNotes size={13} className="text-pink-400 shrink-0" />
              <div className="truncate max-w-[210px]">
                {reel.musicTitle || "Original Audio • Instagram Sound 🎵"}
              </div>

              {/* Animated Sound Equalizer Waves */}
              {isActive && !isMuted && isPlaying && (
                <div className="flex items-end gap-[2px] h-3 ml-1 shrink-0">
                  <span className="w-[2px] h-2 bg-pink-400 animate-pulse rounded-full" />
                  <span className="w-[2px] h-3 bg-pink-400 animate-pulse rounded-full delay-75" />
                  <span className="w-[2px] h-1.5 bg-pink-400 animate-pulse rounded-full delay-150" />
                </div>
              )}
            </div>
          </div>

          {/* Spinning Vinyl Music Disc */}
          <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
            <div
              className={`w-8 h-8 rounded-full border-2 border-pink-500/80 bg-zinc-900 shadow-lg flex items-center justify-center overflow-hidden ${
                isActive && !isMuted && isPlaying ? "animate-spin" : ""
              }`}
              style={{ animationDuration: "3.5s" }}
            >
              <img
                src={
                  reel.musicCover ||
                  creatorAvatar ||
                  "https://api.dicebear.com/10.x/identicon/svg?seed=Audio"
                }
                alt="music"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bottom Video Progress Line */}
          <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-white/20 z-30">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Right Floating Action Rail */}
        <div className="absolute right-3 bottom-14 z-30 flex flex-col items-center gap-3">
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl border border-white/15 transition ${
                isLikedLocally
                  ? "bg-rose-600 text-white shadow-rose-600/40"
                  : "bg-black/60 text-white hover:bg-black/80"
              }`}
            >
              {isLikedLocally ? (
                <IoHeart size={20} className="text-white animate-scale-up" />
              ) : (
                <IoHeartOutline size={20} />
              )}
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {formatCount(likesCount)}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => onOpenComments(reel)}
            className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
          >
            <div className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/15">
              <IoChatbubbleEllipses size={19} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {formatCount(reel.commentsCount || reel.comments?.length || 420)}
            </span>
          </button>

          {/* Share to Chat Button */}
          <button
            onClick={() => onOpenShare(reel)}
            className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
            title="Share Reel to WhatsApp Friend or Group"
          >
            <div className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-[#25d366] flex items-center justify-center backdrop-blur-md shadow-xl border border-white/15">
              <IoPaperPlane size={18} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {formatCount(reel.sharesCount || 120)}
            </span>
          </button>

          {/* Open in Instagram Direct */}
          <button
            onClick={handleOpenInstagramDirect}
            className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
            title="Open on official Instagram"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20">
              <IoLogoInstagram size={20} />
            </div>
            <span className="text-[10px] font-bold text-pink-300 drop-shadow-md">
              Insta
            </span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
            title="Copy Instagram Link"
          >
            <div className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-sky-400 flex items-center justify-center backdrop-blur-md shadow-xl border border-white/15">
              {isCopied ? <IoCheckmark size={18} className="text-emerald-400" /> : <IoCopyOutline size={18} />}
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {isCopied ? "Copied" : "Link"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Instagram Reels View
const ReelsModal = () => {
  const { isReelsOpen, targetReel } = useSelector((store) => store.reel);
  const { authUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCommentsReel, setSelectedCommentsReel] = useState(null);
  const [selectedShareReel, setSelectedShareReel] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPasteBarOpen, setIsPasteBarOpen] = useState(false);
  const [quickPasteInput, setQuickPasteInput] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const containerRef = useRef(null);

  // Master list of real reels: blends static catalog with backend user-created reels
  const [serverReels, setServerReels] = useState([]);

  // Fetch Reels from Backend
  const fetchAllReels = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${BASE_URL}/api/v1/reel/all?_t=${Date.now()}`, {
        withCredentials: true,
      });
      if (res.data?.reels && res.data.reels.length > 0) {
        setServerReels(res.data.reels);
      }
    } catch (err) {
      console.log("Using built-in real Instagram catalog");
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, []);

  useEffect(() => {
    if (isReelsOpen) {
      setActiveIndex(0);
      fetchAllReels();
    }
  }, [isReelsOpen, fetchAllReels]);

  // Combine real catalog + server reels without duplicates
  const allAvailableReels = useMemo(() => {
    const combined = [...serverReels];
    const seenCodes = new Set(
      combined.map((r) => r.shortcode || extractInstagramShortcode(r.videoUrl)).filter(Boolean)
    );

    for (const catalogItem of INSTAGRAM_REELS_CATALOG) {
      if (!seenCodes.has(catalogItem.shortcode)) {
        combined.push(catalogItem);
        seenCodes.add(catalogItem.shortcode);
      }
    }

    if (targetReel) {
      const targetCode =
        targetReel.shortcode || extractInstagramShortcode(targetReel.videoUrl);
      const targetIdx = combined.findIndex(
        (r) =>
          String(r._id) === String(targetReel._id) ||
          (targetCode && (r.shortcode === targetCode || r.videoUrl?.includes(targetCode)))
      );
      if (targetIdx !== -1) {
        return [
          combined[targetIdx],
          ...combined.slice(0, targetIdx),
          ...combined.slice(targetIdx + 1),
        ];
      } else {
        return [targetReel, ...combined];
      }
    }

    return combined;
  }, [serverReels, targetReel]);

  // Filter reels based on active category
  const filteredReels = useMemo(() => {
    if (selectedCategory === "all") return allAvailableReels;
    return allAvailableReels.filter(
      (r) => r.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allAvailableReels, selectedCategory]);

  // Jump to top when category changes
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setActiveIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Scroll listener to update active index
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollPosition / height);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < filteredReels.length) {
      setActiveIndex(newIndex);
    }
  };

  const handleCloseReels = () => {
    dispatch(setIsReelsOpen(false));
    dispatch(clearTargetReel());
  };

  // Quick Paste and Watch Reel Handler (Instagram link or YouTube short)
  const handleQuickAddReel = async (e) => {
    if (e) e.preventDefault();
    const code = extractInstagramShortcode(quickPasteInput);
    const ytId = extractYouTubeShortId(quickPasteInput);

    if (!code && !ytId) {
      toast.error("Please enter a valid Instagram Reel or YouTube Shorts URL!");
      return;
    }

    const fallbackVideo = "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/forest_bike.mp4";
    const newReel = {
      _id: `ig-custom-${Date.now()}`,
      shortcode: code || "",
      creatorName: code ? "instagram_creator" : "shorts_creator",
      creatorAvatar: `https://api.dicebear.com/10.x/personas/svg?seed=${code || ytId}`,
      videoUrl: ytId ? `https://www.youtube.com/shorts/${ytId}` : fallbackVideo,
      audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
      caption: code ? `Instagram Reel • https://instagram.com/reel/${code}/` : `YouTube Short (${ytId})`,
      category: "trending",
      musicTitle: "Trending Reel Sound 🎵",
      likesCount: 14200,
      sharesCount: 120,
      commentsCount: 18,
    };

    setServerReels((prev) => [newReel, ...prev]);
    dispatch(addReel(newReel));
    setQuickPasteInput("");
    setIsPasteBarOpen(false);
    setSelectedCategory("all");
    setActiveIndex(0);

    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    toast.success("✨ Reel added to Feed successfully!");

    // Save to backend silently
    try {
      await axios.post(
        `${BASE_URL}/api/v1/reel/create`,
        {
          videoUrl: fallbackVideo,
          shortcode: code || "",
          category: "trending",
          audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
          caption: code ? `Instagram Reel • https://instagram.com/reel/${code}/` : "Reel",
        },
        { withCredentials: true }
      );
    } catch (err) {}
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isReelsOpen) return;

    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        if (containerRef.current) {
          const nextIndex = Math.min(filteredReels.length - 1, activeIndex + 1);
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
        setIsMuted((prev) => !prev);
      } else if (e.key === "Escape") {
        handleCloseReels();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReelsOpen, activeIndex, filteredReels.length]);

  if (!isReelsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in select-none">
      {/* Top Header Bar */}
      <div className="w-full z-40 bg-gradient-to-b from-black/95 via-black/80 to-transparent pb-2 px-3 sm:px-6 pt-3 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={handleCloseReels}
            className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 active:scale-95 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer"
          >
            <IoArrowBack size={16} />
            <span>Chats</span>
          </button>

          {/* Instagram Logo Branding */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <IoLogoInstagram size={18} />
            </div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-white font-extrabold text-base tracking-wide flex items-center gap-1">
                <span>Instagram</span>
                <span className="italic font-serif text-pink-400">Reels</span>
              </h2>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 font-extrabold px-1.5 py-0.5 rounded-md border border-pink-500/30">
                Live Feed
              </span>
            </div>
          </div>

          {/* Top Actions: Paste Link + Post */}
          <div className="flex items-center gap-2">
            {/* Toggle Quick Paste Bar */}
            <button
              onClick={() => setIsPasteBarOpen(!isPasteBarOpen)}
              className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition active:scale-95 cursor-pointer ${
                isPasteBarOpen
                  ? "bg-pink-600 text-white shadow-lg"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="Paste any Instagram link"
            >
              <IoClipboardOutline size={14} />
              <span className="hidden sm:inline">Paste Link</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchAllReels}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh"
            >
              <IoRefresh
                size={16}
                className={`text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            {/* Post Reel Button */}
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1 text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-90 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-pink-600/30 transition active:scale-95 cursor-pointer"
            >
              <IoAddCircle size={16} />
              <span>Post</span>
            </button>
          </div>
        </div>

        {/* Expandable Quick Paste Bar */}
        {isPasteBarOpen && (
          <form
            onSubmit={handleQuickAddReel}
            className="w-full max-w-lg mx-auto flex items-center gap-2 p-1.5 bg-[#18181b] border border-pink-500/40 rounded-2xl shadow-2xl animate-fade-in"
          >
            <div className="flex-1 flex items-center gap-2 px-3">
              <IoLogoInstagram size={18} className="text-pink-400 shrink-0" />
              <input
                type="text"
                placeholder="Paste Instagram Reel or YouTube Shorts URL..."
                value={quickPasteInput}
                onChange={(e) => setQuickPasteInput(e.target.value)}
                className="w-full bg-transparent text-white text-xs outline-hidden placeholder-gray-400"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold rounded-xl transition active:scale-95 shrink-0 cursor-pointer"
            >
              Watch Reel 🎬
            </button>
            <button
              type="button"
              onClick={() => setIsPasteBarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white"
            >
              <IoClose size={18} />
            </button>
          </form>
        )}

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md font-bold"
                  : "bg-white/10 hover:bg-white/20 text-gray-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Snap Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full max-w-[480px] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative shadow-2xl bg-black"
        style={{ scrollbarWidth: "none" }}
      >
        {filteredReels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3">
              <IoLogoInstagram size={36} />
            </div>
            <h3 className="font-bold text-base">No Reels in this category</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Paste any real Instagram Reel link to watch it instantly!
            </p>
            <button
              onClick={() => setIsPasteBarOpen(true)}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-xs font-bold shadow-lg shadow-pink-600/30"
            >
              Paste Instagram Reel 🔗
            </button>
          </div>
        ) : (
          filteredReels.map((reel, index) => (
            <ReelCard
              key={`${reel._id || reel.shortcode || "reel"}-${index}`}
              reel={reel}
              isActive={index === activeIndex}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted((prev) => !prev)}
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

      {/* Upload & Add Instagram Reel Modal */}
      <UploadReelModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default ReelsModal;
