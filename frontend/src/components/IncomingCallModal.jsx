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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/85 backdrop-blur-md transition-all p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm h-[580px] bg-[#162330] rounded-[32px] shadow-2xl p-6 flex flex-col items-center justify-between text-white border border-white/15 overflow-hidden">
        {/* Blurred Portrait Backdrop matching screenshot */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src={getAvatarUrl(callUser)}
            alt=""
            className="w-full h-full object-cover scale-125 blur-3xl opacity-45"
            onError={(e) => handleImageError(e, callUser.fullName)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c2b3a]/75 via-[#152230]/82 to-[#0e1720]/94" />
        </div>

        {/* Top Info */}
        <div className="text-center z-10 pt-3">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-300 mb-2">
            <IoShieldCheckmark className="text-[#2ecc71]" />
            <span>End-to-end encrypted</span>
          </div>
          <span className="inline-block bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3 border border-white/10">
            {callType === "video" ? "📹 Incoming Video Call" : "📞 Incoming Voice Call"}
          </span>
          <h3 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide truncate max-w-[260px]">
            {callUser.fullName}
          </h3>
          <p className="text-xs text-gray-300 mt-1 animate-pulse">
            Ringing...
          </p>
        </div>

        {/* Caller Avatar */}
        <div className="relative my-auto z-10">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/25 shadow-2xl">
            <img
              src={getAvatarUrl(callUser)}
              alt={callUser.fullName}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, callUser.fullName)}
            />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[#2ecc71]/50 animate-ping pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#2ecc71] border-2 border-[#162330] flex items-center justify-center text-white text-base shadow-lg">
            {callType === "video" ? <MdVideocam /> : <MdCall />}
          </div>
        </div>

        {/* Action Buttons: Decline (Coral Red) and Answer (Emerald Green) */}
        <div className="w-full flex items-center justify-around z-10 pt-4 pb-2">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={declineIncomingCall}
              className="w-16 h-16 rounded-full bg-[#e06363] hover:bg-[#d95353] active:scale-95 text-white flex items-center justify-center text-3xl shadow-[0_8px_25px_rgba(224,99,99,0.45)] transition-all cursor-pointer"
              title="Decline Call"
            >
              <MdCallEnd />
            </button>
            <span className="text-xs text-gray-300 font-medium">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptIncomingCall}
              className="w-16 h-16 rounded-full bg-[#2ecc71] hover:bg-[#27ae60] active:scale-95 text-white flex items-center justify-center text-3xl shadow-[0_8px_25px_rgba(46,204,113,0.45)] transition-all animate-bounce cursor-pointer"
              title="Accept Call"
            >
              <MdCall />
            </button>
            <span className="text-xs text-[#2ecc71] font-semibold">Answer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
