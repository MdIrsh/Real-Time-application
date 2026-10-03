import React from "react";
import { useCall } from "../context/CallContext";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { MdCall, MdCallEnd, MdVideocam } from "react-icons/md";
import { IoShieldCheckmark } from "react-icons/io5";

const IncomingCallModal = () => {
  const {
    callActive,
    isIncoming,
    callUser,
    callType,
    acceptIncomingCall,
    declineIncomingCall,
  } = useCall();

  if (!callActive || !isIncoming || !callUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1f2c34] to-[#111b21] rounded-3xl shadow-2xl p-6 flex flex-col items-center justify-between text-white border border-gray-700/60 overflow-hidden">
        {/* Animated Radar Pulse Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full bg-emerald-500/15 animate-ping" />
          <div className="w-64 h-64 rounded-full bg-emerald-500/10 animate-pulse" />
        </div>

        {/* Top Info */}
        <div className="text-center z-10 pt-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
            <IoShieldCheckmark className="text-emerald-400" />
            <span>End-to-end encrypted</span>
          </div>
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
            {callType === "video" ? "📹 Video Call" : "📞 Audio Call"}
          </span>
          <h3 className="text-2xl font-bold text-white tracking-wide truncate max-w-[260px]">
            {callUser.fullName}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Incoming WhatsApp {callType === "video" ? "Video" : "Voice"} Call...
          </p>
        </div>

        {/* Caller Avatar */}
        <div className="relative my-8 z-10">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl">
            <img
              src={getAvatarUrl(callUser)}
              alt={callUser.fullName}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, callUser.fullName)}
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-2 border-[#111b21] flex items-center justify-center text-white text-lg shadow-lg">
            {callType === "video" ? <MdVideocam /> : <MdCall />}
          </div>
        </div>

        {/* Action Buttons: Decline (Red) and Accept (Green) */}
        <div className="w-full flex items-center justify-around z-10 pt-4 border-t border-white/10">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={declineIncomingCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center text-3xl shadow-xl transition-all"
              title="Decline Call"
            >
              <MdCallEnd />
            </button>
            <span className="text-xs text-gray-400 font-medium">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptIncomingCall}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center text-3xl shadow-xl transition-all animate-bounce"
              title="Accept Call"
            >
              <MdCall />
            </button>
            <span className="text-xs text-emerald-400 font-semibold">Answer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
