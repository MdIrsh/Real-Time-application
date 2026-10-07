import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IoCheckmarkDoneSharp,
  IoCheckmarkSharp,
  IoPlayCircleOutline,
  IoPlay,
  IoCheckmarkCircle,
  IoMusicalNotes,
} from "react-icons/io5";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import { openSpecificReel } from "../redux/reelSlice";
import toast from "react-hot-toast";

// Helper to parse WhatsApp status reply and reaction messages
const parseStatusReply = (rawText) => {
  if (!rawText || typeof rawText !== "string") return null;

  // 1. JSON structured status reply: [STATUS_REPLY:{...}] replyText
  const replyMatch = rawText.match(/^\[STATUS_REPLY:(\{.*?\})\]\s*(.*)$/s);
  if (replyMatch) {
    try {
      const meta = JSON.parse(replyMatch[1]);
      return {
        type: "reply",
        caption: meta.caption || "",
        mediaUrl: meta.mediaUrl || "",
        mediaType: meta.mediaType || "text",
        bgColor: meta.bgColor || "#128c7e",
        songTitle: meta.songTitle || "",
        authorName: meta.authorName || "Status",
        text: replyMatch[2] || "",
      };
    } catch (e) {}
  }

  // 2. JSON structured status reaction: [STATUS_REACT:{...}]
  const reactMatch = rawText.match(/^\[STATUS_REACT:(\{.*?\})\]$/s);
  if (reactMatch) {
    try {
      const meta = JSON.parse(reactMatch[1]);
      return {
        type: "reaction",
        emoji: meta.emoji || "❤️",
        caption: meta.caption || "",
        mediaUrl: meta.mediaUrl || "",
        mediaType: meta.mediaType || "text",
        bgColor: meta.bgColor || "#128c7e",
        songTitle: meta.songTitle || "",
        authorName: meta.authorName || "Status",
      };
    } catch (e) {}
  }

  // 3. Fallback for legacy [Replied to status: "caption"] replyText
  const legacyReply = rawText.match(
    /^\[Replied to status:\s*"([^"]*)"\]\s*(.*)$/s
  );
  if (legacyReply) {
    return {
      type: "reply",
      caption: legacyReply[1] || "Status update",
      mediaUrl: "",
      mediaType: "text",
      bgColor: "#128c7e",
      songTitle: "",
      authorName: "Status",
      text: legacyReply[2] || "",
    };
  }

  // 4. Fallback for legacy [Reacted emoji to status: "caption"]
  const legacyReact = rawText.match(
    /^\[Reacted\s+(\S+)\s+to status:\s*"([^"]*)"\]$/s
  );
  if (legacyReact) {
    return {
      type: "reaction",
      emoji: legacyReact[1] || "❤️",
      caption: legacyReact[2] || "Status update",
      mediaUrl: "",
      mediaType: "text",
      bgColor: "#128c7e",
      songTitle: "",
      authorName: "Status",
    };
  }

  return null;
};

// Helper to parse shared Reel messages
const parseReelMessage = (rawText) => {
  if (!rawText || typeof rawText !== "string") return null;

  // 1. JSON structured reel share: [REEL_SHARE:{...}]
  const structuredMatch = rawText.match(/\[REEL_SHARE:(\{.*?\})\]/s);
  if (structuredMatch) {
    try {
      const meta = JSON.parse(structuredMatch[1]);
      return {
        _id: meta.reelId || meta._id || `reel-shared-${Date.now()}`,
        creatorName: meta.creatorName || "Instagram Creator",
        creatorAvatar: meta.creatorAvatar || "",
        videoUrl: meta.videoUrl,
        audioUrl: meta.audioUrl || "",
        musicTitle: meta.musicTitle || "Original Audio 🎵",
        caption: meta.caption || "",
        likes: meta.likes || [1, 2, 3],
        sharesCount: meta.sharesCount || 1,
        comments: meta.comments || [],
      };
    } catch (e) {}
  }

  // 2. Legacy format: "🎬 Watch this Reel by ... :\n"..."\n\nhttps://..."
  if (rawText.includes("🎬 Watch this Reel")) {
    const creatorMatch = rawText.match(/Watch this Reel by\s+@?([^:\n]+)/);
    const captionMatch = rawText.match(/"([^"]+)"/);
    const urlMatch = rawText.match(/(https?:\/\/[^\s]+)/);

    if (urlMatch) {
      return {
        _id: `reel-shared-${Date.now()}`,
        creatorName: creatorMatch ? creatorMatch[1].trim() : "Instagram Creator",
        creatorAvatar: "",
        videoUrl: urlMatch[1],
        audioUrl: "",
        musicTitle: "Original Audio • Trending Sound 🎵",
        caption: captionMatch ? captionMatch[1] : "Trending Reel",
        likes: [1, 2, 3],
        sharesCount: 1,
        comments: [],
      };
    }
  }

  // 3. Standalone video URL (.mp4 / .webm or Cloudinary video URL)
  const standaloneUrlMatch = rawText.trim().match(
    /^(https?:\/\/[^\s]+(?:\.mp4|\.webm|cloudinary\.com\/[^\s]+\/video\/upload[^\s]*))$/i
  );
  if (standaloneUrlMatch) {
    return {
      _id: `reel-shared-${Date.now()}`,
      creatorName: "Video Reel",
      creatorAvatar: "",
      videoUrl: standaloneUrlMatch[1],
      audioUrl: "",
      musicTitle: "Original Audio 🎵",
      caption: "Shared Video Reel",
      likes: [1, 2],
      sharesCount: 1,
      comments: [],
    };
  }

  return null;
};

