import React, { useState, useEffect, useRef } from "react";
import { IoSend } from "react-icons/io5";
import { BsPlusLg, BsCamera, BsMicFill, BsEmojiSmile, BsTrash } from "react-icons/bs";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, setLastMessage, markMessageDelivered } from "../redux/messageSlice";
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
  const [isListening, setIsListening] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dispatch = useDispatch();
  const { selectedUser, authUser } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);
  const { messages } = useSelector((store) => store.message);

  // Clean up typing status when changing user or unmounting
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
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

  // Timer while recording voice
  useEffect(() => {
    let timer = null;
    if (isListening) {
      timer = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isListening]);

  const sendMessage = async (textToSend, imageUrl = null) => {
    const currentText = (textToSend !== undefined ? textToSend : message).trim();
    if (!currentText && !imageUrl) return;
    if (!selectedUser?._id) return;

    setMessage("");
    setShowEmojiPicker(false);

    // Stop typing indicator on message send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket && selectedUser?._id && selectedUser._id !== "meta-ai") {
      socket.emit("typing", { to: selectedUser._id, isTyping: false });
    }

    // Special handling for Meta AI
    if (selectedUser._id === "meta-ai") {
      const userMsg = {
        _id: `user-msg-${Date.now()}`,
        senderId: authUser?._id,
        message: currentText || (imageUrl ? "📷 Shared an image" : ""),
        image: imageUrl || null,
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

      // Generate intelligent AI response (Knowledge Base + Live Llama 3 API)
      let aiPrompt = currentText;
      if (imageUrl && !currentText) {
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
      message: currentText || (imageUrl ? "📷 Shared an image" : ""),
      image: imageUrl || null,
      delivered: false, // Single gray tick ✓ initially
      seen: false, // Becomes blue tick only once seen
      createdAt: new Date().toISOString(),
    };

    const currentList = messages || [];
    const updatedMessages = [...currentList, userMsg];
    dispatch(setMessages(updatedMessages));
    dispatch(
      setLastMessage({
        userId: selectedUser._id,
        text: currentText || (imageUrl ? "📷 Shared an image" : ""),
        time: userMsg.createdAt,
        isMe: true,
        seen: false,
        delivered: false,
      })
    );

    const isDemoContact = selectedUser._id?.startsWith("demo-contact");

    if (isDemoContact) {
      // 1. After 150ms: Turn to Double Gray Tick (Delivered)
      setTimeout(() => {
        dispatch(markMessageDelivered(userMsg._id));
      }, 150);

      // 2. When contact replies after 450ms: Turn to Double Blue Tick (Seen)
      const contactReplies = [
        "Hey! Got your message 👍",
        "Sounds good! How are you doing today?",
        "Awesome! Thanks for testing this out 😊",
        "Looks great! The chat interface is really smooth 🔥",
        "Haha nice! Let's catch up soon 🙌",
        "Super responsive! Loving this WhatsApp clone 🚀"
      ];
      const randomReply = contactReplies[Math.floor(Math.random() * contactReplies.length)];

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
          message: currentText || (imageUrl ? "📷 Shared an image" : ""),
          image: imageUrl,
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
    if (isListening) {
      stopListening(true);
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

  // Start Mic Voice Recognition
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast(
        "Mic dictation is ready! Click mic again to speak, or type directly.",
        { icon: "🎙️" }
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        toast("Listening... Speak now 🎙️", { icon: "🎤" });
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.log("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Please allow microphone access in your browser address bar!");
        } else if (event.error !== "no-speech") {
          toast.error(`Mic status: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.log("Error starting mic:", err);
      setIsListening(false);
      toast.error("Could not start microphone.");
    }
  };

  const stopListening = (shouldSend = false) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log(e);
      }
    }
    setIsListening(false);
    if (shouldSend && message.trim()) {
      sendMessage(message.trim());
    }
  };

  const cancelListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.log(e);
      }
    }
    setIsListening(false);
    setMessage("");
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
        {/* If listening: Show WhatsApp Style Voice Recording Bar */}
        {isListening ? (
          <div className="flex-1 flex items-center justify-between bg-white rounded-full px-4 py-2 border border-red-300 shadow-sm animate-pulse">
            {/* Left: Red recording dot & Timer */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-xs font-semibold text-red-600">
                {formatTimer(recordSeconds)}
              </span>
            </div>

            {/* Center: Live spoken transcript preview or listening label */}
            <div className="flex-1 px-3 text-sm text-[#111b21] truncate font-medium">
              {message || "Listening... Speak now"}
            </div>

            {/* Cancel button (Trash) */}
            <button
              type="button"
              onClick={cancelListening}
              className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors mr-1"
              title="Cancel voice input"
            >
              <BsTrash className="w-4 h-4" />
            </button>
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

            {/* Camera button -> opens camera/image picker directly */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#54656f] hover:bg-gray-200 transition-colors"
              title="Send Photo"
            >
              <BsCamera className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Action Button: Send button OR Mic button */}
        {message.trim() || isListening ? (
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
        ) : (
          <button
            type="button"
            onClick={startListening}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#00a884] hover:bg-[#008f6f] active:scale-90 shadow-md transition-all"
            title="Click to speak (Voice Input)"
          >
            <BsMicFill className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
};

export default SendInput;
