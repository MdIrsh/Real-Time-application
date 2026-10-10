import React, { useState, useEffect, useRef, useCallback } from "react";
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
  IoRefresh,
} from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import {
  setIsReelsOpen,
  setReels,
  updateReelLikes,
  setReelsLoading,
  clearTargetReel,
} from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";
import ReelCommentsDrawer from "./ReelCommentsDrawer";
import ShareReelModal from "./ShareReelModal";
import UploadReelModal from "./UploadReelModal";
import { BOLLYWOOD_200_SONGS } from "../utils/bollywoodSongs200";

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
        autoPlay
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

// Dynamic Creators, Videos, Captions, and Songs for Truly Unlimited Endless Reels
const DYNAMIC_CREATORS = [
  { name: "ayush_travels_india", seed: "AyushTravels" },
  { name: "priya_choreography", seed: "PriyaDance" },
  { name: "rohit_mumbai_vlogs", seed: "RohitMumbai" },
  { name: "kashi_banaras_diaries", seed: "BanarasKashi" },
  { name: "dj_gurpreet_singh", seed: "GurpreetSingh" },
  { name: "delhi_foodie_junction", seed: "DelhiFoodie" },
  { name: "kashmir_paradise_vlogs", seed: "AanyaKashmir" },
  { name: "speed_drives_india", seed: "IndiaDrives" },
  { name: "college_ke_din", seed: "CollegeKeDin" },
  { name: "jaipur_royals_heritage", seed: "JaipurRoyals" },
  { name: "desi_akhada_fitness", seed: "PahalwanFitness" },
  { name: "kerala_gods_own_country", seed: "KeralaTravel" },
  { name: "kolkata_city_of_joy", seed: "KolkataCity" },
  { name: "chai_aur_baarish", seed: "ChaiLover" },
  { name: "goa_vibes_unlimited", seed: "GoaBeaches" },
  { name: "himachal_wanderlust", seed: "HimachalHills" },
  { name: "sharma_ji_comedy", seed: "SharmaJiComedy" },
  { name: "ananya_lifestyle_vlogs", seed: "AnanyaLife" },
  { name: "desi_fitness_club", seed: "DesiFitness" },
  { name: "bollywood_mashups_dj", seed: "BollyDj" },
  { name: "punjabi_swag_beats", seed: "PunjabiSwag" },
  { name: "royal_udaipur_diaries", seed: "UdaipurPalace" },
  { name: "street_dance_crew_in", seed: "StreetDanceCrew" },
  { name: "nature_cinematics_in", seed: "NatureCinematics" },
];

const DYNAMIC_VIDEOS = [
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/sea_turtle.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/snow_horses.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/driver-action-recognition.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female-and-male.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking-and-pause.mp4",
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/elephants.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
  "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/bottle-detection.mp4",
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/dog.mp4",
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/rooster.mp4",
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/finish_line.mp4",
  "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/race_horses.mp4",
];

const DYNAMIC_CAPTIONS = [
  "Mumbai ki shaam aur Marine Drive par cutting chai ☕🌅 Yeh sukoon kahin aur nahi! #mumbai #kesariya #sukoon #bollywood",
  "Subah-e-Banaras aur Dashashwamedh Ghat ki pavitra aarti 🕉️✨ Har Har Mahadev! #varanasi #kashi #gangaaarti #apnabanale",
  "Desi shaadi me Bhangra aur Punjabi Dhol ka swag alag hi hota hai! 🕺🥁 #taubatauba #punjabi #bhangra #viral",
  "Chandni Chowk ke spicy chole bhature aur garam rabdi jalebi 🍛😋 #delhifood #streetfood #chaleya #jawan",
  "Gar firdaus bar roo-e zameen ast... Kashmir sach me jannat hai! ❄️🏔️ #kashmir #gulmarg #heeriye #travel",
  "Mumbai-Pune expressway par late night drive aur Shershaah gaane 🚗💨 #raataanlambiyan #nightdrive #longdrive",
  "College ke woh befikre din aur backbench ki dosti! 🎓❤️ Tag your best friends. #collegelife #dosti #tumhiho",
  "Padharo Mhare Desh! 🏰🦚 Pink City Jaipur ka shahi andaaz aur Hawa Mahal. #jaipur #rajasthan #lutgaye",
  "Desi akhada, mitti aur sachhi mehnat! Haar mat maano 💪🇮🇳 #fitness #hardwork #jaihind #zinda",
  "God's Own Country Kerala 🐘🌴 Munnar ke haseen pahad aur backwaters boat ride. #kerala #munnar #ilahi",
  "Howrah bridge ki shaam aur yellow taxi ka suhana safar 🚕💛 #kolkata #cityofjoy #howrah #kabira",
  "Baarish ka mausam aur garam kulhad wali adrak chai ☕🌧️ Isse better sukoon kuch nahi! #chai #baarish #desivibes",
  "Goa ke sun-kissed beaches aur sunset acoustic vibes 🏖️🌊 Life is good! #goa #beachlife #sunsetvibes",
  "Himachal ke snowy peaks aur Pahadi chai 🏔️❄️ Tag someone who loves mountains! #himachal #manali #travelgram",
  "Late night car drives with Bollywood classics hits different 🚗🌌 #nightvibes #bollywoodsongs #nostalgia",
  "Wedding season hook steps! Desi dance energy on fire 🔥💃 #desidance #shaadivibes #bollywooddance",
  "Rooftop acoustic jam session with friends 🎸✨ Music is peace! #acoustic #bollywoodcovers #weekendvibes",
  "Morning trek in the Western Ghats 🌿⛰️ Foggy mornings and cold air! #trekking #naturelover #exploreindia",
];

