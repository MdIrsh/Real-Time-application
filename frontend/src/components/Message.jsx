import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

const Message = ({ message }) => {
  const scroll = useRef();
  const { authUser } = useSelector((store) => store.user);

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const isSentByMe = authUser?._id === message?.senderId;
  const isMetaAi = message?.senderId === "meta-ai";
  const isTyping = message?.isTyping;

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

        {/* Typing indicator or message content */}
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1 px-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            <span className="text-xs text-gray-500 ml-1.5 italic font-medium">Meta AI is thinking...</span>
          </div>
        ) : (
          message?.message && (
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
              <IoCheckmarkDoneSharp className="text-[#53bdeb] text-sm" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
