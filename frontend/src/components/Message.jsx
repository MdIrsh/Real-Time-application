import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  IoCheckmarkDoneSharp,
  IoCheckmarkSharp,
  IoPlayCircleOutline,
} from "react-icons/io5";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

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

const Message = ({ message }) => {
  const scroll = useRef();
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

  const formattedTime = message?.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "19:49";

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
        ) : (
          message?.message &&
          message.message !== "🎤 Voice message" && (
            <div className="text-[14.5px] leading-relaxed break-words font-normal select-text pr-14 inline-block whitespace-pre-wrap">
              {message?.message}
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