// Render text with clickable links for any URLs
const renderClickableText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 dark:text-blue-400 underline hover:opacity-80 break-all cursor-pointer font-medium"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const Message = ({ message }) => {
  const scroll = useRef();
  const dispatch = useDispatch();
  const { authUser } = useSelector((store) => store.user);

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const msgSenderId =
    typeof message?.senderId === "object"
      ? message?.senderId?._id
      : message?.senderId;

  const isSentByMe =
    message?.isMe ||
    (authUser?._id && String(authUser._id) === String(msgSenderId)) ||
    message?.senderId === "demo-user-me";
  const isMetaAi = message?.senderId === "meta-ai";
  const isTyping = message?.isTyping;
  const statusInfo = parseStatusReply(message?.message);
  const reelInfo = parseReelMessage(message?.message);

  const formattedTime = message?.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "19:49";

  const handleOpenReel = (e) => {
    if (e) e.stopPropagation();
    if (!reelInfo) return;
    dispatch(openSpecificReel(reelInfo));
    toast.success(`Opening Reel by @${reelInfo.creatorName}! 🎬`, {
      id: "open-reel-toast",
      duration: 1800,
    });
  };

  return (
    <div
      ref={scroll}
      className={`flex w-full my-1.5 px-2 ${
        isSentByMe ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[72%] px-3.5 pt-2 pb-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] rounded-2xl ${
          isSentByMe
            ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-xs"
            : "bg-white text-[#111b21] rounded-tl-xs"
        }`}
      >
        {/* Meta AI Tag */}
        {isMetaAi && !isTyping && (
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-gray-100">
            <span className="text-[11px] font-bold bg-gradient-to-r from-[#0064e0] via-[#00d2ff] to-[#ff007f] bg-clip-text text-transparent">
              ✨ Meta AI
            </span>
            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-medium">
              Llama 3
            </span>
          </div>
        )}

        {/* WhatsApp Quoted Status Preview Card */}
        {statusInfo && (
          <div
            className={`mb-2 p-2 rounded-xl flex items-center justify-between gap-3 overflow-hidden border-l-[3.5px] border-[#25d366] transition ${
              isSentByMe
                ? "bg-black/5 dark:bg-black/15"
                : "bg-black/5 dark:bg-white/10"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00a884]">
                <IoPlayCircleOutline size={14} className="shrink-0" />
                <span className="truncate">
                  {statusInfo.authorName
                    ? `${statusInfo.authorName}'s Status`
                    : "Status"}
                </span>
                {statusInfo.songTitle && (
                  <span className="text-[10px] text-gray-500 font-normal truncate flex items-center gap-0.5">
                    • 🎵 {statusInfo.songTitle}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#3b4a54] line-clamp-1 mt-0.5 font-medium">
                {statusInfo.caption ||
                  (statusInfo.mediaUrl
                    ? "📷 Photo Status"
                    : "Status update")}
              </p>
            </div>

            {statusInfo.mediaUrl ? (
              <img
                src={statusInfo.mediaUrl}
                alt="Status thumbnail"
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10 shadow-xs"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-xs p-1 text-center"
                style={{ backgroundColor: statusInfo.bgColor || "#128c7e" }}
              >
                Aa
              </div>
            )}
          </div>
        )}

        {/* Image preview if message has image */}
        {message?.image && (
          <div className="mb-1.5 rounded-xl overflow-hidden max-w-sm">
            <img
              src={message.image}
              alt="attachment"
              className="w-full max-h-72 object-cover rounded-xl shadow-sm hover:opacity-95 transition-opacity"
            />
          </div>
        )}

        {/* Audio Voice Note Player */}
        {message?.audio && (
          <div className="mb-1">
            <VoiceMessagePlayer
              audioUrl={message.audio}
              duration={message.audioDuration}
              isSentByMe={isSentByMe}
            />
          </div>
        )}

        {/* Typing indicator, Reaction, or Message text */}
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1 px-1">
            <span
              className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
            <span className="text-xs text-gray-500 ml-1.5 italic font-medium">
              Meta AI is thinking...
            </span>
          </div>
        ) : statusInfo ? (
          statusInfo.type === "reaction" ? (
            <div className="text-3xl py-1 px-1 flex items-center gap-1.5 select-none animate-bounce">
              <span>{statusInfo.emoji}</span>
            </div>
          ) : (
            <div className="text-[14.5px] leading-relaxed break-words font-normal select-text pr-14 inline-block whitespace-pre-wrap">
              {statusInfo.text}
            </div>
          )
        ) : reelInfo ? (
          <div className="flex flex-col gap-2">
            {/* Interactive Shared Reel Card */}
            <div className="w-64 sm:w-72 rounded-2xl overflow-hidden bg-[#18181b] border border-pink-500/30 shadow-2xl transition hover:border-pink-500/60 select-none">
              {/* Top Reel Banner */}
              <div className="px-3 py-2 bg-gradient-to-r from-pink-600/25 via-purple-600/20 to-transparent flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs">🎬</span>
                  <span className="text-xs font-bold text-pink-300 truncate">
                    @{reelInfo.creatorName}
                  </span>
                  <IoCheckmarkCircle size={13} className="text-blue-400 shrink-0" />
                </div>
                <span className="text-[10px] font-semibold bg-pink-500/30 text-pink-200 px-2 py-0.5 rounded-full border border-pink-500/40">
                  Reel
                </span>
              </div>

              {/* Clickable Video Preview Thumbnail */}
              <div
                onClick={handleOpenReel}
                className="relative h-64 sm:h-72 w-full bg-black cursor-pointer group overflow-hidden"
                title="Click to Watch Reel"
              >
                <video
                  src={reelInfo.videoUrl}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  preload="metadata"
                  muted
                  playsInline
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

                {/* Glowing Play Button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-xl shadow-pink-600/50 border-2 border-white/90 group-hover:scale-110 group-hover:bg-pink-500 transition-all duration-200">
                    <IoPlay size={26} className="ml-0.5 text-white" />
                  </div>
                </div>

                {/* Caption & Music Bar inside preview */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white pointer-events-none">
                  {reelInfo.caption && (
                    <p className="text-xs font-medium line-clamp-2 drop-shadow-md mb-1.5 text-gray-100">
                      {reelInfo.caption}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 text-[10.5px] text-pink-200 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full w-fit max-w-full border border-white/10">
                    <IoMusicalNotes size={12} className="text-pink-400 shrink-0" />
                    <span className="truncate">{reelInfo.musicTitle || "Original Audio 🎵"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: "Watch Reel in App" + Direct Video Link */}
              <div className="p-2.5 bg-[#202024] flex flex-col gap-1.5 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleOpenReel}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-pink-600/25 transition cursor-pointer"
                >
                  <IoPlay size={15} />
                  <span>Watch Reel in App ▶️</span>
                </button>

                <a
                  href={reelInfo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-center gap-1 text-center py-0.5 transition cursor-pointer"
                >
                  <span>🔗 Click to open direct link</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          message?.message &&
          message.message !== "🎤 Voice message" && (
            <div className="text-[14.5px] leading-relaxed break-words font-normal select-text pr-14 inline-block whitespace-pre-wrap">
              {renderClickableText(message?.message)}
            </div>
          )
        )}

        {/* Timestamp and ticks on bottom right */}
        {!isTyping && (
          <span className="float-right ml-2 mt-1 flex items-center gap-1 text-[11px] text-[#667781] select-none">
            <span>{formattedTime}</span>
            {isSentByMe && (
              message?.seen ? (
                // Double Blue Tick: Seen / Read by receiver
                <IoCheckmarkDoneSharp
                  className="text-[#53bdeb] text-sm"
                  title="Read"
                />
              ) : message?.delivered ? (
                // Double Gray Tick: Delivered to receiver
                <IoCheckmarkDoneSharp
                  className="text-[#8696a0] text-sm"
                  title="Delivered"
                />
              ) : (
                // Single Gray Tick: Sent from your device
                <IoCheckmarkSharp
                  className="text-[#8696a0] text-sm"
                  title="Sent"
                />
              )
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