// Generates dynamic reels on demand powered by 200+ Hit Bollywood songs catalog
const generateBatchOfReels = (count = 15, startIndex = 0) => {
  const batch = [];
  const totalSongs = BOLLYWOOD_200_SONGS.length;
  // Session random seeds ensure that every refresh and scroll serves fresh combinations
  const seedSongOffset = Math.floor(Math.random() * totalSongs);
  const seedVideoOffset = Math.floor(Math.random() * DYNAMIC_VIDEOS.length);
  const seedCreatorOffset = Math.floor(Math.random() * DYNAMIC_CREATORS.length);

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const video = DYNAMIC_VIDEOS[(seedVideoOffset + idx) % DYNAMIC_VIDEOS.length];
    // Spread across the 200+ Bollywood hit catalog with prime stride
    const songIndex = (seedSongOffset + idx * 7) % totalSongs;
    const song = BOLLYWOOD_200_SONGS[songIndex];
    const creator = DYNAMIC_CREATORS[(seedCreatorOffset + idx) % DYNAMIC_CREATORS.length];
    const baseCaption = DYNAMIC_CAPTIONS[(idx * 11 + 5) % DYNAMIC_CAPTIONS.length];
    const uniqueId = `reel-inf-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;

    batch.push({
      _id: uniqueId,
      creatorName: creator.name,
      creatorAvatar: `https://api.dicebear.com/10.x/personas/svg?seed=${creator.seed}_${(idx + seedCreatorOffset) % 40}`,
      videoUrl: video,
      audioUrl: song.audioUrl,
      musicTitle: song.title,
      musicCover: song.coverUrl,
      caption: `${baseCaption} 🎵 #${song.category.replace(/[^a-zA-Z0-9]/g, "")}`,
      likes: Array.from({ length: ((idx * 317 + 1420) % 24000) + 800 }),
      sharesCount: ((idx * 613 + 420) % 36000) + 400,
      comments: [
        {
          userName: `user_${(idx * 17) % 89 + 10}`,
          userAvatar: `https://api.dicebear.com/10.x/lorelei/svg?seed=Commenter${(idx + seedCreatorOffset) % 40}`,
          text: `Pure Bollywood vibe! Loved this ❤️🔥 #${song.category}`,
          createdAt: new Date(),
        },
      ],
    });
  }
  return batch;
};

