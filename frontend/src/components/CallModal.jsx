import React from "react";
import { useCall } from "../context/CallContext";
import { MdCallEnd, MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";
import { IoShieldCheckmark } from "react-icons/io5";
import { getAvatarUrl, handleImageError } from "../utils/avatar";

const CallModal = () => {
  const {
    callActive,
    isIncoming,
    callUser,
    callType,
    callStatus,
    callSeconds,
    isMuted,
    isVideoOff,
    localVideoRef,
    remoteVideoRef,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  // Only render if call is active and NOT in incoming ringing state
  if (!callActive || isIncoming || !callUser) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isConnected = callStatus === "Connected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-lg h-[620px] bg-gradient-to-b from-[#1c2c35] via-[#111b21] to-[#0c1317] rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between p-5 sm:p-6 border border-gray-700/60">
        
        {/* Header */}
        <div className="text-center pt-1 z-20">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 mb-1">
            <IoShieldCheckmark className="text-emerald-400 text-xs" />
            <span>End-to-end encrypted</span>
          </div>
          <h2 className="text-white text-xl sm:text-2xl font-bold tracking-wide truncate max-w-sm mx-auto">
            {callUser?.fullName || "User"}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">
            {isConnected ? formatTimer(callSeconds) : callStatus}
          </p>
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">
            {callType === "video" ? "WhatsApp Video Call" : "WhatsApp Voice Call"}
          </span>
        </div>

        {/* Center: Video streams or Audio Avatar view */}
        <div className="relative flex-1 my-3 flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-900/90 border border-white/5">
          {callType === "video" ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isConnected ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Placeholder when remote stream is connecting */}
              {!isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative">
                    <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-400/80 shadow-2xl">
                      <img
                        src={getAvatarUrl(callUser)}
                        alt={callUser?.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => handleImageError(e, callUser?.fullName)}
                      />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping pointer-events-none opacity-40" />
                  </div>
                  <p className="text-sm text-gray-300 mt-4 font-medium animate-pulse">
                    Connecting camera feed...
                  </p>
                </div>
              )}

              {/* Local Video Stream (Picture-in-Picture in top-right) */}
              <div className="absolute top-3 right-3 w-28 h-40 sm:w-32 sm:h-44 bg-zinc-900 rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl z-30">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isVideoOff ? "hidden" : "block"
                  }`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-gray-400 text-xs">
                    Camera Off
                  </div>
                )}
                <span className="absolute bottom-1 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                  You
                </span>
              </div>
            </div>
          ) : (
            /* Audio Call Screen */
            <div className="relative flex flex-col items-center justify-center">
              {/* Radar rings when calling */}
              {!isConnected && (
                <>
                  <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                  <div className="absolute w-60 h-60 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
                </>
              )}

              {/* User Avatar with audio wave effect */}
              <div className="relative">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl">
                  <img
                    src={getAvatarUrl(callUser)}
                    alt={callUser?.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => handleImageError(e, callUser?.fullName)}
                  />
                </div>
                {isConnected && (
                  <span className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#111b21] flex items-center justify-center text-white text-xs shadow-md">
                    ✓
                  </span>
                )}
              </div>

              {/* Status text */}
              <p className="text-xs text-gray-400 mt-4">
                {isConnected ? "Live Audio Connected 🎙️" : "Calling..."}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Bar */}
        <div className="bg-[#1f2c34]/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 flex items-center justify-around border border-white/10 shadow-xl z-20">
          {/* Mute Mic Button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-md ${
              isMuted
                ? "bg-white text-zinc-900 scale-105"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MdMicOff /> : <MdMic />}
          </button>

          {/* Video Toggle Button (only in video call) */}
          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-md ${
                isVideoOff
                  ? "bg-white/15 text-gray-400 hover:bg-white/25"
                  : "bg-emerald-500 text-white"
              }`}
              title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isVideoOff ? <MdVideocamOff /> : <MdVideocam />}
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center text-2xl shadow-xl transition-all"
            title="End Call"
          >
            <MdCallEnd />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
