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
  IoExpandOutline,
  IoContractOutline,
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
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
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
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelay",
      credential: "openrelay",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Video & Audio Tile for a Remote Peer
const RemotePeerTile = ({ peer, isPinned = false, onTogglePin, className = "" }) => {
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
  }, [peer.stream, peer.streamVer]);

  const user = peer.user || {};
  const showAvatarFallback = peer.isVideoOff || !peer.stream;

  return (
    <div
      onClick={onTogglePin}
      className={`relative bg-[#152236] rounded-[22px] overflow-hidden border transition-all duration-200 flex items-center justify-center shadow-xl group select-none cursor-pointer ${
        isPinned
          ? "border-[#2ecc71]/70 ring-2 ring-[#2ecc71]/30"
          : "border-white/12 hover:border-[#2ecc71]/50"
      } ${className}`}
    >
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
        className={`w-full h-full object-cover object-[50%_22%] ${
          showAvatarFallback ? "hidden" : "block"
        }`}
      />

      {/* Fallback Avatar when camera is off OR stream is connecting */}
      {showAvatarFallback && (
        <div className="flex flex-col items-center justify-center gap-2 p-4 relative">
          <div className="relative">
            <img
              src={getAvatarUrl(user)}
              alt={user.fullName || "Peer"}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#2ecc71]/70 shadow-xl"
              onError={(e) => handleImageError(e, user.fullName)}
            />
            {!peer.isMuted && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2ecc71] text-[#0b141a] rounded-full flex items-center justify-center text-xs shadow-md">
                <IoVolumeHigh size={12} />
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-200">
            {user.fullName || user.username || "Participant"}
          </span>
          {!peer.stream && !peer.isVideoOff && (
            <span className="text-[10px] text-[#38bdf8] animate-pulse font-medium">
              Connecting video...
            </span>
          )}
        </div>
      )}

      {/* Top-Right Pin / Fullscreen Toggle */}
      {onTogglePin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white/85 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-75 transition z-10 border border-white/10 cursor-pointer"
          title={isPinned ? "Exit Spotlight" : "Spotlight"}
        >
          {isPinned ? <IoContractOutline size={15} /> : <IoExpandOutline size={15} />}
        </button>
      )}

      {/* Peer Name Tag with Avatar + Mic Status */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/55 backdrop-blur-md pl-1.5 pr-2.5 py-1 rounded-full text-white text-[11px] font-medium flex items-center gap-1.5 max-w-[82%] border border-white/15 shadow-sm">
          <img
            src={getAvatarUrl(user)}
            alt=""
            className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/30"
            onError={(e) => handleImageError(e, user.fullName)}
          />
          <span className="truncate">{user.fullName || user.username || "Friend"}</span>
          {!peer.isMuted && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] shrink-0" />
          )}
        </div>
        {peer.isMuted && (
          <div className="bg-[#e06363]/90 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
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
    openDrawerOnStart,
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
  const [peers, setPeers] = useState({}); // { [socketId]: { user, stream, streamVer, isMuted, isVideoOff } }
  const [showInviteDrawer, setShowInviteDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState(callType === "audio" ? "conference" : "grid");
  const [invitedFriends, setInvitedFriends] = useState([]);
  const [pinnedId, setPinnedId] = useState(null); // "local" | socketId | null

  const authUserRef = useRef(authUser);
  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  useEffect(() => {
    if (isGroupCallOpen) {
      setIsVideoOff(callType === "audio");
      setIsMuted(false);
      setCallTimer(0);
      setViewMode(callType === "audio" ? "conference" : "grid");
      setInvitedFriends(Array.isArray(invitedMembers) ? invitedMembers : []);
      setShowInviteDrawer(Boolean(openDrawerOnStart));
      setPinnedId(null);
    }
  }, [isGroupCallOpen, callType, invitedMembers, openDrawerOnStart]);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { [socketId]: RTCPeerConnection }
  const peerStreamsRef = useRef({}); // { [socketId]: MediaStream }
  const iceQueuesRef = useRef({}); // { [socketId]: RTCIceCandidateInit[] }
  const timerIntervalRef = useRef(null);

  // Dynamically adapt outgoing video bitrate based on active participant count so 3-12+ people stay smooth
  const applyMultiPartyBitrate = useCallback((peerCount) => {
    const maxBitrate =
      peerCount <= 2
        ? 550000
        : peerCount <= 4
        ? 350000
        : peerCount <= 6
        ? 220000
        : 140000;
    const scaleDown = peerCount >= 6 ? 1.5 : 1.0;

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video") {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = maxBitrate;
            params.encodings[0].scaleResolutionDownBy = scaleDown;
            sender.setParameters(params).catch(() => {});
          }
        });
      } catch (e) {}
    });
  }, []);

  useEffect(() => {
    applyMultiPartyBitrate(Object.keys(peers).length);
  }, [peers, applyMultiPartyBitrate]);

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
    peerStreamsRef.current = {};
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

      // Auto-recover ICE on transient multi-peer connection drops
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "failed" && typeof pc.restartIce === "function") {
          try {
            pc.restartIce();
          } catch (e) {}
        }
      };

      // Accumulate incoming audio & video tracks reliably on a per-peer stream
      pc.ontrack = (event) => {
        let stream = peerStreamsRef.current[targetSocketId];
        if (!stream) {
          stream = event.streams?.[0] || new MediaStream();
          peerStreamsRef.current[targetSocketId] = stream;
        }
        if (event.track && !stream.getTracks().some((t) => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }
        setPeers((prev) => ({
          ...prev,
          [targetSocketId]: {
            user: targetUser || prev[targetSocketId]?.user,
            stream,
            streamVer: (prev[targetSocketId]?.streamVer || 0) + 1,
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
                fromUser: authUserRef.current,
                isOffer: true,
              });
            }
          })
          .catch((err) => console.error("Error creating group call offer:", err));
      }

      return pc;
    },
    [socket]
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
          video:
            callType === "video"
              ? {
                  facingMode: "user",
                  width: { ideal: 640, max: 640 },
                  height: { ideal: 480, max: 480 },
                  frameRate: { ideal: 24, max: 24 },
                }
              : false,
        });
      } catch (primaryErr) {
        if (callType === "video") {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true,
            });
          } catch (relaxedErr) {
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
          user: authUserRef.current,
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
  }, [isGroupCallOpen, activeRoomId, callType, socket, cleanupGroupCall]);

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

    // 3. WebRTC Signal (Offer or Answer) received from a peer with glare protection
    const handleSignal = async ({ fromSocketId, signal, fromUser, isOffer }) => {
      try {
        let pc = peerConnectionsRef.current[fromSocketId];
        if (!pc) {
          pc = createPeerConnection(fromSocketId, fromUser, false);
        }

        const offerCollision = isOffer && pc.signalingState !== "stable";
        const isPolite = String(socket.id) < String(fromSocketId);
        if (offerCollision && !isPolite) {
          return;
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
            fromUser: authUserRef.current,
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
      delete peerStreamsRef.current[socketId];
      delete iceQueuesRef.current[socketId];
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
  }, [socket, isGroupCallOpen, createPeerConnection]);

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
    if (!socket || !activeRoomId || !friend?._id) return;
    socket.emit("inviteToGroupCall", {
      toUserId: friend._id,
      groupId: activeGroupId || null,
      roomId: activeRoomId,
      fromUser: authUserRef.current,
      callType: isVideoOff ? "audio" : "video",
      roomTitle: roomTitle || "Group Video Call",
    });
    setInvitedFriends((prev) =>
      prev.some((f) => String(f._id) === String(friend._id)) ? prev : [...prev, friend]
    );
    toast.success(`Invite sent to ${friend.fullName}! 🚀`, {
      id: `invite-${friend._id}`,
    });
  };

  // Invite all available friends at once to join maximum people in video call
  const handleInviteAllFriends = () => {
    if (!socket || !activeRoomId || !otherUsers?.length) return;
    const targetIds = otherUsers
      .filter((f) => !peerList.some(([, p]) => String(p.user?._id) === String(f._id)))
      .map((f) => f._id);
    if (targetIds.length === 0) {
      toast("Everyone is already in the call!", { icon: "👥" });
      return;
    }
    socket.emit("inviteToGroupCall", {
      toUserIds: targetIds,
      groupId: activeGroupId || null,
      roomId: activeRoomId,
      fromUser: authUserRef.current,
      callType: isVideoOff ? "audio" : "video",
      roomTitle: roomTitle || "Group Video Call",
    });
    setInvitedFriends((prev) => {
      const existingIds = new Set(prev.map((p) => String(p._id)));
      return [...prev, ...otherUsers.filter((f) => !existingIds.has(String(f._id)))];
    });
    toast.success(`Ringing ${targetIds.length} friends to join Video Call! 👥🔥`);
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

  // Balanced centered tile sizing so 1, 2, 3, 4, 5, 6..12+ tiles have ZERO orphan gaps or face-cropping strips
  const getFlexTileClasses = () => {
    if (totalParticipants === 1) {
      return "w-full max-w-2xl h-full max-h-[66dvh]";
    }
    if (totalParticipants === 2) {
      return "w-full sm:w-[calc(50%-8px)] max-w-xl h-[48%] sm:h-full max-h-[64dvh]";
    }
    if (totalParticipants === 3) {
      return "w-[calc(50%-6px)] md:w-[calc(33.333%-11px)] h-[47%] md:h-full max-h-[66dvh]";
    }
    if (totalParticipants === 4) {
      return "w-[calc(50%-6px)] max-w-xl h-[47%] sm:h-[48%]";
    }
    if (totalParticipants <= 6) {
      return "w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] h-[175px] sm:h-[47%]";
    }
    return "w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] h-[165px] sm:h-[215px]";
  };

  // Pending invited friends who haven't joined peerList yet
  const pendingInvites = invitedFriends.filter(
    (inv) => !peerList.some(([, p]) => String(p.user?._id) === String(inv._id))
  );

  const activePinnedPeer = pinnedId && pinnedId !== "local" ? peers[pinnedId] : null;
  const isSpotlightActive = pinnedId === "local" || Boolean(activePinnedPeer);

  return (
    <div className="fixed inset-0 z-[120] h-[100dvh] bg-gradient-to-b from-[#0b1628] via-[#0e1c2f] to-[#091220] flex flex-col items-center justify-between p-2.5 sm:p-5 select-none animate-fade-in text-white overflow-hidden">
      {/* Top Header Bar aligned with video workspace */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-2 px-1 sm:px-2 py-1 shrink-0">
        <button
          onClick={handleLeaveCall}
          className="flex items-center gap-1.5 sm:gap-2 text-white hover:text-gray-300 transition cursor-pointer group min-w-0"
          title="Back / Leave Conference"
        >
          <IoChevronBack size={20} className="group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <div className="text-left min-w-0">
            <h3 className="font-semibold text-sm sm:text-lg leading-tight truncate">
              {roomTitle && !roomTitle.startsWith("Group Call") ? roomTitle : "Conference"}
            </h3>
            <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
              <IoShieldCheckmark size={11} className="text-[#2ecc71] shrink-0" />
              <span>{totalParticipants} live</span>
              <span>•</span>
              <span className="font-mono text-[#2ecc71]">{formatTimer(callTimer)}</span>
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Always-visible Add Person button to invite 3rd, 4th, 5th+ participants */}
          <button
            onClick={() => setShowInviteDrawer((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-bold bg-[#2ecc71] hover:bg-[#27ae60] text-[#0b141a] px-2.5 sm:px-3 py-1.5 rounded-full transition active:scale-95 cursor-pointer shadow-md"
            title="Add more people to Video Call"
          >
            <IoPersonAddOutline size={14} />
            <span>Add</span>
          </button>

          {/* Toggle between Conference List and Video Grid */}
          <button
            onClick={() => setViewMode((v) => (v === "conference" ? "grid" : "conference"))}
            className="flex items-center gap-1.5 text-[11px] bg-[#162840] hover:bg-[#1f3656] text-gray-200 px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 transition active:scale-95 cursor-pointer"
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
            className="flex items-center gap-1 text-[11px] bg-[#162840] hover:bg-[#1f3656] text-gray-200 px-2.5 sm:px-3 py-1.5 rounded-full border border-white/10 transition active:scale-95 cursor-pointer"
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
        /* Multi-User Video Grid View (balanced studio bento + tap-to-spotlight) */
        <div className="flex-1 min-h-0 w-full max-w-6xl flex flex-col items-center justify-center p-1.5 sm:p-3 overflow-y-auto no-scrollbar">
          {isSpotlightActive ? (
            <div className="w-full h-full flex flex-col gap-2.5 min-h-0">
              {/* Spotlight Main Tile */}
              <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                {pinnedId === "local" ? (
                  <div
                    onClick={() => setPinnedId(null)}
                    className="relative w-full h-full max-w-4xl bg-[#152236] rounded-[24px] overflow-hidden border-2 border-[#2ecc71]/70 flex items-center justify-center shadow-2xl group cursor-pointer"
                  >
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover object-[50%_22%] scale-x-[-1] ${
                        isVideoOff ? "hidden" : "block"
                      }`}
                    />
                    {isVideoOff && (
                      <div className="flex flex-col items-center justify-center gap-2 p-4">
                        <img
                          src={getAvatarUrl(authUser)}
                          alt="You"
                          className="w-24 h-24 rounded-full object-cover border-2 border-[#2ecc71] shadow-xl"
                          onError={(e) => handleImageError(e, authUser?.fullName)}
                        />
                        <span className="text-sm font-semibold text-gray-200">
                          {authUser?.fullName || "You"} (Camera Off)
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedId(null);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center border border-white/15 cursor-pointer"
                      title="Back to Grid"
                    >
                      <IoContractOutline size={16} />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/55 backdrop-blur-md pl-1.5 pr-3 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1.5 border border-white/15">
                      <img
                        src={getAvatarUrl(authUser)}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => handleImageError(e, authUser?.fullName)}
                      />
                      <span>{authUser?.fullName || "You"} (You)</span>
                    </div>
                  </div>
                ) : (
                  <RemotePeerTile
                    peer={activePinnedPeer}
                    isPinned
                    onTogglePin={() => setPinnedId(null)}
                    className="w-full h-full max-w-4xl"
                  />
                )}
              </div>

              {/* Thumbnail Strip for other callers */}
              <div className="h-24 sm:h-28 w-full flex items-center justify-center gap-2.5 overflow-x-auto no-scrollbar shrink-0 px-1">
                {pinnedId !== "local" && (
                  <div
                    onClick={() => setPinnedId("local")}
                    className="relative h-full aspect-video rounded-xl overflow-hidden bg-[#152236] border border-white/15 shrink-0 cursor-pointer hover:border-[#2ecc71]/60 flex items-center justify-center"
                  >
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
                      <img
                        src={getAvatarUrl(authUser)}
                        alt="You"
                        className="w-10 h-10 rounded-full object-cover border border-[#2ecc71]"
                        onError={(e) => handleImageError(e, authUser?.fullName)}
                      />
                    )}
                    <span className="absolute bottom-1 left-1.5 bg-black/60 text-[10px] px-1.5 py-0.5 rounded-full truncate max-w-[90%]">
                      You
                    </span>
                  </div>
                )}

                {peerList
                  .filter(([sid]) => sid !== pinnedId)
                  .map(([sid, peer]) => (
                    <RemotePeerTile
                      key={`strip-${sid}`}
                      peer={peer}
                      onTogglePin={() => setPinnedId(sid)}
                      className="h-full aspect-video shrink-0 rounded-xl min-h-0 sm:min-h-0"
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-wrap items-center justify-center content-center gap-2.5 sm:gap-3.5">
              {/* Local User Tile (You) */}
              <div
                onClick={() => peerList.length > 0 && setPinnedId("local")}
                className={`relative bg-[#152236] rounded-[22px] overflow-hidden border border-white/15 hover:border-[#2ecc71]/50 flex items-center justify-center shadow-xl group cursor-pointer transition-all duration-200 ${getFlexTileClasses()}`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover object-[50%_22%] scale-x-[-1] ${
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

                {peerList.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinnedId("local");
                    }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 backdrop-blur-md text-white/85 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-75 transition z-10 border border-white/10 cursor-pointer"
                    title="Spotlight"
                  >
                    <IoExpandOutline size={15} />
                  </button>
                )}

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                  <div className="bg-black/55 backdrop-blur-md pl-1.5 pr-2.5 py-1 rounded-full text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/15 shadow-sm max-w-[82%]">
                    <img
                      src={getAvatarUrl(authUser)}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/30"
                      onError={(e) => handleImageError(e, authUser?.fullName)}
                    />
                    <span className="truncate">{authUser?.fullName || "You"} (You)</span>
                    {!isMuted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] shrink-0" />
                    )}
                  </div>
                  {isMuted && (
                    <div className="bg-[#e06363]/90 backdrop-blur-md p-1.5 rounded-full text-white shadow-md">
                      <IoMicOff size={12} />
                    </div>
                  )}
                </div>
              </div>

              {peerList.map(([socketId, peer]) => (
                <RemotePeerTile
                  key={socketId}
                  peer={peer}
                  onTogglePin={() => setPinnedId(socketId)}
                  className={getFlexTileClasses()}
                />
              ))}

              {peerList.length === 0 && (
                <div
                  className={`flex flex-col items-center justify-center bg-[#162840]/60 rounded-[22px] border border-dashed border-white/20 p-4 sm:p-6 text-center text-gray-400 ${getFlexTileClasses()}`}
                >
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
                    Tap &quot;+ Add&quot; above to ring more friends or invite everyone!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls + Wide Coral-Red "End Group Call" Button matching Screen 3 */}
      <div className="w-full max-w-md flex flex-col items-center gap-2.5 shrink-0 pb-1">
        {/* Glassmorphic Media Controls Pill */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 bg-[#162840]/85 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-xl">
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

          {/* Bottom Quick Invite More Button */}
          <button
            onClick={() => setShowInviteDrawer((prev) => !prev)}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition active:scale-95 cursor-pointer shadow-md ${
              showInviteDrawer
                ? "bg-[#2ecc71] text-[#0b141a]"
                : "bg-[#162840] hover:bg-[#1f3656] text-white border border-white/10"
            }`}
            title="Add More Participants"
          >
            <IoPersonAddOutline />
          </button>
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
              <span>Add to Video Call ({totalParticipants} live)</span>
            </h4>
            <button
              onClick={() => setShowInviteDrawer(false)}
              className="text-[#8696a0] hover:text-white cursor-pointer"
            >
              <IoClose size={18} />
            </button>
          </div>

          {otherUsers && otherUsers.length > 0 && (
            <div className="px-3 pt-2.5 pb-1 shrink-0">
              <button
                type="button"
                onClick={handleInviteAllFriends}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#2ecc71] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
              >
                <IoPersonAdd size={14} />
                <span>Invite All Friends ({otherUsers.length})</span>
              </button>
            </div>
          )}

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
