import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IoClose,
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
  IoCall,
  IoCameraReverseOutline,
  IoPersonAdd,
  IoCopy,
  IoCheckmark,
  IoShieldCheckmark,
  IoVolumeHigh,
} from "react-icons/io5";
import { closeGroupCall } from "../redux/groupCallSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:openrelay.metered.ca:80" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelay",
      credential: "openrelay",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelay",
      credential: "openrelay",
    },
  ],
};

// Video Tile for a Remote Peer
const RemotePeerTile = ({ peer }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [peer.stream]);

  const user = peer.user || {};

  return (
    <div className="relative w-full h-full min-h-[160px] bg-[#1a1f24] rounded-2xl overflow-hidden border border-[#2a3942] flex items-center justify-center shadow-lg group select-none">
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${
          peer.isVideoOff ? "hidden" : "block"
        }`}
      />

      {/* Fallback Avatar when camera is off */}
      {peer.isVideoOff && (
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <div className="relative">
            <img
              src={getAvatarUrl(user)}
              alt={user.fullName || "Peer"}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#25d366]/60 shadow-xl"
              onError={(e) => handleImageError(e, user.fullName)}
            />
            {!peer.isMuted && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#25d366] text-[#0b141a] rounded-full flex items-center justify-center text-xs shadow-md">
                <IoVolumeHigh size={12} />
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-200">
            {user.fullName || user.username || "Participant"}
          </span>
        </div>
      )}

      {/* Peer Name Tag & Mic Status */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-medium flex items-center gap-1.5 max-w-[80%] border border-white/10 shadow-sm truncate">
          <span className="truncate">{user.fullName || user.username || "Friend"}</span>
        </div>
        {peer.isMuted && (
          <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
            <IoMicOff size={12} />
          </div>
        )}
      </div>
    </div>
  );
};

const GroupCallModal = () => {
  const dispatch = useDispatch();
  const { isGroupCallOpen, activeRoomId, callType, roomTitle } = useSelector(
    (store) => store.groupCall
  );
  const { socket } = useSelector((store) => store.socket);
  const { authUser, otherUsers, onlineUsers } = useSelector(
    (store) => store.user
  );

  const [, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [facingMode, setFacingMode] = useState("user");
  const [callTimer, setCallTimer] = useState(0);
  const [peers, setPeers] = useState({}); // { [socketId]: { user, stream, isMuted, isVideoOff } }
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { [socketId]: RTCPeerConnection }
  const timerIntervalRef = useRef(null);

  // Stop all media tracks and clean up WebRTC connections
  const cleanupGroupCall = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    peerConnectionsRef.current = {};
    setPeers({});

    if (socket && activeRoomId) {
      socket.emit("leaveGroupCall", { roomId: activeRoomId });
    }
  }, [socket, activeRoomId]);

  // Create a peer connection for a specific peer
  const createPeerConnection = useCallback(
    (targetSocketId, targetUser, isInitiator = false) => {
      if (peerConnectionsRef.current[targetSocketId]) {
        return peerConnectionsRef.current[targetSocketId];
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current[targetSocketId] = pc;

      // Add local media tracks to this peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote ICE candidate
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("groupCallIceCandidate", {
            toSocketId: targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Handle receiving remote media stream
      pc.ontrack = (event) => {
        const [remoteMediaStream] = event.streams;
        setPeers((prev) => ({
          ...prev,
          [targetSocketId]: {
            user: targetUser || prev[targetSocketId]?.user,
            stream: remoteMediaStream,
            isMuted: prev[targetSocketId]?.isMuted || false,
            isVideoOff: prev[targetSocketId]?.isVideoOff || false,
          },
        }));
      };

      // If this client is the initiator, create and send WebRTC Offer
      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (socket) {
              socket.emit("groupCallSignal", {
                toSocketId: targetSocketId,
                signal: pc.localDescription,
                fromUser: authUser,
                isOffer: true,
              });
            }
          })
          .catch((err) => console.error("Error creating group call offer:", err));
      }

      return pc;
    },
    [socket, authUser]
  );

  // Initialize Local Media Stream on Room Open
  useEffect(() => {
    if (!isGroupCallOpen) return;

    let isMounted = true;

    const startLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video" ? { facingMode: "user" } : false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current && callType === "video") {
          localVideoRef.current.srcObject = stream;
        }

        // Join Group Call room via Socket.io
        if (socket && activeRoomId) {
          socket.emit("joinGroupCall", {
            roomId: activeRoomId,
            user: authUser,
            isMuted: false,
            isVideoOff: callType === "audio",
          });
        }

        // Start Call Duration Timer
        timerIntervalRef.current = setInterval(() => {
          setCallTimer((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Failed to access camera/mic for group call:", err);
        toast.error("Could not access microphone/camera. Please check permissions!");
      }
    };

    startLocalMedia();

    return () => {
      isMounted = false;
      cleanupGroupCall();
    };
  }, [isGroupCallOpen, activeRoomId, callType, socket, authUser, cleanupGroupCall]);

  // Socket Events Listener for Group WebRTC Signaling
  useEffect(() => {
    if (!socket || !isGroupCallOpen) return;

    // 1. Existing peers list received when joining
    const handleExistingPeers = ({ peers: existingPeers }) => {
      if (!existingPeers || existingPeers.length === 0) return;
      existingPeers.forEach((peer) => {
        // Connect to existing peer as initiator (send offer)
        createPeerConnection(peer.socketId, peer.user, true);
        setPeers((prev) => ({
          ...prev,
          [peer.socketId]: {
            user: peer.user,
            stream: null,
            isMuted: peer.isMuted,
            isVideoOff: peer.isVideoOff,
          },
        }));
      });
    };

    // 2. A new peer joined the group call
    const handlePeerJoined = ({ peer }) => {
      setPeers((prev) => ({
        ...prev,
        [peer.socketId]: {
          user: peer.user,
          stream: null,
          isMuted: peer.isMuted,
          isVideoOff: peer.isVideoOff,
        },
      }));
      toast.success(`${peer.user?.fullName || "A friend"} joined the call! 👥`, {
        id: `peer-join-${peer.socketId}`,
      });
    };

    // 3. WebRTC Signal (Offer or Answer) received from a peer
    const handleSignal = async ({ fromSocketId, signal, fromUser, isOffer }) => {
      try {
        let pc = peerConnectionsRef.current[fromSocketId];
        if (!pc) {
          pc = createPeerConnection(fromSocketId, fromUser, false);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signal));

        if (isOffer) {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("groupCallSignal", {
            toSocketId: fromSocketId,
            signal: pc.localDescription,
            fromUser: authUser,
            isOffer: false,
          });
        }
      } catch (err) {
        console.error("Signal handling error:", err);
      }
    };

    // 4. ICE candidate received from a peer
    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      try {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Add ICE candidate error:", err);
      }
    };

    // 5. Peer updated media state (mute / camera toggle)
    const handlePeerMediaChanged = ({ socketId, isMuted: pMuted, isVideoOff: pVideoOff }) => {
      setPeers((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: {
            ...prev[socketId],
            isMuted: pMuted,
            isVideoOff: pVideoOff,
          },
        };
      });
    };

    // 6. Peer left the room
    const handlePeerLeft = ({ socketId }) => {
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      setPeers((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    };

    socket.on("groupCallExistingPeers", handleExistingPeers);
    socket.on("groupCallPeerJoined", handlePeerJoined);
    socket.on("groupCallSignal", handleSignal);
    socket.on("groupCallIceCandidate", handleIceCandidate);
    socket.on("groupCallPeerMediaChanged", handlePeerMediaChanged);
    socket.on("groupCallPeerLeft", handlePeerLeft);

    return () => {
      socket.off("groupCallExistingPeers", handleExistingPeers);
      socket.off("groupCallPeerJoined", handlePeerJoined);
      socket.off("groupCallSignal", handleSignal);
      socket.off("groupCallIceCandidate", handleIceCandidate);
      socket.off("groupCallPeerMediaChanged", handlePeerMediaChanged);
      socket.off("groupCallPeerLeft", handlePeerLeft);
    };
  }, [socket, isGroupCallOpen, authUser, createPeerConnection]);

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const nextMuted = !audioTrack.enabled;
        setIsMuted(nextMuted);
        if (socket && activeRoomId) {
          socket.emit("groupCallMediaState", {
            roomId: activeRoomId,
            isMuted: nextMuted,
            isVideoOff,
          });
        }
      }
    }
  };

  // Toggle Camera On/Off
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const nextVideoOff = !videoTrack.enabled;
        setIsVideoOff(nextVideoOff);
        if (socket && activeRoomId) {
          socket.emit("groupCallMediaState", {
            roomId: activeRoomId,
            isMuted,
            isVideoOff: nextVideoOff,
          });
        }
      }
    }
  };

  // Switch Mobile Camera (Front / Back)
  const handleSwitchCamera = async () => {
    if (!localStreamRef.current || isVideoOff) return;
    try {
      const nextMode = facingMode === "user" ? "environment" : "user";
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace video track in local stream and peer connections
      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(newVideoTrack);
        }
      });

      setFacingMode(nextMode);
      toast.success(nextMode === "user" ? "Switched to front camera" : "Switched to back camera");
    } catch (e) {
      console.error("Switch camera error:", e);
    }
  };

  // Invite an online friend to this group call
  const handleInviteFriend = (friend) => {
    if (!socket || !activeRoomId) return;
    socket.emit("inviteToGroupCall", {
      toUserId: friend._id,
      roomId: activeRoomId,
      fromUser: authUser,
      callType: isVideoOff ? "audio" : "video",
    });
    toast.success(`Invite sent to ${friend.fullName}! 🚀`, {
      id: `invite-${friend._id}`,
    });
  };

  // Copy Room Invite Link
  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}?groupCall=${activeRoomId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success("Room invite link copied! 📋", { id: "link-copy" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Leave and Close Group Call
  const handleLeaveCall = () => {
    cleanupGroupCall();
    dispatch(closeGroupCall());
    toast("You left the group call.", { icon: "👋" });
  };

  if (!isGroupCallOpen) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const peerList = Object.entries(peers);
  const totalParticipants = peerList.length + 1; // Peers + You

  // Dynamic grid column layout based on number of participants
  const getGridClasses = () => {
    if (totalParticipants === 1) return "grid-cols-1 max-w-2xl";
    if (totalParticipants === 2) return "grid-cols-1 sm:grid-cols-2 max-w-4xl";
    if (totalParticipants <= 4) return "grid-cols-2 max-w-4xl";
    return "grid-cols-2 sm:grid-cols-3 max-w-5xl";
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#0b141a]/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-fade-in text-white">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-3 py-2 bg-[#111b21]/80 backdrop-blur-md rounded-2xl border border-[#202c33] shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#103629] text-[#25d366] flex items-center justify-center shadow-xs">
            <IoCall size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-gray-100">
                {roomTitle || "Group Call Room"}
              </h3>
              <span className="text-[10px] bg-[#202c33] text-[#25d366] px-1.5 py-0.2 rounded-full font-semibold">
                👥 {totalParticipants} Live
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#8696a0]">
              <span className="font-mono text-[#25d366]">{formatTimer(callTimer)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[10px]">
                <IoShieldCheckmark size={12} className="text-[#25d366]" /> End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1 text-[11px] bg-[#202c33] hover:bg-[#2a3942] text-gray-200 px-3 py-1.5 rounded-xl border border-white/10 transition active:scale-95 cursor-pointer"
            title="Copy Invite Link"
          >
            {copiedLink ? <IoCheckmark size={14} className="text-[#25d366]" /> : <IoCopy size={13} />}
            <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>

          {/* Invite Friends Button */}
          <button
            onClick={() => setShowInviteDrawer(!showInviteDrawer)}
            className="flex items-center gap-1 text-[11px] bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] font-bold px-3 py-1.5 rounded-xl transition active:scale-95 cursor-pointer shadow-md"
          >
            <IoPersonAdd size={14} />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>
      </div>

      {/* Main Multi-User Video Grid View */}
      <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className={`w-full grid gap-3 sm:gap-4 auto-rows-fr h-full max-h-[72vh] ${getGridClasses()}`}>
          {/* Local User Tile (You) */}
          <div className="relative w-full h-full min-h-[160px] bg-[#1a1f24] rounded-2xl overflow-hidden border-2 border-[#25d366]/40 flex items-center justify-center shadow-xl group">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${
                isVideoOff ? "hidden" : "block"
              }`}
            />

            {/* Fallback avatar if local video is off */}
            {isVideoOff && (
              <div className="flex flex-col items-center justify-center gap-2 p-4">
                <img
                  src={getAvatarUrl(authUser)}
                  alt="You"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#25d366] shadow-xl"
                  onError={(e) => handleImageError(e, authUser?.fullName)}
                />
                <span className="text-xs font-semibold text-gray-200">
                  {authUser?.fullName || "You"} (Camera Off)
                </span>
              </div>
            )}

            {/* Local User Badge */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-medium flex items-center gap-1 border border-white/10 shadow-sm">
                <span>{authUser?.fullName || "You"} (You)</span>
              </div>
              {isMuted && (
                <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
                  <IoMicOff size={12} />
                </div>
              )}
            </div>
          </div>

          {/* Remote Peers Tiles */}
          {peerList.map(([socketId, peer]) => (
            <RemotePeerTile key={socketId} peer={peer} />
          ))}

          {/* Waiting banner if alone in room */}
          {peerList.length === 0 && (
            <div className="hidden sm:flex flex-col items-center justify-center bg-[#111b21]/60 rounded-2xl border border-dashed border-[#2a3942] p-6 text-center text-gray-400">
              <div className="w-12 h-12 rounded-full bg-[#202c33] text-[#25d366] flex items-center justify-center mb-2 animate-bounce">
                <IoPersonAdd size={22} />
              </div>
              <h4 className="text-sm font-semibold text-gray-200">
                Waiting for friends to join...
              </h4>
              <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
                Click <b>"Invite"</b> above to call friends directly into this room!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar (Glassmorphic WhatsApp/Zoom Style) */}
      <div className="px-5 py-3 bg-[#111b21]/90 backdrop-blur-md rounded-full border border-[#202c33] shadow-2xl flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Mute / Unmute Button */}
        <button
          onClick={handleToggleMute}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-lg ${
            isMuted
              ? "bg-red-500/90 hover:bg-red-600 text-white"
              : "bg-[#202c33] hover:bg-[#2a3942] text-white border border-white/10"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <IoMicOff /> : <IoMic />}
        </button>

        {/* Video On / Off Button */}
        <button
          onClick={handleToggleVideo}
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-lg ${
            isVideoOff
              ? "bg-red-500/90 hover:bg-red-600 text-white"
              : "bg-[#202c33] hover:bg-[#2a3942] text-white border border-white/10"
          }`}
          title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
        >
          {isVideoOff ? <IoVideocamOff /> : <IoVideocam />}
        </button>

        {/* Switch Front/Back Camera */}
        {!isVideoOff && (
          <button
            onClick={handleSwitchCamera}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-white border border-white/10 flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-lg"
            title="Switch Camera"
          >
            <IoCameraReverseOutline />
          </button>
        )}

        {/* End / Leave Group Call Button */}
        <button
          onClick={handleLeaveCall}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl transition active:scale-95 cursor-pointer shadow-xl shadow-red-600/40 ml-1"
          title="Leave Call"
        >
          <IoClose />
        </button>
      </div>

      {/* Slide-over Invite Friends Drawer */}
      {showInviteDrawer && (
        <div className="absolute right-4 top-20 bottom-24 w-72 bg-[#111b21] border border-[#2a3942] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-left">
          <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <IoPersonAdd size={14} className="text-[#25d366]" />
              <span>Invite Friends to Room</span>
            </h4>
            <button
              onClick={() => setShowInviteDrawer(false)}
              className="text-[#8696a0] hover:text-white"
            >
              <IoClose size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-[#202c33]/40">
            {!otherUsers || otherUsers.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">
                No friends found. Add friends first!
              </p>
            ) : (
              otherUsers.map((friend) => {
                const isOnline = onlineUsers?.includes(friend._id);
                return (
                  <div
                    key={friend._id}
                    className="pt-1.5 flex items-center justify-between p-1.5 hover:bg-[#202c33]/50 rounded-xl"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative">
                        <img
                          src={getAvatarUrl(friend)}
                          alt={friend.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => handleImageError(e, friend.fullName)}
                        />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] border-2 border-[#111b21] rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate">
                          {friend.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInviteFriend(friend)}
                      className="px-2.5 py-1 rounded-lg bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      Invite
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupCallModal;
