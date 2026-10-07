import React, { useRef, useEffect } from "react";
import Message from "./Message";
import useGetMessages from "../hooks/useGetMessages";
import useGetGroupMessages from "../hooks/useGetGroupMessages";
import { useSelector, useDispatch } from "react-redux";
import { setMessages } from "../redux/messageSlice";
import { IoLockClosed } from "react-icons/io5";
import { MetaAiRing, generateAiReply } from "../utils/metaAi";

const SUGGESTED_PROMPTS = [
  "💡 Tell me a fun science fact",
  "💻 How to create a React component?",
  "🌟 Ek motivational shayari sunao",
  "🎭 Tell me a funny joke",
  "📝 Help me write a professional email"
];

const Messages = () => {
  useGetMessages();
  useGetGroupMessages();
  const dispatch = useDispatch();
  const { messages } = useSelector((store) => store.message);
  const { selectedGroup, groupMessages } = useSelector((store) => store.group);
  const { selectedUser, authUser, typingUsers } = useSelector((store) => store.user);
  const scrollRef = useRef(null);

  const activeMessages = selectedGroup ? groupMessages : messages;
  const isMetaAi = selectedUser?._id === "meta-ai";
  const isTyping = Boolean(selectedUser?._id && typingUsers?.[selectedUser._id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isTyping]);

  const handlePromptClick = async (promptText) => {
    const cleanPrompt = promptText.replace(/^[^\w\s]+/, "").trim();
    const userMsg = {
      _id: `user-msg-${Date.now()}`,
      senderId: authUser?._id,
      message: cleanPrompt,
      createdAt: new Date().toISOString()
    };
    const currentList = messages || [];
    const updatedWithUser = [...currentList, userMsg];

    const typingMsg = {
      _id: "meta-ai-typing",
      senderId: "meta-ai",
      message: "thinking...",
      isTyping: true,
      createdAt: new Date().toISOString(),
    };

    dispatch(setMessages([...updatedWithUser, typingMsg]));
    localStorage.setItem("meta_ai_chat_history", JSON.stringify(updatedWithUser));

    const aiReplyText = await generateAiReply(cleanPrompt);
    const aiMsg = {
      _id: `meta-ai-${Date.now()}`,
      senderId: "meta-ai",
      message: aiReplyText,
      createdAt: new Date().toISOString()
    };
    const finalMessages = [...updatedWithUser, aiMsg];
    dispatch(setMessages(finalMessages));
    localStorage.setItem("meta_ai_chat_history", JSON.stringify(finalMessages));
  };

  return (
    <div className="px-3 sm:px-6 py-4 flex-1 min-h-0 overflow-y-auto space-y-1">
      {/* Notice / Encryption */}
      <div className="flex justify-center my-3">
        {isMetaAi ? (
          <div className="bg-white/90 text-[#54656f] text-[11px] font-medium px-4 py-1.5 rounded-lg shadow-sm max-w-md text-center flex items-center gap-2 border border-blue-200/60">
            <span className="text-blue-500 font-bold">✨</span>
            <span>Meta AI uses Llama 3 to assist you. Messages are private and secure.</span>
          </div>
        ) : (
          <div className="bg-[#ffeecd]/90 text-[#54656f] text-[11px] font-medium px-4 py-1.5 rounded-lg shadow-sm max-w-md text-center flex items-center gap-1.5 border border-amber-200/60">
            <IoLockClosed className="text-amber-600 text-xs shrink-0" />
            <span>Messages are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
          </div>
        )}
      </div>

      {/* Date Divider Badge */}
      <div className="flex justify-center my-2">
        <span className="bg-white/90 text-[#54656f] text-[11px] font-semibold tracking-wider px-3 py-1 rounded-lg shadow-sm uppercase border border-gray-200/50">
          Today
        </span>
      </div>

      {/* Meta AI Welcome Hero if only intro message */}
      {isMetaAi && messages && messages.length <= 1 && (
        <div className="flex flex-col items-center justify-center my-4 p-4 text-center">
          <MetaAiRing size="w-16 h-16" />
          <h3 className="text-lg font-bold text-[#111b21] mt-3">
            Ask Meta AI anything
          </h3>
          <p className="text-xs text-[#667781] max-w-sm mt-1">
            Tap on any suggested topic below or type your question in the chat box!
          </p>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(prompt)}
                className="bg-white hover:bg-gray-50 active:scale-95 text-[#111b21] text-xs font-medium px-3 py-2 rounded-full border border-gray-200 shadow-sm transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {activeMessages && activeMessages.length > 0 ? (
        activeMessages.map((message) => (
          <Message key={message._id} message={message} />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-[#667781] text-sm">
          <p className="bg-white/80 px-4 py-2 rounded-xl shadow-sm">
            {selectedGroup
              ? "No messages yet in this group. Say hello! 👋"
              : "Say hello to start the conversation! 👋"}
          </p>
        </div>
      )}

      {/* Live Typing Indicator Bubble */}
      {isTyping && (
        <div className="flex items-center gap-2 my-2 animate-fadeIn">
          <div className="bg-white rounded-2xl rounded-tl-none px-3.5 py-2 shadow-sm border border-gray-100 flex items-center gap-1.5 w-fit">
            <span className="text-xs text-gray-500 font-medium mr-0.5">typing</span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
          </div>
        </div>
      )}
      <div ref={scrollRef} />
    </div>
  );
};

export default Messages;