// Main Reels View (Instagram Style)
const ReelsModal = () => {
  const { isReelsOpen, reels, loading, targetReel } = useSelector(
    (store) => store.reel
  );
  const { authUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCommentsReel, setSelectedCommentsReel] = useState(null);
  const [selectedShareReel, setSelectedShareReel] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [feedReels, setFeedReels] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef(null);
  const isAppendingRef = useRef(false);

  // Fisher-Yates array shuffle for true randomized fresh feed
  const shuffleArray = useCallback((arr) => {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, []);

  // Builder for initial endless feed: user reels + demo reels + 25 dynamic reels
  // If a targetReel was shared/clicked, prioritize it at the top (index 0)
  const buildInitialFeed = useCallback(
    (sourceList = []) => {
      const baseList = sourceList.length > 0 ? shuffleArray(sourceList) : [];
      let combined = baseList;
      if (targetReel) {
        const existingIdx = combined.findIndex(
          (r) =>
            String(r._id) === String(targetReel._id) ||
            (targetReel.videoUrl && r.videoUrl === targetReel.videoUrl)
        );
        if (existingIdx !== -1) {
          combined = [
            combined[existingIdx],
            ...combined.slice(0, existingIdx),
            ...combined.slice(existingIdx + 1),
          ];
        } else {
          combined = [targetReel, ...combined];
        }
      }
      const generatedBuffer = generateBatchOfReels(25, combined.length);
      return [...combined, ...generatedBuffer];
    },
    [shuffleArray, targetReel]
  );

  // When a specific shared reel is clicked from chat, jump straight to it at index 0
  useEffect(() => {
    if (targetReel && isReelsOpen) {
      setFeedReels((prev) => {
        const existingIdx = prev.findIndex(
          (r) =>
            String(r._id) === String(targetReel._id) ||
            (targetReel.videoUrl && r.videoUrl === targetReel.videoUrl)
        );
        if (existingIdx !== -1) {
          return [
            prev[existingIdx],
            ...prev.slice(0, existingIdx),
            ...prev.slice(existingIdx + 1),
          ];
        }
        return [targetReel, ...prev];
      });
      setActiveIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [targetReel, isReelsOpen]);

  // Seamless batch appender for infinite endless scrolling
  const appendFreshBatch = useCallback(() => {
    if (isAppendingRef.current) return;
    isAppendingRef.current = true;

    setFeedReels((prev) => {
      const newItems = generateBatchOfReels(15, prev.length);
      return [...prev, ...newItems];
    });

    setTimeout(() => {
      isAppendingRef.current = false;
    }, 300);
  }, []);

  // Refresh handler to fetch and rebuild fresh endless reels
  const handleRefreshReels = async () => {
    try {
      setIsRefreshing(true);
      const res = await axios.get(`${BASE_URL}/api/v1/reel/all?_t=${Date.now()}`, {
        withCredentials: true,
      });

      let freshList = [];
      if (res.data?.reels && res.data.reels.length > 0) {
        freshList = res.data.reels;
      } else if (reels && reels.length > 0) {
        freshList = reels;
      }

      const unlimitedFeed = buildInitialFeed(freshList);
      dispatch(setReels(unlimitedFeed));
      setFeedReels(unlimitedFeed);
      setActiveIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      toast.success("✨ Unlimited Reels Feed Refreshed!", {
        id: "reels-refresh-toast",
        duration: 1800,
        icon: "♾️",
      });
    } catch (err) {
      console.error("Refresh reels error:", err);
      const unlimitedFeed = buildInitialFeed(reels || []);
      setFeedReels(unlimitedFeed);
      setActiveIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
      toast.success("✨ Endless Reels Shuffled!", {
        id: "reels-refresh-toast",
        duration: 1800,
        icon: "♾️",
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Fetch Reels on mount or when opening (randomized + unlimited buffer)
  useEffect(() => {
    if (isReelsOpen) {
      const fetchReels = async () => {
        try {
          dispatch(setReelsLoading(true));
          const res = await axios.get(`${BASE_URL}/api/v1/reel/all?_t=${Date.now()}`, {
            withCredentials: true,
          });
          if (res.data?.reels) {
            const unlimitedFeed = buildInitialFeed(res.data.reels);
            dispatch(setReels(unlimitedFeed));
            setFeedReels(unlimitedFeed);
            setActiveIndex(0);
          } else {
            const fallbackFeed = buildInitialFeed([]);
            setFeedReels(fallbackFeed);
            setActiveIndex(0);
          }
        } catch (err) {
          console.error("Error fetching reels:", err);
          const fallbackFeed = buildInitialFeed([]);
          setFeedReels(fallbackFeed);
          setActiveIndex(0);
        } finally {
          dispatch(setReelsLoading(false));
        }
      };

      fetchReels();
    }
  }, [isReelsOpen, dispatch, buildInitialFeed]);

  // Infinite Scroll Trigger: automatically append batch when approaching bottom
  useEffect(() => {
    if (feedReels.length > 0 && activeIndex >= feedReels.length - 3) {
      appendFreshBatch();
    }
  }, [activeIndex, feedReels.length, appendFreshBatch]);

  // Track active reel on scroll + trigger infinite append when near end
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollPosition = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollPosition / height);

    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < feedReels.length) {
      setActiveIndex(newIndex);
    }

    // Proactive infinite scroll: check if container scroll is within 2.5 screens of the bottom
    if (container.scrollTop + height >= container.scrollHeight - height * 2.5) {
      appendFreshBatch();
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

  const handleCloseReels = () => {
    dispatch(setIsReelsOpen(false));
    dispatch(clearTargetReel());
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
        handleCloseReels();
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
          onClick={handleCloseReels}
          className="flex items-center gap-1.5 text-white bg-black/40 hover:bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold transition active:scale-95"
        >
          <IoArrowBack size={18} />
          <span>Chats</span>
        </button>

        {/* Reels Title (Instagram style - Tap to Refresh) */}
        <div
          className="flex items-center gap-1.5 cursor-pointer group"
          onClick={handleRefreshReels}
          title="Tap to refresh reels feed"
        >
          <h2 className="text-white font-extrabold text-lg tracking-wide italic font-serif group-hover:text-pink-400 transition flex items-center gap-1.5">
            <span>Reels</span>
            <span className="text-[10px] not-italic font-sans bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-normal">
              🎵 200+ Bollywood Hits
            </span>
          </h2>
        </div>

        {/* Header Action Buttons: Refresh + Post */}
        <div className="flex items-center gap-2">
          {/* Refresh for New Reels Button */}
          <button
            onClick={handleRefreshReels}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-white bg-black/50 hover:bg-black/80 active:scale-95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold transition border border-white/15 shadow-md cursor-pointer disabled:opacity-50"
            title="Refresh for New Reels"
          >
            <IoRefresh
              size={15}
              className={`text-[#25d366] ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Create / Post Reel Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1 text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-90 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer"
          >
            <IoAddCircle size={17} />
            <span>Post</span>
          </button>
        </div>
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
