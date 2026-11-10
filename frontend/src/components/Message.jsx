import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import {
  IoCheckmarkDoneSharp,
  IoCheckmarkSharp,
  IoPlayCircleOutline,
  IoPlay,
  IoCheckmarkCircle,
  IoMusicalNotes,
  IoLogoInstagram,
  IoOpenOutline,
  IoArrowUndoOutline,
  IoDocumentText,
  IoDownloadOutline,
  IoBarChart,
} from "react-icons/io5";
import VoiceMessagePlayer from "./VoiceMessagePlayer";
import { openSpecificReel } from "../redux/reelSlice";
import {
  setReplyingMessage,
  updateMessageReactions,
  updateMessagePoll,
} from "../redux/messageSlice";
import {
  updateGroupMessageReactions,
  updateGroupPoll,
  updateGroupPinned,
} from "../redux/groupSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { MetaAiRing } from "../utils/metaAi";
import { BASE_URL } from "../config/api";
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
        shortcode: meta.shortcode || "",
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

  // 2. Standalone Instagram Reel link (e.g. https://www.instagram.com/reel/C-U1J5qPZ8B/)
  const igMatch = rawText.trim().match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i
  );
  if (igMatch) {
    return {
      _id: `reel-ig-${igMatch[1]}`,
      shortcode: igMatch[1],
      creatorName: "Instagram Creator",
      creatorAvatar: "",
      videoUrl: `https://www.instagram.com/reel/${igMatch[1]}/`,
      audioUrl: "",
      musicTitle: "Instagram Trending Audio 🎵",
      caption: "Instagram Reel",
      likes: [1, 2, 3],
      sharesCount: 1,
      comments: [],
    };
  }

  // 3. Legacy format: "🎬 Watch this Reel by ... :\n"..."\n\nhttps://..."
  if (rawText.includes("🎬 Watch this Reel")) {
    const creatorMatch = rawText.match(/Watch this Reel by\s+@?([^:\n]+)/);
    const captionMatch = rawText.match(/"([^"]+)"/);
    const urlMatch = rawText.match(/(https?:\/\/[^\s]+)/);

    if (urlMatch) {
      const shortcodeMatch = urlMatch[1].match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
      return {
        _id: `reel-shared-${Date.now()}`,
        shortcode: shortcodeMatch ? shortcodeMatch[1] : "",
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

  // 4. Standalone video URL (.mp4 / .webm or Cloudinary video URL)
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

const formatFileSize = (bytes = 0) => {
  if (!bytes || bytes <= 0) return "File";
  if (bytes < 1024) return `${bytes} B`;
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Message = ({ message }) => {
  const scroll = useRef();
  const dispatch = useDispatch();
  const { authUser, selectedUser, otherUsers } = useSelector((store) => store.user);
  const { selectedGroup } = useSelector((store) => store.group);
  const [showPollResults, setShowPollResults] = useState(false);

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  if (message?.isSystem) {
    return (
      <div ref={scroll} className="flex justify-center my-2.5 select-none">
        <span className="px-3.5 py-1 rounded-full bg-[#e2e8f0]/85 text-[#475569] text-xs font-medium shadow-2xs border border-white/80 flex items-center gap-1.5">
          <span>👥</span>
          <span>{message.message}</span>
        </span>
      </div>
    );
  }

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

  // Resolve sender object for avatar on incoming messages
  const senderObj =
    typeof message?.senderId === "object" && message.senderId?.fullName
      ? message.senderId
      : selectedUser && String(selectedUser._id) === String(msgSenderId)
      ? selectedUser
      : otherUsers?.find((u) => String(u._id) === String(msgSenderId)) || selectedUser;
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

  const handleReplyClick = (e) => {
    if (e) e.stopPropagation();
    const senderName = isSentByMe
      ? "You"
      : message?.senderId?.fullName || message?.senderId?.username || "Friend";
    dispatch(
      setReplyingMessage({
        messageId: message?._id,
        senderName,
        message:
          message?.message && message.message !== "🎤 Voice message"
            ? message.message
            : message?.image
            ? "📷 Photo"
            : message?.audio
            ? "🎤 Voice message"
            : "",
        image: message?.image || null,
      })
    );
  };

  const scrollToQuotedMessage = (e) => {
    if (e) e.stopPropagation();
    if (!message?.replyTo?.messageId) return;
    const targetEl = document.getElementById(`msg-${message.replyTo.messageId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      targetEl.classList.add("ring-2", "ring-[#2563eb]", "transition-all");
      setTimeout(() => {
        targetEl.classList.remove("ring-2", "ring-[#2563eb]");
      }, 1400);
    }
  };

  const activeGroupId = message?.groupId || selectedGroup?._id || null;

  const handleReactToMessage = async (emoji, e) => {
    if (e) e.stopPropagation();
    if (!message?._id || isTyping) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${BASE_URL}/api/v1/message/react/${message._id}`,
        { emoji },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        if (activeGroupId) {
          dispatch(
            updateGroupMessageReactions({
              messageId: message._id,
              reactions: res.data.reactions,
            })
          );
        } else {
          dispatch(
            updateMessageReactions({
              messageId: message._id,
              reactions: res.data.reactions,
            })
          );
        }
      }
    } catch (err) {
      toast.error("Failed to react");
    }
  };

  const handleVotePoll = async (optionIndex, e) => {
    if (e) e.stopPropagation();
    if (!message?._id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${BASE_URL}/api/v1/message/poll/vote/${message._id}`,
        { optionIndex },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      if (res.data?.success && res.data.poll) {
        if (activeGroupId) {
          dispatch(updateGroupPoll({ messageId: message._id, poll: res.data.poll }));
        } else {
          dispatch(updateMessagePoll({ messageId: message._id, poll: res.data.poll }));
        }
      }
    } catch (err) {
      toast.error("Failed to record vote");
    }
  };

  const handlePinMessage = async (e) => {
    if (e) e.stopPropagation();
    if (!activeGroupId || !message?._id) return;
    const snippet =
      message?.message ||
      (message?.file?.name
        ? `📄 ${message.file.name}`
        : message?.poll?.question
        ? `📊 ${message.poll.question}`
        : message?.image
        ? "📷 Photo"
        : "Voice message");
    const sName = isSentByMe
      ? authUser?.fullName || "You"
      : senderObj?.fullName || "Member";

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${BASE_URL}/api/v1/group/pin/${activeGroupId}`,
        { messageId: message._id, text: snippet, senderName: sName },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        dispatch(
          updateGroupPinned({
            groupId: activeGroupId,
            pinnedMessage: res.data.pinnedMessage,
          })
        );
        toast.success("Pinned message to group header! 📌");
      }
    } catch (err) {
      toast.error("Failed to pin message");
    }
  };

  const reactionList = message?.reactions || [];
  const groupedReactions = reactionList.reduce((acc, r) => {
    const emoji = r?.emoji || "👍";
    if (!acc[emoji]) {
      acc[emoji] = { emoji, count: 0, users: [], myReacted: false };
    }
    acc[emoji].count += 1;
    const uid = typeof r.user === "object" ? r.user?._id : r.user;
    if (authUser?._id && String(uid) === String(authUser._id)) {
      acc[emoji].myReacted = true;
    }
    if (typeof r.user === "object" && r.user) {
      acc[emoji].users.push(r.user);
    }
    return acc;
  }, {});
  const groupedReactionArr = Object.values(groupedReactions);
  const hasReactions = groupedReactionArr.length > 0;

  return (
    <div
      ref={scroll}
      className={`group flex items-end gap-2.5 w-full ${
        hasReactions ? "mt-2 mb-5" : "my-2"
      } px-1.5 sm:px-2 ${isSentByMe ? "justify-end" : "justify-start"}`}
    >
      {/* Incoming Sender Circular Avatar on left matching screenshot */}
      {!isSentByMe && (
        <div className="shrink-0 self-end mb-0.5">
          {isMetaAi ? (
            <MetaAiRing size="w-8 h-8" />
          ) : (
            <img
              src={getAvatarUrl(senderObj)}
              alt={senderObj?.fullName || "User"}
              className="w-8 h-8 rounded-full object-cover border border-white shadow-xs"
              onError={(e) => handleImageError(e, senderObj?.fullName)}
            />
          )}
        </div>
      )}

      <div
        id={`msg-${message?._id}`}
        onDoubleClick={handleReplyClick}
        className={`relative max-w-[82%] sm:max-w-[72%] px-4 pt-2.5 pb-2 rounded-2xl ${
          isSentByMe
            ? "bg-[#d6e8ff] text-[#0f172a] rounded-br-sm shadow-[0_1px_4px_rgba(37,99,235,0.14)]"
            : "bg-white text-[#1e293b] rounded-bl-sm shadow-[0_1px_4px_rgba(15,23,42,0.07)] border border-blue-50/90"
        }`}
      >
        {/* Quick Reaction, Pin & Reply Action Bar on Hover */}
        {!isTyping && (
          <div
            className={`absolute -top-4 ${
              isSentByMe ? "right-2" : "left-2"
            } opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-blue-100 transition-all duration-150 z-20`}
          >
            {["❤️", "👍", "😂"].map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={(e) => handleReactToMessage(emo, e)}
                className="w-6 h-6 rounded-full hover:bg-blue-50 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
                title={`React ${emo}`}
              >
                {emo}
              </button>
            ))}
            {activeGroupId && (
              <button
                type="button"
                onClick={handlePinMessage}
                className="w-6 h-6 rounded-full hover:bg-blue-50 flex items-center justify-center text-xs hover:scale-110 transition-transform cursor-pointer"
                title="Pin message to group"
              >
                📌
              </button>
            )}
            <button
              type="button"
              onClick={handleReplyClick}
              className="w-6 h-6 rounded-full hover:bg-blue-50 text-[#64748b] hover:text-[#2563eb] flex items-center justify-center transition cursor-pointer"
              title="Reply"
            >
              <IoArrowUndoOutline size={13} />
            </button>
          </div>
        )}

        {/* Group Chat Sender Name Tag */}
        {!isSentByMe && !isMetaAi && message?.senderId?.fullName && (
          <div className="text-[12px] font-bold text-[#1d4ed8] pb-0.5 select-none leading-none">
            {message.senderId.fullName}
          </div>
        )}

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

        {/* Quoted Reply Preview on TOP */}
        {message?.replyTo &&
          (message.replyTo.message ||
            message.replyTo.image ||
            message.replyTo.senderName) && (
            <div
              onClick={scrollToQuotedMessage}
              className={`mb-2 p-2 rounded-xl border-l-[3.5px] text-xs transition-all cursor-pointer shadow-xs ${
                isSentByMe
                  ? "bg-blue-600/10 border-[#2563eb] hover:bg-blue-600/15 text-[#0f172a]"
                  : "bg-slate-100 border-[#2563eb] hover:bg-slate-200/70 text-[#0f172a]"
              }`}
              title="Click to view original message"
            >
              <div className="font-bold text-[11px] text-[#1d4ed8] flex items-center gap-1">
                <IoArrowUndoOutline size={12} />
                <span>{message.replyTo.senderName || "Message"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-[12px] text-[#54656f] dark:text-[#8696a0] line-clamp-2 truncate flex-1 font-normal">
                  {message.replyTo.message ||
                    (message.replyTo.image ? "📷 Photo" : "🎤 Voice message")}
                </p>
                {message.replyTo.image && (
                  <img
                    src={message.replyTo.image}
                    alt="Quoted media"
                    className="w-8 h-8 rounded-md object-cover shrink-0 border border-black/10"
                  />
                )}
              </div>
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

        {/* File / Document Download Card */}
        {message?.file?.url && (
          <a
            href={message.file.url}
            download={message.file.name || "document"}
            onClick={(e) => e.stopPropagation()}
            className="mb-1.5 p-2.5 rounded-xl bg-[#f8fafc] hover:bg-[#eff6ff] border border-blue-100/90 flex items-center gap-2.5 sm:gap-3 w-full min-w-[180px] sm:min-w-[255px] max-w-[280px] transition-colors group/file cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2563eb]/12 text-[#1d4ed8] flex items-center justify-center shrink-0">
              <IoDocumentText className="text-2xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold text-[#0f172a] truncate">
                {message.file.name || "Document"}
              </p>
              <p className="text-[11px] text-[#64748b] font-medium mt-0.5">
                {formatFileSize(message.file.size)} •{" "}
                {(message.file.name?.split(".").pop() || "FILE").toUpperCase()}
              </p>
            </div>
            <span className="w-8 h-8 rounded-full bg-white border border-blue-100 text-[#1d4ed8] group-hover/file:bg-[#2563eb] group-hover/file:text-white flex items-center justify-center shrink-0 shadow-2xs transition-colors">
              <IoDownloadOutline className="text-base" />
            </span>
          </a>
        )}

        {/* Interactive Group Poll Card */}
        {message?.poll?.question && Array.isArray(message.poll.options) && (
          <div className="mb-1.5 w-full min-w-[190px] sm:min-w-[270px] max-w-[300px] bg-[#f8fafc]/95 rounded-xl p-2.5 sm:p-3 border border-blue-100/90">
            <div className="flex items-center gap-2 mb-2.5">
              <IoBarChart className="text-[#1d4ed8] text-lg shrink-0" />
              <h4 className="text-[14px] font-bold text-[#0f172a] leading-snug">
                Poll: {message.poll.question}
              </h4>
            </div>

            {(() => {
              const totalVotes = message.poll.options.reduce(
                (sum, opt) => sum + (opt?.votes?.length || 0),
                0
              );
              return (
                <div className="space-y-2.5">
                  {message.poll.options.map((opt, idx) => {
                    const voteCount = opt?.votes?.length || 0;
                    const percent =
                      totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const iVoted = (opt?.votes || []).some(
                      (v) =>
                        authUser?._id &&
                        String(typeof v === "object" ? v._id : v) === String(authUser._id)
                    );
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => handleVotePoll(idx, e)}
                        className="w-full text-left group/opt cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {iVoted ? (
                              <IoCheckmarkCircle className="text-[#1d4ed8] text-[19px] shrink-0" />
                            ) : (
                              <span className="w-[17px] h-[17px] rounded-full border-2 border-[#cbd5e1] group-hover/opt:border-[#2563eb] shrink-0 transition-colors" />
                            )}
                            <span
                              className={`text-[13px] truncate ${
                                iVoted
                                  ? "font-bold text-[#0f172a]"
                                  : "font-medium text-[#334155]"
                              }`}
                            >
                              {opt.text}
                            </span>
                          </div>
                          <span className="text-[11.5px] font-semibold text-[#64748b] shrink-0">
                            {voteCount} {voteCount === 1 ? "vote" : "votes"}
                            {showPollResults && totalVotes > 0 ? ` (${percent}%)` : ""}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              iVoted ? "bg-[#1d4ed8]" : "bg-[#93c5fd]"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPollResults((prev) => !prev);
                    }}
                    className="w-full mt-1 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-blue-100 text-[#1d4ed8] text-xs font-bold transition cursor-pointer"
                  >
                    {showPollResults
                      ? `Total Votes: ${totalVotes} (Hide %)`
                      : "View Results"}
                  </button>
                </div>
              );
            })()}
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

              {/* Preview Body */}
              {reelInfo.shortcode || reelInfo.videoUrl?.includes("instagram.com") ? (
                /* Instagram Reel Preview Card */
                <div
                  onClick={handleOpenReel}
                  className="p-4 bg-gradient-to-b from-[#18181b] to-[#121214] flex flex-col items-center justify-center text-center cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-pink-600/30 group-hover:scale-110 transition-transform mb-2">
                    <IoLogoInstagram size={30} />
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Instagram Reel
                  </h4>
                  {reelInfo.caption && (
                    <p className="text-[11px] text-gray-300 mt-1.5 line-clamp-2 italic px-2">
                      "{reelInfo.caption}"
                    </p>
                  )}
                  <div className="mt-2 text-[10px] text-pink-300 flex items-center gap-1 font-mono">
                    <IoMusicalNotes size={11} />
                    <span className="truncate max-w-[180px]">
                      {reelInfo.musicTitle || "Original Audio • Instagram"}
                    </span>
                  </div>
                </div>
              ) : (
                /* Video File Preview */
                <div
                  onClick={handleOpenReel}
                  className="relative h-60 w-full bg-black cursor-pointer group overflow-hidden"
                  title="Click to Watch Reel"
                >
                  <video
                    src={reelInfo.videoUrl}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    preload="metadata"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-xl border-2 border-white/90 group-hover:scale-110 transition">
                      <IoPlay size={22} className="ml-0.5 text-white" />
                    </div>
                  </div>
                  {reelInfo.caption && (
                    <p className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white line-clamp-2 drop-shadow-md">
                      {reelInfo.caption}
                    </p>
                  )}
                </div>
              )}

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
                  className="text-[11px] text-pink-400 hover:text-pink-300 hover:underline flex items-center justify-center gap-1 text-center py-0.5 transition cursor-pointer"
                >
                  <span>Open on Instagram</span>
                  <IoOpenOutline size={12} />
                </a>
              </div>
            </div>
          </div>
        ) : (
          message?.message &&
          message.message !== "🎤 Voice message" &&
          !(message?.file?.url && message.message.startsWith("📄 ")) &&
          !(message?.poll?.question && message.message.startsWith("📊 Poll:")) && (
            <div className="text-[14.5px] leading-relaxed break-words font-normal select-text pr-14 inline-block whitespace-pre-wrap">
              {renderClickableText(message?.message)}
            </div>
          )
        )}

        {/* Timestamp and ticks on bottom right */}
        {!isTyping && (
          <span className="float-right ml-2 mt-1 flex items-center gap-1 text-[11px] text-[#64748b] select-none">
            <span>{formattedTime}</span>
            {isSentByMe && (
              message?.seen ? (
                // Double Blue Tick: Seen / Read by receiver
                <IoCheckmarkDoneSharp
                  className="text-[#2563eb] text-sm"
                  title="Read"
                />
              ) : message?.delivered ? (
                // Double Gray Tick: Delivered to receiver
                <IoCheckmarkDoneSharp
                  className="text-[#64748b] text-sm"
                  title="Delivered"
                />
              ) : (
                // Single Gray Tick: Sent from your device
                <IoCheckmarkSharp
                  className="text-[#94a3b8] text-sm"
                  title="Sent"
                />
              )
            )}
          </span>
        )}

        {/* Floating Reaction Summary Pills Below Bubble */}
        {hasReactions && (
          <div
            className={`absolute -bottom-3.5 ${
              isSentByMe ? "right-2" : "left-2"
            } flex items-center gap-1.5 z-10`}
          >
            {groupedReactionArr.map((grp) => (
              <button
                key={grp.emoji}
                type="button"
                onClick={(e) => handleReactToMessage(grp.emoji, e)}
                className={`px-2 py-0.5 rounded-full bg-white shadow-sm border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition hover:scale-105 ${
                  grp.myReacted
                    ? "border-[#2563eb] text-[#1d4ed8]"
                    : "border-blue-100 text-[#334155]"
                }`}
              >
                <span>{grp.emoji}</span>
                <span>{grp.count}</span>
                {grp.users.length > 0 && (
                  <span className="flex -space-x-1.5 ml-0.5">
                    {grp.users.slice(0, 3).map((u, idx) => (
                      <img
                        key={u._id || idx}
                        src={getAvatarUrl(u)}
                        alt={u.fullName || "User"}
                        className="w-4 h-4 rounded-full object-cover border border-white"
                        onError={(e) => handleImageError(e, u.fullName)}
                      />
                    ))}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
