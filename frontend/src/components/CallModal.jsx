import React, { useState, useEffect } from "react";
import { MdCallEnd, MdMic, MdMicOff, MdVideocam, MdVideocamOff } from "react-icons/md";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { IoShieldCheckmark } from "react-icons/io5";
import { getAvatarUrl, handleImageError } from "../utils/avatar";

const CallModal = ({ isOpen, onClose, user, authUser, callType = "audio" }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState("Ringing...");
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus("Ringing...");
      setCallSeconds(0);
      setIsMuted(false);
      setIsVideoOff(callType === "audio");
      return;
    }

    // Simulate call connecting after 2.5s
    const connectTimer = setTimeout(() => {
      setCallStatus("Connected");
    }, 2500);

    return () => clearTimeout(connectTimer);
  }, [isOpen, callType]);

  useEffect(() => {
    let interval = null;
    if (callStatus === "Connected") {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  if (!isOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md h-[580px] bg-gradient-to-b from-[#1c2c35] via-[#111b21] to-[#0c1317] rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 border border-gray-700/50">
        
        {/* Header */}
        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-1">
            <IoShieldCheckmark className="text-emerald-400" />
            <span>End-to-end encrypted</span>
          </div>
          <h2 className="text-white text-2xl font-bold tracking-wide">
            {user?.fullName || "User"}
          </h2>
          <p className="text-sm font-medium text-emerald-400 mt-1">
            {callStatus === "Connected" ? formatTimer(callSeconds) : callStatus}
          </p>
          <span className="text-xs text-gray-400">
            {callType === "video" ? "WhatsApp Video Call" : "WhatsApp Audio Call"}
          </span>
        </div>

        {/* Center: Avatar & Calling visual effect */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          {/* Animated radar rings when ringing */}
          {callStatus === "Ringing..." && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
              <div className="absolute w-56 h-56 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
            </>
          )}

          {callType === "video" && !isVideoOff ? (
            <div className="relative w-64 h-64 rounded-2xl bg-zinc-800/80 border border-zinc-700 overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src={getAvatarUrl(user)}
                alt="user avatar"
                className="w-28 h-28 rounded-full border-2 border-emerald-400 shadow-md"
                onError={(e) => handleImageError(e, user?.fullName)}
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[11px] text-white">
                {user?.fullName}
              </div>

              {/* Picture in picture for self */}
              <div className="absolute top-2 right-2 w-16 h-20 bg-zinc-900 rounded-lg border border-white/20 overflow-hidden shadow-lg flex items-center justify-center">
                <img
                  src={getAvatarUrl(authUser)}
                  alt="self"
                  className="w-10 h-10 rounded-full"
                  onError={(e) => handleImageError(e, authUser?.fullName)}
                />
                <span className="absolute bottom-1 text-[9px] text-gray-300">You</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/80 shadow-2xl">
                <img
                  src={getAvatarUrl(user)}
                  alt="user avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, user?.fullName)}
                />
              </div>
              <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#111b21] flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="bg-[#1f2c34]/90 backdrop-blur-md rounded-2xl p-4 flex items-center justify-around border border-white/10 shadow-lg">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
              isMuted
                ? "bg-white text-zinc-900"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MdMicOff /> : <MdMic />}
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
              isVideoOff
                ? "bg-white/15 text-gray-400 hover:bg-white/25"
                : "bg-emerald-500 text-white"
            }`}
            title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
          >
            {isVideoOff ? <MdVideocamOff /> : <MdVideocam />}
          </button>

          {/* Speaker Button */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
              !isSpeakerOn
                ? "bg-white/15 text-gray-400"
                : "bg-white/15 text-white hover:bg-white/25"
            }`}
            title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
          >
            {isSpeakerOn ? <HiSpeakerWave /> : <HiSpeakerXMark />}
          </button>

          {/* Red End Call Button */}
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center text-2xl shadow-lg transition-transform"
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
