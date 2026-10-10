import React, { useState, useEffect, useRef } from "react";
import { IoSend } from "react-icons/io5";
import { BsPlusLg, BsCamera, BsMicFill, BsEmojiSmile, BsTrash } from "react-icons/bs";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, setLastMessage, markMessageDelivered } from "../redux/messageSlice";
import { addGroupMessage } from "../redux/groupSlice";
import { openCamera } from "../redux/cameraSlice";
import { generateAiReply } from "../utils/metaAi";
import { triggerMessageNotification } from "../utils/notificationService";
import { getAvatarUrl } from "../utils/avatar";
import toast from "react-hot-toast";
import { BASE_URL } from "../config/api";

const POPULAR_EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🔥", "👍", "🙏", "❤️", "🎉",
  "💯", "👏", "🚀", "💡", "✨", "👋", "🥳", "🤔", "💪", "🇮🇳"
];

const SendInput = () => {
  const [message, setMessage] = useState("");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  const dispatch = useDispatch();
  const { selectedUser, authUser } = useSelector((store) => store.user);
  const { selectedGroup } = useSelector((store) => store.group);
  const { socket } = useSelector((store) => store.socket);
  const { messages } = useSelector((store) => store.message);

  // Clean up typing status and audio recorder when changing user or unmounting
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socket && selectedUser?._id && selectedUser._id !== "meta-ai") {
        socket.emit("typing", { to: selectedUser._id, isTyping: false });
      }
    };
  }, [selectedUser, socket]);

  // Handle live typing event
  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (!selectedUser?._id || selectedUser._id === "meta-ai" || !socket) return;

    if (val.trim()) {
      socket.emit("typing", { to: selectedUser._id, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket && selectedUser?._id) {
          socket.emit("typing", { to: selectedUser._id, isTyping: false });
        }
      }, 2500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("typing", { to: selectedUser._id, isTyping: false });
    }
  };

  const sendMessage = async (
    textToSend,
    imageUrl = null,
    audioUrl = null,
    audioDuration = 0
  ) => {
    const currentText = (textToSend !== undefined ? textToSend : message).trim();
    if (!currentText && !imageUrl && !audioUrl) return;
    if (!selectedUser?._id && !selectedGroup?._id) return;

    setMessage("");
    setShowEmojiPicker(false);

    // Stop typing indicator on message send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket && selectedUser?._id && selectedUser._id !== "meta-ai") {
      socket.emit("typing", { to: selectedUser._id, isTyping: false });
    }

    const displayMsg =
      currentText ||
      (audioUrl
        ? "🎤 Voice message"
        : imageUrl
        ? "📷 Shared an image"
        : "");

    // Special handling for Group Chat
    if (selectedGroup?._id) {
      try {
        const res = await axios.post(
          `${BASE_URL}/api/v1/group/send/${selectedGroup._id}`,
          {
            message: displayMsg,
            image: imageUrl || null,
            audio: audioUrl || null,
            audioDuration: audioDuration || 0,
          },
          { withCredentials: true }
        );
        if (res.data?.success && res.data.message) {
          dispatch(addGroupMessage(res.data.message));
        }
      } catch (err) {
        console.error("sendGroupMessage error:", err);
        toast.error("Failed to send message to group");
      }
      return;
    }

    // Special handling for Meta AI
    if (selectedUser?._id === "meta-ai") {
      const userMsg = {
        _id: `user-msg-${Date.now()}`,
        senderId: authUser?._id,
        message: displayMsg,
        image: imageUrl || null,
        audio: audioUrl || null,
        audioDuration: audioDuration || 0,
        createdAt: new Date().toISOString(),
      };
      const currentList = messages || [];
      const updatedWithUser = [...currentList, userMsg];

      // Temporary typing indicator
      const typingMsg = {
        _id: "meta-ai-typing",
        senderId: "meta-ai",
        message: "thinking...",
        isTyping: true,
        createdAt: new Date().toISOString(),
      };

      dispatch(setMessages([...updatedWithUser, typingMsg]));
      localStorage.setItem("meta_ai_chat_history", JSON.stringify(updatedWithUser));

      // Generate intelligent AI response
      let aiPrompt = currentText;
      if (audioUrl) {
        aiPrompt = "User sent a voice message. Acknowledge the voice note and ask how you can help them today.";
      } else if (imageUrl && !currentText) {
        aiPrompt = "User shared an image. Acknowledge and offer help.";
      }

      const aiReplyText = await generateAiReply(aiPrompt || "Hello");
      const aiMsg = {
        _id: `meta-ai-${Date.now()}`,
        senderId: "meta-ai",
        message: aiReplyText,
        createdAt: new Date().toISOString(),
      };

      const seenUserMsg = { ...userMsg, delivered: true, seen: true };
      const finalMessages = [...currentList, seenUserMsg, aiMsg];
      dispatch(setMessages(finalMessages));
      localStorage.setItem("meta_ai_chat_history", JSON.stringify(finalMessages));
      return;
    }

    // User-to-user message (demo contacts or real backend)
    const userMsg = {
      _id: `user-msg-${Date.now()}`,
      senderId: authUser?._id || "demo-user-me",
      receiverId: selectedUser?._id,
      isMe: true,
      message: displayMsg,
      image: imageUrl || null,
      audio: audioUrl || null,
      audioDuration: audioDuration || 0,
      delivered: false, // Single gray tick initially
      seen: false, // Becomes blue tick once seen
      createdAt: new Date().toISOString(),
    };

    const currentList = messages || [];
    const updatedMessages = [...currentList, userMsg];
    dispatch(setMessages(updatedMessages));
    dispatch(
      setLastMessage({
        userId: selectedUser._id,
        text: displayMsg,
        time: userMsg.createdAt,
        isMe: true,
        seen: false,
        delivered: false,
      })
    );

    const isDemoContact = selectedUser._id?.startsWith("demo-contact");

    if (isDemoContact) {
      setTimeout(() => {
        dispatch(markMessageDelivered(userMsg._id));
      }, 150);

      const contactReplies = audioUrl
        ? [
            "🎙️ Got your voice note! Loud and clear 👍",
            "Awesome voice message! Thanks for testing this out 😊",
            "Sounds great! The voice recording feature works smoothly 🚀",
          ]
        : [
            "Hey! Got your message 👍",
            "Sounds good! How are you doing today?",
            "Awesome! Thanks for testing this out 😊",
            "Looks great! The chat interface is really smooth 🔥",
            "Haha nice! Let's catch up soon 🙌",
            "Super responsive! Loving this WhatsApp clone 🚀",
          ];
      const randomReply =
        contactReplies[Math.floor(Math.random() * contactReplies.length)];

      setTimeout(() => {
        const replyMsg = {
          _id: `reply-${Date.now()}`,
          senderId: selectedUser._id,
          message: randomReply,
          createdAt: new Date().toISOString(),
        };
        const seenUpdatedMessages = updatedMessages.map((m) =>
          m._id === userMsg._id ? { ...m, delivered: true, seen: true } : m
        );
        dispatch(setMessages([...seenUpdatedMessages, replyMsg]));
        dispatch(
          setLastMessage({
            userId: selectedUser._id,
            text: randomReply,
            time: replyMsg.createdAt,
            isMe: false,
          })
        );
        triggerMessageNotification({
          senderName: selectedUser.fullName,
          senderAvatar: getAvatarUrl(selectedUser),
          messageText: randomReply,
          isCurrentChatActive: true,
        });
      }, 450);
      return;
    }

    // Real backend message if not demo contact
    try {
      const res = await axios.post(
        `${BASE_URL}/api/v1/message/send/${selectedUser._id}`,
        {
          message: displayMsg,
          image: imageUrl || null,
          audio: audioUrl || null,
          audioDuration: audioDuration || 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (res?.data?.newMessage) {
        const newMsgObj = {
          ...res.data.newMessage,
          image: imageUrl || null,
          audio: audioUrl || null,
          audioDuration: audioDuration || 0,
          isMe: true,
          delivered: res.data.newMessage.delivered || false,
          seen: res.data.newMessage.seen || false,
        };
        dispatch(setMessages([...updatedMessages.slice(0, -1), newMsgObj]));
      }
    } catch (error) {
      console.log("Backend offline, message kept in local chat state:", error);
    }
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (isRecordingVoice) {
      stopVoiceRecordingAndSend();
    } else {
      sendMessage();
    }
  };

  // Image upload handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result;
      sendMessage(message, base64Url);
      toast.success("Image attached!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Insert emoji
  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 🎙️ Start Real Audio Recording with MediaRecorder
  const startVoiceRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Microphone requires HTTPS or localhost!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      audioStreamRef.current = stream;

      let options = {};
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          options = { mimeType: "audio/ogg" };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      toast("Recording voice message... 🎙️", { icon: "🔴", duration: 1500 });
    } catch (err) {
      console.error("Voice recording error:", err);
      toast.error("Microphone access denied! Allow mic to record voice note.");
      setIsRecordingVoice(false);
    }
  };

  // ⏹️ Stop Recording & Send Voice Note
  const stopVoiceRecordingAndSend = () => {
    if (!mediaRecorderRef.current || !isRecordingVoice) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const duration = recordingSeconds;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }

      const mimeType = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 300 || duration < 1) {
        toast("Recording too short", { icon: "⏱️" });
        setIsRecordingVoice(false);
        setRecordingSeconds(0);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        sendMessage("", null, base64Audio, duration);
        toast.success("Voice message sent! 🎙️");
      };
      reader.readAsDataURL(audioBlob);

      setIsRecordingVoice(false);
      setRecordingSeconds(0);
    };

    try {
      recorder.stop();
    } catch (e) {
      console.warn("Error stopping recorder:", e);
      setIsRecordingVoice(false);
    }
  };

  // 🗑️ Cancel & Discard Recording
  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    toast("Voice note discarded 🗑️", { duration: 1200 });
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="relative select-none">
      {/* Hidden file input for camera & attachment */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Floating Quick Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-4 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-gray-200 z-30 max-w-sm">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-100 text-xs font-semibold text-gray-500">
            <span>Quick Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-10 gap-1 text-xl">
            {POPULAR_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="hover:scale-125 hover:bg-gray-100 p-1 rounded-lg transition-transform text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={onSubmitHandler}
        className="bg-[#f0f2f5] px-3 py-2.5 flex items-center gap-2 border-t border-gray-200/80"
      >
        {/* If recording voice: Show WhatsApp Authentic Voice Recording Bar */}
        {isRecordingVoice ? (
          <div className="flex-1 flex items-center justify-between bg-white rounded-full px-4 py-2 border border-red-300 shadow-sm animate-fadeIn">
            {/* Left: Red recording dot & Timer */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs font-bold text-red-600 font-mono">
                {formatTimer(recordingSeconds)}
              </span>
            </div>

            {/* Center: Sound Waveform animation */}
            <div className="flex items-center gap-1 px-3">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline mr-2">
                Recording voice note...
              </span>
              <div className="flex items-center gap-1 h-5">
                {[35, 70, 95, 55, 85, 40, 75, 50, 90, 65, 80].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 100}ms`,
                    }}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Right: Trash / Cancel button and Send button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-90 transition-all"
                title="Cancel & Delete recording"
              >
                <BsTrash className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopVoiceRecordingAndSend}
                className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white flex items-center justify-center shadow-md transition-all"
                title="Send voice note"
              >
                <IoSend className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Typing Input Bar */
          <>
            {/* Plus / Attachment icon -> opens image file picker */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#007aff] hover:bg-gray-200 transition-colors"
              title="Attach Image / Document"
            >
              <BsPlusLg className="w-5 h-5 font-bold" />
            </button>

            {/* Pill-shaped text input container */}
            <div className="flex-1 relative flex items-center bg-white rounded-full px-3.5 py-1.5 border border-gray-300 shadow-sm focus-within:border-[#007aff]/60">
              <input
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                type="text"
                placeholder={
                  selectedUser?._id === "meta-ai"
                    ? "Ask Meta AI anything..."
                    : "Type a message..."
                }
                className="w-full bg-transparent text-[15px] text-[#111b21] placeholder-gray-400 focus:outline-none pr-8"
              />

              {/* Sticker / Emoji icon inside right of input */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-3 ${
                  showEmojiPicker ? "text-[#007aff]" : "text-[#54656f]"
                } hover:text-[#111b21] transition-colors`}
                title="Stickers / Emojis"
              >
                <BsEmojiSmile className="w-5 h-5" />
              </button>
            </div>

            {/* Camera button -> opens live camera directly */}
            <button
              type="button"
              onClick={() => dispatch(openCamera("chat"))}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#54656f] hover:bg-gray-200 transition-colors"
              title="Camera"
            >
              <BsCamera className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Action Button: Send button OR Mic button */}
        {message.trim() ? (
          <button
            type="submit"
            className={`w-10 h-10 rounded-full ${
              selectedUser?._id === "meta-ai"
                ? "bg-gradient-to-tr from-[#0064e0] to-[#ff007f] hover:opacity-90"
                : "bg-[#007aff] hover:bg-blue-600"
            } active:scale-95 text-white flex items-center justify-center shadow-md transition-all`}
            title="Send message"
          >
            <IoSend className="w-4 h-4 ml-0.5" />
          </button>
        ) : !isRecordingVoice ? (
          <button
            type="button"
            onClick={startVoiceRecording}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#00a884] hover:bg-[#008f6f] active:scale-90 shadow-md transition-all"
            title="Click to record voice message (वॉइस मैसेज रिकॉर्ड करें)"
          >
            <BsMicFill className="w-5 h-5" />
          </button>
        ) : null}
      </form>
    </div>
  );
};

export default SendInput;
