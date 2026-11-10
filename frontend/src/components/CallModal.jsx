import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useCall } from "../context/CallContext";
import { openGroupCall } from "../redux/groupCallSlice";
import {
  MdCallEnd,
  MdMic,
  MdMicOff,
  MdVideocam,
  MdVideocamOff,
  MdVolumeUp,
  MdVolumeDown,
  MdVolumeOff,
} from "react-icons/md";
import {
  IoCameraReverseOutline,
  IoPersonAdd,
  IoChatbubbleEllipses,
  IoRecordingOutline,
} from "react-icons/io5";
import { getAvatarUrl, handleImageError } from "../utils/avatar";

const CallModal = () => {
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const { authUser } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();
  const {
    callActive,
    isIncoming,
    callUser,
    callType,
    callStatus,
    callSeconds,
    isMuted,
    isVideoOff,
    isRemoteVideoOff,
    isRemoteMuted,
    audioBlocked,
    micPermissionDenied,
    enableAudio,
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    facingMode,
    callVolume,
    changeCallVolume,
  } = useCall();

  // Ensure remote video element has the active remote media stream
  useEffect(() => {
    if (callType === "video" && remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.muted = true; // Muted to avoid browser autoplay restriction; audio element plays the voice
      remoteVideoRef.current.play().catch((err) => {
        console.warn("remoteVideo autoplay restricted:", err);
      });
    }
  }, [remoteVideoRef, remoteStream, callType]);

  // Ensure local video element has the local camera stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localVideoRef, localStream]);

  // Only render if call is active and NOT in incoming ringing state
  if (!callActive || isIncoming || !callUser) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isConnected = callStatus === "Connected";

  const handleUpgradeToConference = () => {
    const roomId = `room-${Date.now().toString(36)}`;
    dispatch(
      openGroupCall({
        roomId,
        callType: callType || "video",
        roomTitle: `Conference with ${callUser?.fullName}`,
        invitedMembers: callUser ? [callUser] : [],
        openDrawerOnStart: true,
      })
    );
    if (socket && callUser?._id && authUser?._id) {
      socket.emit("inviteToGroupCall", {
        toUserId: callUser._id,
        roomId,
        fromUser: authUser,
        callType: callType || "video",
        roomTitle: `Group Video Call (${authUser?.fullName || "Friend"})`,
      });
    }
    endCall();
  };

  return (
    <div
      onClick={enableAudio}
      onTouchStart={enableAudio}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/85 backdrop-blur-md transition-all p-3 sm:p-6 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => {
          enableAudio();
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          enableAudio();
          e.stopPropagation();
        }}
        className="relative w-full max-w-md h-[640px] bg-[#162330] rounded-[32px] shadow-2xl overflow-hidden flex flex-col justify-between p-6 border border-white/15 cursor-default"
      >
        {/* Blurred Portrait Backdrop matching screenshot */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <img
            src={getAvatarUrl(callUser)}
            alt=""
            className="w-full h-full object-cover scale-125 blur-3xl opacity-45"
            onError={(e) => handleImageError(e, callUser?.fullName)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1c2b3a]/75 via-[#152230]/82 to-[#0e1720]/94" />
        </div>

        {/* Audio / Mic Permission Banners */}
        {(audioBlocked || micPermissionDenied) && (
          <div className="relative z-20 space-y-2 mb-1">
            {audioBlocked && (
              <div className="flex justify-center">
                <button
                  onClick={enableAudio}
                  onTouchStart={enableAudio}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-xl animate-bounce transition-all active:scale-95"
                >
                  <MdVolumeUp className="text-base" /> 🔊 Tap to turn on sound
                </button>
              </div>
            )}
            {micPermissionDenied && (
              <div className="bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-xl flex items-center justify-between shadow-lg animate-pulse">
                <span className="flex items-center gap-1.5">
                  <MdMicOff className="text-base shrink-0" />
                  <span>Mic blocked! Allow microphone permission.</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Center Area: Video Stream OR Frosted Audio Call Screen */}
        {callType === "video" ? (
          <div className="relative flex-1 my-2 flex flex-col justify-between overflow-hidden rounded-2xl bg-black/60 border border-white/10 z-10">
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isConnected && !isRemoteVideoOff ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Top Floating Info in Video Call */}
            <div className="absolute top-3 left-3 z-20 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10">
              <h2 className="text-white text-sm font-semibold leading-tight flex items-center gap-1.5">
                <span>{callUser?.fullName || "User"}</span>
                {isRemoteMuted && (
                  <MdMicOff className="text-red-400 text-xs" title="Muted" />
                )}
              </h2>
              <p className="text-[11px] font-medium text-[#2ecc71]">
                {isConnected ? formatTimer(callSeconds) : callStatus}
              </p>
            </div>

            {/* Placeholder DP when remote video is connecting OR remote user turned Camera Off */}
            {(!isConnected || isRemoteVideoOff) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#162330]/90">
                <img
                  src={getAvatarUrl(callUser)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-35 pointer-events-none"
                  onError={(e) => handleImageError(e, callUser?.fullName)}
                />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/30 shadow-2xl">
                    <img
                      src={getAvatarUrl(callUser)}
                      alt={callUser?.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, callUser?.fullName)}
                    />
                  </div>
                  <p className="text-xs text-gray-300 mt-4 font-medium flex items-center gap-1.5">
                    {isConnected && isRemoteVideoOff ? (
                      <>
                        <MdVideocamOff className="text-amber-300 text-sm" />
                        <span>Camera is off</span>
                      </>
                    ) : (
                      <span>Calling...</span>
                    )}
                  </p>
                  <h3 className="text-xl font-semibold text-white mt-0.5">
                    {callUser?.fullName}
                  </h3>
                </div>
              </div>
            )}

            {/* Local Video Stream (PiP in top-right) — Shows Local DP when Camera is Off */}
            <div className="absolute top-3 right-3 w-24 h-36 sm:w-28 sm:h-40 bg-[#162330] rounded-2xl border-2 border-white/25 overflow-hidden shadow-2xl z-30">
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
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1e2d3b] to-[#111b21] p-2 text-center">
                  <img
                    src={getAvatarUrl(authUser)}
                    alt={authUser?.fullName || "You"}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/30 shadow-lg"
                    onError={(e) => handleImageError(e, authUser?.fullName)}
                  />
                  <span className="text-[10px] text-gray-300 font-medium mt-1.5 flex items-center gap-1">
                    <MdVideocamOff size={11} className="text-gray-400" />
                    <span>Cam Off</span>
                  </span>
                </div>
              )}
              {!isVideoOff && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    switchCamera();
                  }}
                  className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-sm shadow-md transition-all active:scale-90 z-40 border border-white/20 cursor-pointer"
                  title={facingMode === "user" ? "Switch to Back Camera" : "Switch to Front Camera"}
                >
                  <IoCameraReverseOutline />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Audio Call Screen matching Screen 1 & Screen 2 */
          <div className="relative flex-1 flex flex-col items-center justify-center z-10 text-center">
            {!isConnected ? (
              /* Screen 1: Calling State */
              <div className="flex flex-col items-center justify-center my-auto">
                <div className="relative mb-6">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl">
                    <img
                      src={getAvatarUrl(callUser)}
                      alt={callUser?.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, callUser?.fullName)}
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping pointer-events-none opacity-40" />
                </div>
                <p className="text-xs text-gray-300 font-medium tracking-wide">
                  {callStatus || "Calling"}
                </p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-wide mt-1">
                  {callUser?.fullName || "User"}
                </h2>
              </div>
            ) : (
              /* Screen 2: In Call Connected State */
              <div className="w-full flex flex-col items-center justify-between py-4 flex-1">
                {/* Dual Avatars Header with >>> */}
                <div className="flex items-center justify-center gap-5 mt-2">
                  <img
                    src={getAvatarUrl(authUser)}
                    alt="You"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/25 shadow-lg"
                    onError={(e) => handleImageError(e, authUser?.fullName)}
                  />
                  <span className="text-white/60 text-sm tracking-[0.2em] font-bold animate-pulse">
                    &gt;&gt;&gt;
                  </span>
                  <img
                    src={getAvatarUrl(callUser)}
                    alt={callUser?.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/25 shadow-lg"
                    onError={(e) => handleImageError(e, callUser?.fullName)}
                  />
                </div>

                {/* In Call With + Name + Timer */}
                <div className="my-auto text-center">
                  <p className="text-xs font-semibold text-[#2ecc71] tracking-wide">
                    In Call with
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1">
                    {callUser?.fullName || "User"}
                  </h2>
                  <p className="text-sm text-gray-300 font-mono mt-1.5">
                    {formatTimer(callSeconds)}
                  </p>
                  {isMuted && (
                    <span className="inline-block mt-2 bg-red-500/20 text-red-300 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                      Mic Muted
                    </span>
                  )}
                </div>

                {/* Middle Floating Glassmorphic Action Pill matching Screen 2 */}
                <div className="bg-white/12 backdrop-blur-xl border border-white/15 rounded-2xl px-6 py-3 flex items-center justify-center gap-7 shadow-xl mb-4">
                  <button
                    type="button"
                    onClick={toggleVideo}
                    className="text-white/90 hover:text-white transition hover:scale-110 active:scale-95 cursor-pointer"
                    title="Switch to Video"
                  >
                    <MdVideocam size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={handleUpgradeToConference}
                    className="text-white/90 hover:text-white transition hover:scale-110 active:scale-95 cursor-pointer"
                    title="Add to Group Conference Call"
                  >
                    <IoPersonAdd size={19} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVolumePopup((prev) => !prev)}
                    className={`p-1.5 rounded-lg transition hover:scale-110 active:scale-95 cursor-pointer ${
                      callVolume > 1 || showVolumePopup
                        ? "bg-[#2ecc71] text-[#0f172a]"
                        : "bg-[#2ecc71]/25 text-[#2ecc71]"
                    }`}
                    title="Call Audio / Volume Boost"
                  >
                    <IoRecordingOutline size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVolumePopup((prev) => !prev)}
                    className="text-white/90 hover:text-white transition hover:scale-110 active:scale-95 cursor-pointer"
                    title="Audio Options"
                  >
                    <IoChatbubbleEllipses size={19} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Controls Dock matching Screen 1 & Screen 2 */}
        <div className="relative z-20 pt-2 pb-1">
          {/* Speaker Volume Popover */}
          {showVolumePopup && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#111c28]/95 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-2xl w-64 z-30 animate-fadeIn text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  {callVolume === 0 ? (
                    <MdVolumeOff className="text-red-400 text-sm" />
                  ) : callVolume < 0.5 ? (
                    <MdVolumeDown className="text-[#2ecc71] text-sm" />
                  ) : (
                    <MdVolumeUp className="text-[#2ecc71] text-sm" />
                  )}
                  Speaker Volume
                </span>
                <span className="text-xs font-bold text-[#2ecc71] bg-[#2ecc71]/10 px-2 py-0.5 rounded-full">
                  {Math.round(callVolume * 100)}%{callVolume > 1 ? " Boost" : ""}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={callVolume}
                onChange={(e) => changeCallVolume(e.target.value)}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#2ecc71] mb-3"
              />

              <div className="flex items-center justify-between gap-1 text-[10px]">
                <button
                  onClick={() => changeCallVolume(0)}
                  className={`flex-1 py-1 rounded-lg border transition-all ${
                    callVolume === 0
                      ? "bg-red-500/20 border-red-500/40 text-red-300 font-bold"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  Mute
                </button>
                <button
                  onClick={() => changeCallVolume(1)}
                  className={`flex-1 py-1 rounded-lg border transition-all ${
                    callVolume === 1
                      ? "bg-[#2ecc71]/20 border-[#2ecc71]/40 text-[#2ecc71] font-bold"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  100%
                </button>
                <button
                  onClick={() => changeCallVolume(1.5)}
                  className={`flex-1 py-1 rounded-lg border transition-all ${
                    callVolume === 1.5
                      ? "bg-[#2ecc71]/20 border-[#2ecc71]/40 text-[#2ecc71] font-bold"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  150%
                </button>
                <button
                  onClick={() => changeCallVolume(2)}
                  className={`flex-1 py-1 rounded-lg border transition-all ${
                    callVolume === 2
                      ? "bg-[#2ecc71]/30 border-[#2ecc71]/50 text-[#2ecc71] font-bold"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  200%
                </button>
              </div>
            </div>
          )}

          <div className="flex items-start justify-around">
            {/* Speaker Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setShowVolumePopup((prev) => !prev)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-lg backdrop-blur-md cursor-pointer ${
                  showVolumePopup || callVolume > 1
                    ? "bg-white text-[#162330]"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                title="Speaker Volume"
              >
                {callVolume === 0 ? (
                  <MdVolumeOff className="text-red-400" />
                ) : callVolume < 0.5 ? (
                  <MdVolumeDown />
                ) : (
                  <MdVolumeUp />
                )}
              </button>
              <span className="text-[11px] text-gray-300 font-medium mt-1.5">
                Speaker
              </span>
            </div>

            {/* Video On/Off (only in video call mode) */}
            {callType === "video" && (
              <div className="flex flex-col items-center">
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-lg backdrop-blur-md cursor-pointer ${
                    isVideoOff
                      ? "bg-white/15 text-gray-400 hover:bg-white/25"
                      : "bg-white text-[#162330]"
                  }`}
                  title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                >
                  {isVideoOff ? <MdVideocamOff /> : <MdVideocam />}
                </button>
                <span className="text-[11px] text-gray-300 font-medium mt-1.5">
                  Video
                </span>
              </div>
            )}

            {/* Coral-Red End Call Button matching screenshot */}
            <div className="flex flex-col items-center">
              <button
                onClick={endCall}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e06363] hover:bg-[#d95353] active:scale-95 text-white flex items-center justify-center text-3xl shadow-[0_8px_25px_rgba(224,99,99,0.45)] transition-all cursor-pointer"
                title="End Call"
              >
                <MdCallEnd />
              </button>
            </div>

            {/* Mute Mic Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={toggleMute}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-lg backdrop-blur-md cursor-pointer ${
                  isMuted
                    ? "bg-white text-[#162330]"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MdMicOff /> : <MdMic />}
              </button>
              <span className="text-[11px] text-gray-300 font-medium mt-1.5">
                {isMuted ? "Unmute" : "Mute"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
