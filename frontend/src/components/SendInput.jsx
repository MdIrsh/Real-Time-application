import React, { useState, useEffect, useRef } from "react";
import { IoSend, IoAttachOutline, IoBarChartOutline, IoDocumentTextOutline } from "react-icons/io5";
import { BsPlusLg, BsCamera, BsMicFill, BsEmojiSmile, BsTrash, BsImage } from "react-icons/bs";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMessages, setLastMessage, markMessageDelivered, clearReplyingMessage } from "../redux/messageSlice";
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
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

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
  const { messages, replyingMessage } = useSelector((store) => store.message);

  // Auto-focus input when replying to a message
  useEffect(() => {
    if (replyingMessage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingMessage]);

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
    audioDuration = 0,
    fileObj = null,
    pollObj = null
  ) => {
    const currentText = (textToSend !== undefined ? textToSend : message).trim();
    if (!currentText && !imageUrl && !audioUrl && !fileObj && !pollObj) return;
    if (!selectedUser?._id && !selectedGroup?._id) return;

    setMessage("");
    setShowEmojiPicker(false);

    // Capture quoted reply snapshot if user is replying to a message
    const replySnapshot = replyingMessage ? { ...replyingMessage } : null;
    if (replyingMessage) {
      dispatch(clearReplyingMessage());
    }

    // Stop typing indicator on message send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socket && selectedUser?._id && selectedUser._id !== "meta-ai") {
      socket.emit("typing", { to: selectedUser._id, isTyping: false });
    }

    const displayMsg =
      currentText ||
      (pollObj
        ? `📊 Poll: ${pollObj.question}`
        : fileObj
        ? `📄 ${fileObj.name}`
        : audioUrl
        ? "🎤 Voice message"
        : imageUrl
        ? "📷 Shared an image"
        : "");

    // Special handling for Group Chat
    if (selectedGroup?._id) {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.post(
          `${BASE_URL}/api/v1/group/send/${selectedGroup._id}`,
          {
            message: displayMsg,
            image: imageUrl || null,
            audio: audioUrl || null,
            audioDuration: audioDuration || 0,
            file: fileObj || null,
            poll: pollObj || null,
            replyTo: replySnapshot,
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
          }
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
      file: fileObj || null,
      poll: pollObj || null,
      delivered: false, // Single gray tick initially
      seen: false, // Becomes blue tick once seen
      replyTo: replySnapshot,
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
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/api/v1/message/send/${selectedUser._id}`,
        {
          message: displayMsg,
          image: imageUrl || null,
          audio: audioUrl || null,
          audioDuration: audioDuration || 0,
          file: fileObj || null,
          poll: pollObj || null,
          replyTo: replySnapshot,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          file: fileObj || res.data.newMessage.file || null,
          poll: pollObj || res.data.newMessage.poll || null,
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

  // Image & Document/File upload handler
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size must be under 4MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result;
      if (file.type.startsWith("image/")) {
        sendMessage(message, base64Url);
        toast.success("Image attached!");
      } else {
        sendMessage(message, null, null, 0, {
          url: base64Url,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
        });
        toast.success(`${file.name} attached! 📄`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Create and send Poll
  const handleCreatePoll = () => {
    const cleanQuestion = pollQuestion.trim();
    const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!cleanQuestion) {
      toast.error("Please enter a poll question");
      return;
    }
    if (validOptions.length < 2) {
      toast.error("Add at least 2 poll options");
      return;
    }
    sendMessage("", null, null, 0, null, {
      question: cleanQuestion,
      options: validOptions.map((text) => ({ text, votes: [] })),
    });
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollModal(false);
    toast.success("Poll shared! 📊");
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
      {/* Hidden file input for photo & document attachments */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.csv,.xls,.xlsx,.ppt,.pptx"
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

      {/* Quick Attachment Menu Popup from Blue '+' Button */}
      {showAttachMenu && (
        <div className="absolute bottom-full mb-2 left-3 bg-white/98 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-blue-100 z-30 w-48 animate-in fade-in zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              fileInputRef.current?.click();
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-semibold text-[#1e293b] flex items-center gap-2.5 transition cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-blue-100 text-[#1d4ed8] flex items-center justify-center shrink-0">
              <BsImage size={14} />
            </span>
            <span>Photo / Gallery</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              dispatch(openCamera("chat"));
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-semibold text-[#1e293b] flex items-center gap-2.5 transition cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
              <BsCamera size={14} />
            </span>
            <span>Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              startVoiceRecording();
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-semibold text-[#1e293b] flex items-center gap-2.5 transition cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-indigo-100 text-[#4f46e5] flex items-center justify-center shrink-0">
              <BsMicFill size={14} />
            </span>
            <span>Voice Message</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              fileInputRef.current?.click();
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-semibold text-[#1e293b] flex items-center gap-2.5 transition cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
              <IoDocumentTextOutline size={15} />
            </span>
            <span>Document / File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setShowPollModal(true);
            }}
            className="w-full px-3 py-2 rounded-xl hover:bg-blue-50 text-left text-xs font-semibold text-[#1e293b] flex items-center gap-2.5 transition cursor-pointer"
          >
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
              <IoBarChartOutline size={15} />
            </span>
            <span>Create Poll</span>
          </button>
        </div>
      )}

      {/* Create Poll Modal */}
      {showPollModal && (
        <div
          onClick={() => setShowPollModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0d47a1] to-[#1e88e5] px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <IoBarChartOutline className="text-xl" />
                <h3 className="text-base font-bold">Create Poll</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  Question
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-blue-100 text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                  Options
                </label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#f8fafc] border border-blue-100 text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPollOptions(pollOptions.filter((_, i) => i !== idx))
                        }
                        className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-xs font-bold text-[#1d4ed8] hover:underline pt-1 cursor-pointer"
                  >
                    + Add another option
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748b] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreatePoll}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md cursor-pointer"
                >
                  Send Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quoted Reply Preview Bar */}
      {replyingMessage && (
        <div className="mx-2 mb-1 p-2 bg-white text-[#0f172a] rounded-xl flex items-center justify-between border-l-4 border-[#2563eb] shadow-md animate-slide-up select-none border border-blue-100">
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-[12px] font-bold text-[#1d4ed8] flex items-center gap-1.5">
              <span>Replying to {replyingMessage.senderName || "Message"}</span>
            </div>
            <p className="text-xs text-[#64748b] truncate mt-0.5">
              {replyingMessage.message ||
                (replyingMessage.image ? "📷 Photo" : "🎤 Voice message")}
            </p>
          </div>
          {replyingMessage.image && (
            <img
              src={replyingMessage.image}
              alt="Quoted attachment"
              className="w-9 h-9 object-cover rounded-lg mr-2 border border-blue-100"
            />
          )}
          <button
            type="button"
            onClick={() => dispatch(clearReplyingMessage())}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Input Form matching screenshot */}
      <form
        onSubmit={onSubmitHandler}
        className="bg-[#f4f7fc] px-3.5 sm:px-5 py-3 flex items-center gap-2.5 border-t border-blue-100/90"
      >
        {/* If recording voice: Show Voice Recording Bar */}
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-90 transition-all cursor-pointer"
                title="Cancel & Delete recording"
              >
                <BsTrash className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopVoiceRecordingAndSend}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1d4ed8] to-[#2563eb] hover:brightness-110 active:scale-95 text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                title="Send voice note"
              >
                <IoSend className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Typing Input Bar matching screenshot */
          <>
            {/* Blue Circular Plus (+) Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(false);
                setShowAttachMenu((prev) => !prev);
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d4ed8] to-[#2563eb] hover:brightness-110 active:scale-95 text-white flex items-center justify-center shadow-[0_3px_10px_rgba(37,99,235,0.4)] transition-all shrink-0 cursor-pointer"
              title="More options (Photo, Camera, Voice)"
            >
              <BsPlusLg className={`w-4 h-4 transition-transform duration-200 ${showAttachMenu ? "rotate-45" : ""}`} />
            </button>

            {/* White Pill Input Capsule */}
            <div className="flex-1 relative flex items-center bg-white rounded-full px-4 py-2 border border-blue-100/90 shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all">
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
                className="w-full bg-transparent text-[15px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none border-none pr-16"
              />

              {/* Right icons inside pill: Emoji Smiley + Paperclip Attach */}
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className={`${
                    showEmojiPicker ? "text-[#2563eb]" : "text-[#475569]"
                  } hover:text-[#1d4ed8] transition-colors cursor-pointer`}
                  title="Emojis"
                >
                  <BsEmojiSmile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#475569] hover:text-[#1d4ed8] transition-colors cursor-pointer"
                  title="Attach Photo"
                >
                  <IoAttachOutline className="w-5 h-5 -rotate-45" />
                </button>
              </div>
            </div>

            {/* Blue Circular Send Paper-Plane Button matching screenshot */}
            <button
              type="submit"
              onClick={(e) => {
                if (!message.trim()) {
                  e.preventDefault();
                  inputRef.current?.focus();
                }
              }}
              className={`w-10 h-10 rounded-full ${
                selectedUser?._id === "meta-ai"
                  ? "bg-gradient-to-tr from-[#0064e0] to-[#ff007f] hover:opacity-90"
                  : "bg-gradient-to-tr from-[#1d4ed8] to-[#2563eb] hover:brightness-110"
              } active:scale-95 text-white flex items-center justify-center shadow-[0_3px_12px_rgba(37,99,235,0.45)] transition-all shrink-0 cursor-pointer`}
              title="Send message"
            >
              <IoSend className="w-4 h-4 ml-0.5" />
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default SendInput;
