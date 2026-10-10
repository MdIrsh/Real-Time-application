import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  IoArrowBack,
  IoHeart,
  IoHeartOutline,
  IoChatbubbleEllipses,
  IoPaperPlane,
  IoAddCircle,
  IoCheckmarkCircle,
  IoRefresh,
  IoLogoInstagram,
  IoOpenOutline,
  IoCopyOutline,
  IoClipboardOutline,
  IoClose,
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
} from "../utils/instagramReels";

// Format numbers like Instagram (1420 -> 1.4K, 120000 -> 1.2M)
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

// Single Reel Item Component (Pure Real Instagram Reels Experience)
const ReelCard = ({
  reel,
  isActive,
  onOpenComments,
  onOpenShare,
  currentUserId,
}) => {
  const [isLikedLocally, setIsLikedLocally] = useState(() => {
    return reel.likes?.some(
      (uId) => String(uId?._id || uId) === String(currentUserId)
    );
  });
  const [likesCount, setLikesCount] = useState(
    reel.likesCount || reel.likes?.length || 14200
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const dispatch = useDispatch();

  const shortcode = useMemo(() => {
    return reel.shortcode || extractInstagramShortcode(reel.videoUrl) || "";
  }, [reel.shortcode, reel.videoUrl]);

  const instagramUrl = useMemo(() => {
    if (shortcode) return `https://www.instagram.com/reel/${shortcode}/`;
    return reel.videoUrl || "https://www.instagram.com/reels/";
  }, [shortcode, reel.videoUrl]);

  const embedUrl = useMemo(() => {
    if (shortcode) return `https://www.instagram.com/reel/${shortcode}/embed/`;
    return "";
  }, [shortcode]);

  const handleToggleLike = async () => {
    const nextLiked = !isLikedLocally;
    setIsLikedLocally(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (nextLiked) {
      toast("❤️ Liked Reel", { id: "like-toast", duration: 1000 });
    }

    if (reel._id && !reel._id.startsWith("ig-")) {
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(instagramUrl);
    setIsCopied(true);
    toast.success("Instagram Reel link copied! 📋", { duration: 1800 });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenInstagramDirect = () => {
    window.open(instagramUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full h-full snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden select-none px-2 py-3 sm:p-4">
      {/* Central Reel Card Container */}
      <div className="relative w-full max-w-[420px] h-full max-h-[88vh] bg-[#121212] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header inside Card */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-black/90 via-black/70 to-black/90 flex items-center justify-between border-b border-white/10 shrink-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] shrink-0">
              <img
                src={
                  reel.creatorAvatar ||
                  `https://api.dicebear.com/10.x/personas/svg?seed=${reel.creatorName || "Creator"}`
                }
                alt={reel.creatorName}
                className="w-full h-full rounded-full object-cover bg-black"
                onError={(e) => {
                  e.target.src = "https://api.dicebear.com/10.x/personas/svg?seed=Instagram";
                }}
              />
            </div>
            <div className="min-w-0 flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate">
                @{reel.creatorName || "instagram_creator"}
              </span>
              <IoCheckmarkCircle size={14} className="text-blue-400 shrink-0" />
            </div>
          </div>

          {/* Watch on Instagram Button */}
          <button
            onClick={handleOpenInstagramDirect}
            className="flex items-center gap-1 text-[11px] font-bold text-pink-400 hover:text-pink-300 bg-pink-500/15 hover:bg-pink-500/25 px-2.5 py-1 rounded-full border border-pink-500/30 transition active:scale-95 cursor-pointer shrink-0"
            title="Open on Instagram"
          >
            <IoLogoInstagram size={14} />
            <span>Open App</span>
            <IoOpenOutline size={12} />
          </button>
        </div>

        {/* Video / Embed Area */}
        <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
          {embedUrl ? (
            <>
              {/* Shimmer / Loading State until Iframe is ready */}
              {!isIframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#121212] z-10">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                    <IoLogoInstagram size={24} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    Loading Real Instagram Reel...
                  </p>
                </div>
              )}

              <iframe
                src={embedUrl}
                className="w-full h-full border-0 rounded-b-2xl bg-black"
                frameBorder="0"
                scrolling="no"
                allowTransparency="true"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title={`Instagram Reel ${shortcode}`}
                onLoad={() => setIsIframeLoaded(true)}
              />
            </>
          ) : (
            /* Fallback HTML5 Player for user uploaded MP4 videos */
            <video
              src={reel.videoUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
              loop
            />
          )}
        </div>

        {/* Right Floating Action Rail */}
        <div className="absolute right-3.5 bottom-6 z-30 flex flex-col items-center gap-3.5">
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

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition"
            title="Copy Instagram Link"
          >
            <div className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-sky-400 flex items-center justify-center backdrop-blur-md shadow-xl border border-white/15">
              <IoCopyOutline size={18} />
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
  const { isReelsOpen, targetReel } = useSelector(
    (store) => store.reel
  );
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

  // Quick Paste and Watch Reel Handler
  const handleQuickAddReel = async (e) => {
    if (e) e.preventDefault();
    const code = extractInstagramShortcode(quickPasteInput);
    if (!code) {
      toast.error("Please enter a valid Instagram Reel URL or ID!");
      return;
    }

    const newReel = {
      _id: `ig-custom-${Date.now()}`,
      shortcode: code,
      creatorName: "Instagram Creator",
      creatorAvatar: `https://api.dicebear.com/10.x/personas/svg?seed=${code}`,
      videoUrl: `https://www.instagram.com/reel/${code}/`,
      caption: `Instagram Reel (${code})`,
      category: "trending",
      likesCount: 14200,
      sharesCount: 120,
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

    toast.success("✨ Real Instagram Reel loaded into Feed!");

    // Save to backend silently
    try {
      await axios.post(
        `${BASE_URL}/api/v1/reel/create`,
        {
          videoUrl: `https://www.instagram.com/reel/${code}/`,
          shortcode: code,
          category: "trending",
          caption: "Instagram Reel",
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
                100% Real
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
                placeholder="Paste any Instagram Reel URL (e.g. instagram.com/reel/...)"
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
