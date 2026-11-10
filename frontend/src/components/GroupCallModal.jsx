import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IoClose,
  IoMic,
  IoMicOff,
  IoVideocam,
  IoVideocamOff,
  IoCameraReverseOutline,
  IoPersonAdd,
  IoPersonAddOutline,
  IoCopy,
  IoCheckmark,
  IoShieldCheckmark,
  IoVolumeHigh,
  IoChevronBack,
  IoGridOutline,
  IoListOutline,
} from "react-icons/io5";
import { MdCallEnd } from "react-icons/md";
import { closeGroupCall } from "../redux/groupCallSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { getActiveUserStatus } from "../utils/statusHelper";
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

// Video & Audio Tile for a Remote Peer
const RemotePeerTile = ({ peer }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(() => {});
    }
    if (audioRef.current && peer.stream) {
      audioRef.current.srcObject = peer.stream;
      audioRef.current.play().catch(() => {});
    }
  }, [peer.stream]);

  const user = peer.user || {};

  return (
    <div className="relative w-full h-full min-h-[150px] sm:min-h-[160px] bg-[#1a1f24] rounded-2xl overflow-hidden border border-[#2a3942] flex items-center justify-center shadow-lg group select-none">
      {/* Dedicated Audio Element ensures remote voice ALWAYS plays in Conference list & Camera-Off modes */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        className="w-0 h-0 opacity-0 pointer-events-none"
      />

      {/* Video Element (muted because dedicated <audio> handles sound) */}
      <video
        ref={videoRef}
        autoPlay
        muted
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
  const {
    isGroupCallOpen,
    activeRoomId,
    activeGroupId,
    callType,
    roomTitle,
    invitedMembers,
  } = useSelector((store) => store.groupCall);
  const { socket } = useSelector((store) => store.socket);
  const { authUser, otherUsers, onlineUsers, userStatuses } = useSelector(
    (store) => store.user
  );

  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [facingMode, setFacingMode] = useState("user");
  const [callTimer, setCallTimer] = useState(0);
  const [peers, setPeers] = useState({}); // { [socketId]: { user, stream, isMuted, isVideoOff } }
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState(callType === "audio" ? "conference" : "grid");
  const [invitedFriends, setInvitedFriends] = useState([]);

  useEffect(() => {
    if (isGroupCallOpen) {
      setIsVideoOff(callType === "audio");
      setIsMuted(false);
      setCallTimer(0);
      setViewMode(callType === "audio" ? "conference" : "grid");
      setInvitedFriends(Array.isArray(invitedMembers) ? invitedMembers : []);
    }
  }, [isGroupCallOpen, callType, invitedMembers]);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { [socketId]: RTCPeerConnection }
  const iceQueuesRef = useRef({}); // { [socketId]: RTCIceCandidateInit[] }
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, viewMode, isVideoOff, isGroupCallOpen]);

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
    iceQueuesRef.current = {};
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
        pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        })
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

  // Initialize Local Media Stream on Room Open (with automatic audio/listen-only fallback)
  useEffect(() => {
    if (!isGroupCallOpen) return;

    let isMounted = true;

    const startLocalMedia = async () => {
      let stream = null;
      let effectiveVideoOff = callType === "audio";

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video" ? { facingMode: "user" } : false,
        });
      } catch (primaryErr) {
        if (callType === "video") {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            effectiveVideoOff = true;
            toast("Camera unavailable — joined with audio", { icon: "🎙️" });
          } catch (audioErr) {
            effectiveVideoOff = true;
            toast.error("Mic/camera blocked — joined in listen mode");
          }
        } else {
          effectiveVideoOff = true;
          toast.error("Mic permission blocked — joined in listen mode");
        }
      }

      if (!isMounted) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoOff(effectiveVideoOff);

      if (localVideoRef.current && stream && !effectiveVideoOff) {
        localVideoRef.current.srcObject = stream;
      }

      // Always join Group Call room via Socket.io so signaling completes reliably
      if (socket && activeRoomId) {
        socket.emit("joinGroupCall", {
          roomId: activeRoomId,
          user: authUser,
          isMuted: !stream,
          isVideoOff: effectiveVideoOff,
        });
      }

      // Start Call Duration Timer
      timerIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
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

        // Flush any ICE candidates queued before remoteDescription was ready
        const queued = iceQueuesRef.current[fromSocketId] || [];
        if (queued.length > 0) {
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
          delete iceQueuesRef.current[fromSocketId];
        }

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
        if (!candidate) return;
        const pc = peerConnectionsRef.current[fromSocketId];
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!iceQueuesRef.current[fromSocketId]) {
            iceQueuesRef.current[fromSocketId] = [];
          }
          iceQueuesRef.current[fromSocketId].push(candidate);
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
    setInvitedFriends((prev) =>
      prev.some((f) => String(f._id) === String(friend._id)) ? prev : [...prev, friend]
    );
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
    if (Object.keys(peers).length === 0 && socket && activeRoomId) {
      socket.emit("cancelGroupCall", {
        roomId: activeRoomId,
        groupId: activeGroupId,
        participantIds: invitedFriends.map((f) => f?._id || f).filter(Boolean),
      });
    }
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

  // Pending invited friends who haven't joined peerList yet
  const pendingInvites = invitedFriends.filter(
    (inv) => !peerList.some(([, p]) => String(p.user?._id) === String(inv._id))
  );

  return (
    <div className="fixed inset-0 z-[120] h-[100dvh] bg-[#0e1c2f] flex flex-col items-center justify-between p-3 sm:p-6 select-none animate-fade-in text-white overflow-hidden">
      {/* Top Header Bar matching Screen 3 (< Conference) */}
      <div className="w-full max-w-2xl flex items-center justify-between px-2 py-2 shrink-0">
        <button
          onClick={handleLeaveCall}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition cursor-pointer group"
          title="Back / Leave Conference"
        >
          <IoChevronBack size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          <div className="text-left">
            <h3 className="font-semibold text-base sm:text-lg leading-tight">
              {roomTitle && !roomTitle.startsWith("Group Call") ? roomTitle : "Conference"}
            </h3>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <IoShieldCheckmark size={11} className="text-[#2ecc71]" />
              <span>{totalParticipants} active</span>
              <span>•</span>
              <span className="font-mono text-[#2ecc71]">{formatTimer(callTimer)}</span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle between Conference List and Video Grid */}
          <button
            onClick={() => setViewMode((v) => (v === "conference" ? "grid" : "conference"))}
            className="flex items-center gap-1.5 text-[11px] bg-[#162840] hover:bg-[#1f3656] text-gray-200 px-3 py-1.5 rounded-full border border-white/10 transition active:scale-95 cursor-pointer"
            title={viewMode === "conference" ? "Switch to Video Grid" : "Switch to Conference List"}
          >
            {viewMode === "conference" ? <IoGridOutline size={14} /> : <IoListOutline size={14} />}
            <span className="hidden sm:inline">
              {viewMode === "conference" ? "Video Grid" : "Conference List"}
            </span>
          </button>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1 text-[11px] bg-[#162840] hover:bg-[#1f3656] text-gray-200 px-3 py-1.5 rounded-full border border-white/10 transition active:scale-95 cursor-pointer"
            title="Copy Invite Link"
          >
            {copiedLink ? <IoCheckmark size={14} className="text-[#2ecc71]" /> : <IoCopy size={13} />}
            <span className="hidden sm:inline">{copiedLink ? "Copied" : "Link"}</span>
          </button>
        </div>
      </div>

      {/* Main Content: Screen 3 Conference Pill List OR Video Grid */}
      {viewMode === "conference" ? (
        <div className="flex-1 w-full max-w-md flex flex-col items-center pt-6 pb-4 overflow-y-auto px-1">
          {/* Offscreen (not display:none) audio elements so voice ALWAYS plays in Conference list mode */}
          <video ref={localVideoRef} autoPlay muted playsInline className="w-0 h-0 opacity-0 pointer-events-none" />
          <div className="fixed w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
            {peerList.map(([socketId, peer]) => (
              <RemotePeerTile key={`audio-${socketId}`} peer={peer} />
            ))}
          </div>

          <div className="w-full space-y-3">
            {/* Local User Row ("You") */}
            <div className="w-full bg-[#162840]/95 border border-white/10 rounded-full p-2 pr-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={getAvatarUrl(authUser)}
                  alt="You"
                  className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                  onError={(e) => handleImageError(e, authUser?.fullName)}
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-white truncate block">
                    You {isMuted ? "(Muted)" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono font-semibold text-[#2ecc71]">
                  {formatTimer(callTimer)}
                </span>
                <button
                  onClick={handleLeaveCall}
                  className="w-8 h-8 rounded-full bg-[#e06363] hover:bg-[#d95353] text-white flex items-center justify-center shadow-md transition active:scale-90 cursor-pointer"
                  title="Leave Call"
                >
                  <MdCallEnd size={15} />
                </button>
              </div>
            </div>

            {/* Connected Remote Peers Rows */}
            {peerList.map(([socketId, peer]) => (
              <div
                key={socketId}
                className="w-full bg-[#162840]/95 border border-white/10 rounded-full p-2 pr-3 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(peer.user)}
                    alt={peer.user?.fullName || "Peer"}
                    className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                    onError={(e) => handleImageError(e, peer.user?.fullName)}
                  />
                  <span className="text-sm font-medium text-white truncate">
                    {peer.user?.fullName || "Participant"}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-semibold text-[#2ecc71]">
                    {formatTimer(callTimer)}
                  </span>
                  <button
                    onClick={handleLeaveCall}
                    className="w-8 h-8 rounded-full bg-[#e06363] hover:bg-[#d95353] text-white flex items-center justify-center shadow-md transition active:scale-90 cursor-pointer"
                    title="End Call"
                  >
                    <MdCallEnd size={15} />
                  </button>
                </div>
              </div>
            ))}

            {/* Pending Invited Friends ("Ringing" in Coral Red) */}
            {pendingInvites.map((friend) => (
              <div
                key={friend._id}
                className="w-full bg-[#162840]/70 border border-white/5 rounded-full p-2 pr-3 flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(friend)}
                    alt={friend.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-white/15 opacity-80 shrink-0"
                    onError={(e) => handleImageError(e, friend.fullName)}
                  />
                  <span className="text-sm font-medium text-gray-300 truncate">
                    {friend.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-[#e06363] animate-pulse">
                    Ringing
                  </span>
                  <button
                    onClick={() =>
                      setInvitedFriends((prev) =>
                        prev.filter((f) => String(f._id) !== String(friend._id))
                      )
                    }
                    className="w-8 h-8 rounded-full bg-[#e06363] hover:bg-[#d95353] text-white flex items-center justify-center shadow-md transition active:scale-90 cursor-pointer"
                    title="Cancel Invite"
                  >
                    <MdCallEnd size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Centered Outlined Add Participant Button matching Screen 3 */}
          <button
            onClick={() => setShowInviteDrawer(true)}
            className="mt-8 w-12 h-12 rounded-full border border-white/40 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center shadow-lg transition hover:scale-105 active:scale-95 cursor-pointer"
            title="Add Participant to Conference"
          >
            <IoPersonAddOutline size={21} />
          </button>
        </div>
      ) : (
        /* Multi-User Video Grid View */
        <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full grid gap-3 sm:gap-4 auto-rows-fr h-full max-h-[68vh] ${getGridClasses()}`}>
            {/* Local User Tile (You) */}
            <div className="relative w-full h-full min-h-[160px] bg-[#162840] rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center shadow-xl group">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover scale-x-[-1] ${
                  isVideoOff ? "hidden" : "block"
                }`}
              />

              {isVideoOff && (
                <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <img
                    src={getAvatarUrl(authUser)}
                    alt="You"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#2ecc71] shadow-xl"
                    onError={(e) => handleImageError(e, authUser?.fullName)}
                  />
                  <span className="text-xs font-semibold text-gray-200">
                    {authUser?.fullName || "You"} (Camera Off)
                  </span>
                </div>
              )}

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

            {peerList.map(([socketId, peer]) => (
              <RemotePeerTile key={socketId} peer={peer} />
            ))}

            {peerList.length === 0 && (
              <div className="hidden sm:flex flex-col items-center justify-center bg-[#162840]/60 rounded-2xl border border-dashed border-white/20 p-6 text-center text-gray-400">
                <button
                  onClick={() => setShowInviteDrawer(true)}
                  className="w-12 h-12 rounded-full border border-white/30 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center mb-2 transition cursor-pointer"
                >
                  <IoPersonAddOutline size={22} />
                </button>
                <h4 className="text-sm font-semibold text-gray-200">
                  Waiting for friends to join...
                </h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Tap above to invite friends into this conference room!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Controls + Wide Coral-Red "End Group Call" Button matching Screen 3 */}
      <div className="w-full max-w-md flex flex-col items-center gap-3 shrink-0 pb-2">
        {/* Compact Media Toggles */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleToggleMute}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-md ${
              isMuted
                ? "bg-white text-[#0e1c2f]"
                : "bg-[#162840] hover:bg-[#1f3656] text-white border border-white/10"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <IoMicOff /> : <IoMic />}
          </button>

          <button
            onClick={() => {
              handleToggleVideo();
              if (isVideoOff) setViewMode("grid");
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-md ${
              !isVideoOff
                ? "bg-white text-[#0e1c2f]"
                : "bg-[#162840] hover:bg-[#1f3656] text-white border border-white/10"
            }`}
            title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
          >
            {isVideoOff ? <IoVideocamOff /> : <IoVideocam />}
          </button>

          {!isVideoOff && (
            <button
              onClick={handleSwitchCamera}
              className="w-11 h-11 rounded-full bg-[#162840] hover:bg-[#1f3656] text-white border border-white/10 flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-md"
              title="Switch Camera"
            >
              <IoCameraReverseOutline />
            </button>
          )}
        </div>

        {/* Wide Coral-Red "End Group Call" Pill Button matching Screen 3 */}
        <button
          onClick={handleLeaveCall}
          className="w-full py-3.5 rounded-full bg-[#e06363] hover:bg-[#d95353] active:scale-98 text-white font-semibold text-sm shadow-[0_8px_25px_rgba(224,99,99,0.4)] transition cursor-pointer"
        >
          End Group Call
        </button>
      </div>

      {/* Slide-over Invite Friends Drawer */}
      {showInviteDrawer && (
        <div className="absolute right-3 sm:right-4 top-20 bottom-24 w-72 max-w-[calc(100vw-24px)] bg-[#111b21] border border-[#2a3942] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-left">
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
                const activeStatus = getActiveUserStatus(friend, onlineUsers, userStatuses);
                const isOnline = activeStatus === "Online";
                const isAway = activeStatus === "Away";
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
                        {isOnline ? (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] border-2 border-[#111b21] rounded-full" title="Online" />
                        ) : isAway ? (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-400 border-2 border-[#111b21] rounded-full" title="Away" />
                        ) : (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 border-2 border-[#111b21] rounded-full" title="Offline" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate">
                          {friend.fullName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {isOnline ? "Online" : isAway ? "Away" : "Offline"}
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
