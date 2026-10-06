import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useSelector } from "react-redux";
import {
  startOutgoingRingtone,
  startIncomingRingtone,
  stopCallSounds,
  playCallConnectedTone,
  resumeAudioContext,
} from "../utils/callSounds";
import toast from "react-hot-toast";

const CallContext = createContext(null);

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

export const CallProvider = ({ children }) => {
  const { socket } = useSelector((store) => store.socket);
  const { authUser, otherUsers } = useSelector((store) => store.user);

  const [callActive, setCallActive] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [callUser, setCallUser] = useState(null);
  const [callType, setCallType] = useState("audio"); // "audio" | "video"
  const [callStatus, setCallStatus] = useState("Ringing..."); // "Calling...", "Connecting...", "Connected", "Ended"
  const [callSeconds, setCallSeconds] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // "user" (front) or "environment" (back)
  const facingModeRef = useRef("user");
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [callVolume, setCallVolume] = useState(1.0); // 0.0 (mute) to 2.0 (boosted)
  const callVolumeRef = useRef(1.0);

  const audioSourceNodeRef = useRef(null);
  const audioGainNodeRef = useRef(null);

  const changeCallVolume = useCallback((newVol) => {
    const val = Math.max(0, Math.min(2.0, parseFloat(newVol)));
    setCallVolume(val);
    callVolumeRef.current = val;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = Math.min(1.0, val);
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = Math.min(1.0, val);
    }
    if (audioGainNodeRef.current && typeof window !== "undefined") {
      try {
        audioGainNodeRef.current.gain.value = val;
      } catch (e) {}
    }
  }, []);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const incomingSignalRef = useRef(null);
  const callUserRef = useRef(null);
  const candidateQueueRef = useRef([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    callUserRef.current = callUser;
  }, [callUser]);

  // Clean up peer connection and media tracks
  const cleanupCall = useCallback(() => {
    stopCallSounds();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (audioSourceNodeRef.current) {
      try {
        audioSourceNodeRef.current.disconnect();
      } catch (e) {}
      audioSourceNodeRef.current = null;
    }
    if (audioGainNodeRef.current) {
      try {
        audioGainNodeRef.current.disconnect();
      } catch (e) {}
      audioGainNodeRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    incomingSignalRef.current = null;
    candidateQueueRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setAudioBlocked(false);
    setCallActive(false);
    setIsIncoming(false);
    setCallUser(null);
    setCallStatus("Ended");
    setCallSeconds(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setMicPermissionDenied(false);
    setCallVolume(1.0);
    callVolumeRef.current = 1.0;
    facingModeRef.current = "user";
    setFacingMode("user");
  }, []);

  // End Call function
  const endCall = useCallback(() => {
    const targetUser = callUserRef.current;
    if (socket && targetUser?._id) {
      socket.emit("endCall", { to: targetUser._id });
    }
    cleanupCall();
  }, [socket, cleanupCall]);

  // Decline Incoming Call
  const declineIncomingCall = useCallback(() => {
    const targetUser = callUserRef.current;
    if (socket && targetUser?._id) {
      socket.emit("rejectCall", { to: targetUser._id });
    }
    cleanupCall();
  }, [socket, cleanupCall]);

  // Flush queued ICE candidates after setRemoteDescription completes
  const flushCandidateQueue = async (pc) => {
    while (candidateQueueRef.current.length > 0) {
      const cand = candidateQueueRef.current.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.error("Error adding queued candidate:", err);
      }
    }
  };

  // Acquire camera and mic stream with high-quality audio & robust fallbacks
  const getUserMediaStream = async (type) => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error(
        "Microphone requires HTTPS or localhost! Browser blocks microphone on HTTP network IP."
      );
      return null;
    }

    let stream = null;
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: true,
        },
        video:
          type === "video"
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            : false,
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn("Optimal constraints failed, falling back to basic media constraints:", err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });
      } catch (basicErr) {
        console.warn("Basic constraints failed, falling back to audio only:", basicErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } catch (audioErr) {
          console.error("Microphone permission denied:", audioErr);
          setMicPermissionDenied(true);
          toast.error("Microphone blocked! Kripya browser me mic allow karein.");
          return null;
        }
      }
    }

    if (stream) {
      setMicPermissionDenied(false);
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }
    return stream;
  };

  // Unlock audio policy on user click
  const unlockAudioContext = () => {
    try {
      resumeAudioContext();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("Audio unlock warning:", e);
    }
  };

  // Attach remote stream to audio & video elements
  const attachRemoteStream = useCallback((stream) => {
    stopCallSounds();
    playCallConnectedTone();
    setCallStatus("Connected");
    setRemoteStream(stream);

    // Audio element: ALWAYS plays incoming audio cleanly (both voice call and video call)
    if (remoteAudioRef.current) {
      if (remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
      }
      remoteAudioRef.current.volume = callVolumeRef.current;
      remoteAudioRef.current.muted = false; // Always unmuted so voice is always heard!
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioBlocked(false);
          })
          .catch((e) => {
            console.warn("Audio element autoplay restricted:", e);
            setAudioBlocked(true);

            // Resilient fallback: Route through Web Audio API to play directly through speakers
            try {
              const ctx = resumeAudioContext();
              if (ctx && stream && stream.getAudioTracks().length > 0) {
                if (audioSourceNodeRef.current) {
                  try { audioSourceNodeRef.current.disconnect(); } catch (err) {}
                }
                if (audioGainNodeRef.current) {
                  try { audioGainNodeRef.current.disconnect(); } catch (err) {}
                }
                const source = ctx.createMediaStreamSource(stream);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(callVolumeRef.current, ctx.currentTime);
                source.connect(gain);
                gain.connect(ctx.destination);
                audioSourceNodeRef.current = source;
                audioGainNodeRef.current = gain;
              }
            } catch (bridgeErr) {
              console.warn("Web Audio bridge fallback warning:", bridgeErr);
            }
          });
      }
    }

    // Video element: displays video for video calls (muted so mobile browsers never block autoplay)
    if (remoteVideoRef.current && callType === "video") {
      if (remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.muted = true; // Muted video so browser allows instant video stream
      const videoPlay = remoteVideoRef.current.play();
      if (videoPlay !== undefined) {
        videoPlay.catch((e) => {
          console.warn("Video element autoplay restricted:", e);
        });
      }
    }
  }, [callType]);

  // Manually enable audio if autoplay was blocked by browser
  const enableAudio = useCallback(() => {
    resumeAudioContext();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current && callType === "video") {
      remoteVideoRef.current.muted = true;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
      try {
        const ctx = resumeAudioContext();
        if (ctx && !audioSourceNodeRef.current) {
          const source = ctx.createMediaStreamSource(remoteStreamRef.current);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(callVolumeRef.current, ctx.currentTime);
          source.connect(gain);
          gain.connect(ctx.destination);
          audioSourceNodeRef.current = source;
          audioGainNodeRef.current = gain;
        }
      } catch (e) {}
    }
    setAudioBlocked(false);
  }, [callType]);

  // Sync video elements whenever refs or streams become available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current && callType === "video") {
        if (remoteVideoRef.current.srcObject !== remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.play().catch((e) => {
          console.warn("Autoplay blocked on remote video:", e);
        });
      }
      if (remoteAudioRef.current) {
        if (remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
        remoteAudioRef.current.volume = callVolumeRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().then(() => {
          setAudioBlocked(false);
        }).catch((e) => {
          console.warn("Autoplay blocked on remote audio:", e);
          setAudioBlocked(true);
        });
      }
    }
  }, [remoteStream, callType]);

  // Start outgoing call
  const startCall = async ({ user, type = "audio" }) => {
    if (!user?._id) return;
    if (user._id === "meta-ai") {
      toast("Meta AI is a text assistant!", { icon: "🤖" });
      return;
    }

    const isFriend = otherUsers?.some((u) => u._id === user._id);
    if (!isFriend) {
      toast.error("🔒 Calling is locked. You can only call accepted friends!");
      return;
    }

    unlockAudioContext();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.play().catch(() => {});
    }

    setCallUser(user);
    setCallType(type);
    setIsVideoOff(type === "audio");
    setCallStatus("Calling...");
    setCallActive(true);
    setIsIncoming(false);
    setCallSeconds(0);
    setAudioBlocked(false);
    candidateQueueRef.current = [];
    remoteStreamRef.current = new MediaStream();

    // If demo contact, simulate connection with voice greeting test!
    const isDemo = user._id?.startsWith("demo-contact");
    if (isDemo) {
      startOutgoingRingtone();
      await getUserMediaStream(type);
      setTimeout(() => {
        stopCallSounds();
        playCallConnectedTone();
        setCallStatus("Connected");
        toast.success(`Connected with ${user.fullName}`);

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const greeting = new SpeechSynthesisUtterance(
            `Hello ${authUser?.fullName || "there"}! Got your call. Your audio calling, microphone, and speakers are working great!`
          );
          greeting.lang = "en-US";
          greeting.rate = 1.0;
          window.speechSynthesis.speak(greeting);
        }
      }, 2500);
      return;
    }

    // Real WebRTC peer connection
    startOutgoingRingtone();
    const stream = await getUserMediaStream(type);
    if (!stream) {
      cleanupCall();
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks: use native event stream and listen for unmuting
    pc.ontrack = (event) => {
      console.log("Caller WebRTC track received:", event.track.kind);
      const incomingStream =
        event.streams && event.streams[0]
          ? event.streams[0]
          : new MediaStream([event.track]);

      remoteStreamRef.current = incomingStream;
      setRemoteStream(incomingStream);
      attachRemoteStream(incomingStream);

      event.track.onunmute = () => {
        console.log("Caller remote track unmuted, ensuring audio play:", event.track.kind);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.play().catch(() => {});
        }
      };
    };

    // Monitor ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log("Caller ICE State:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallStatus("Connected");
      } else if (pc.iceConnectionState === "failed") {
        console.error("WebRTC ICE Connection Failed");
        toast.error("Call connection failed! Network firewall or NAT blocked P2P connection.");
      }
    };

    // Send ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("iceCandidate", {
          to: user._id,
          candidate: event.candidate,
        });
      }
    };

    // Create and send SDP Offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "video",
      });
      await pc.setLocalDescription(offer);

      socket.emit("callUser", {
        userToCall: user._id,
        signalData: offer,
        from: authUser,
        callType: type,
      });
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
      cleanupCall();
    }
  };

  // Accept incoming call
  const acceptIncomingCall = async () => {
    stopCallSounds();
    unlockAudioContext();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.play().catch(() => {});
    }

    const targetUser = callUserRef.current;
    const signal = incomingSignalRef.current;
    if (!targetUser || !signal) {
      cleanupCall();
      return;
    }

    setIsIncoming(false);
    setCallStatus("Connecting...");
    setAudioBlocked(false);
    remoteStreamRef.current = new MediaStream();

    const stream = await getUserMediaStream(callType);
    if (!stream) {
      declineIncomingCall();
      return;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      console.log("Receiver WebRTC track received:", event.track.kind);
      const incomingStream =
        event.streams && event.streams[0]
          ? event.streams[0]
          : new MediaStream([event.track]);

      remoteStreamRef.current = incomingStream;
      setRemoteStream(incomingStream);
      attachRemoteStream(incomingStream);

      event.track.onunmute = () => {
        console.log("Receiver remote track unmuted, ensuring audio play:", event.track.kind);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.play().catch(() => {});
        }
      };
    };

    pc.oniceconnectionstatechange = () => {
      console.log("Receiver ICE State:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallStatus("Connected");
      } else if (pc.iceConnectionState === "failed") {
        console.error("WebRTC ICE Connection Failed");
        toast.error("Call connection failed! Network firewall or NAT blocked P2P connection.");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("iceCandidate", {
          to: targetUser._id,
          candidate: event.candidate,
        });
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      await flushCandidateQueue(pc);

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", {
        to: targetUser._id,
        signal: answer,
      });

      setCallStatus("Connected");
    } catch (err) {
      console.error("Error answering call:", err);
      cleanupCall();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !t.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((t) => {
          t.enabled = !t.enabled;
        });
        setIsVideoOff((prev) => !prev);
      }
    }
  };

  // Switch Camera (Front Camera <-> Back/Rear Camera)
  const switchCamera = async () => {
    if (callType !== "video" || !localStreamRef.current) return;
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Camera access requires HTTPS!");
      return;
    }

    const nextMode = facingModeRef.current === "user" ? "environment" : "user";
    try {
      let newStream = null;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err1) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
        });
      }

      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) {
        toast.error("Could not switch camera.");
        return;
      }

      // Stop old video track
      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldTrack) {
        oldTrack.stop();
        localStreamRef.current.removeTrack(oldTrack);
      }

      // Add new track to existing local stream
      localStreamRef.current.addTrack(newTrack);

      // Seamlessly replace track on WebRTC peer connection
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          await videoSender.replaceTrack(newTrack);
        }
      }

      // Refresh local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      facingModeRef.current = nextMode;
      setFacingMode(nextMode);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      toast.success(
        nextMode === "environment"
          ? "Switched to Back Camera 📸"
          : "Switched to Front Camera 🤳"
      );
    } catch (err) {
      console.error("Camera flip error:", err);
      toast.error("Back camera not available or permission denied.");
    }
  };

  // Live call duration timer
  useEffect(() => {
    let timer = null;
    if (callActive && callStatus === "Connected") {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callActive, callStatus]);

  // Socket listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // Incoming Call received
    const handleIncomingCall = ({ signal, from, callType: incomingType }) => {
      if (callActive) {
        socket.emit("rejectCall", { to: from._id });
        return;
      }

      setCallUser(from);
      setCallType(incomingType || "audio");
      incomingSignalRef.current = signal;
      candidateQueueRef.current = [];
      setCallActive(true);
      setIsIncoming(true);
      setCallStatus("Incoming Call...");
      startIncomingRingtone();
    };

    // Caller receives accepted answer
    const handleCallAccepted = async ({ signal }) => {
      stopCallSounds();
      setCallStatus("Connected");
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(() => {});
      }
      if (peerConnectionRef.current && signal) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
          await flushCandidateQueue(peerConnectionRef.current);
        } catch (e) {
          console.error("Error setting remote description on accept:", e);
        }
      }
    };

    // ICE Candidate exchange
    const handleIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding received ICE candidate:", e);
        }
      } else {
        candidateQueueRef.current.push(candidate);
      }
    };

    // Call Ended by remote peer
    const handleCallEnded = () => {
      toast("Call ended", { icon: "📞" });
      cleanupCall();
    };

    // Call Rejected by remote peer
    const handleCallRejected = () => {
      stopCallSounds();
      setCallStatus("Call Declined");
      toast.error("Call was declined.");
      setTimeout(cleanupCall, 1200);
    };

    // Target user offline
    const handleCallUnavailable = ({ message }) => {
      stopCallSounds();
      toast.error(message || "User is unavailable.");
      cleanupCall();
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAccepted", handleCallAccepted);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", handleCallEnded);
    socket.on("callRejected", handleCallRejected);
    socket.on("callUnavailable", handleCallUnavailable);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAccepted", handleCallAccepted);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded", handleCallEnded);
      socket.off("callRejected", handleCallRejected);
      socket.off("callUnavailable", handleCallUnavailable);
    };
  }, [socket, callActive, cleanupCall]);

  return (
    <CallContext.Provider
      value={{
        callActive,
        isIncoming,
        callUser,
        callType,
        callStatus,
        callSeconds,
        isMuted,
        isVideoOff,
        audioBlocked,
        micPermissionDenied,
        enableAudio,
        localStream,
        remoteStream,
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        facingMode,
        callVolume,
        changeCallVolume,
      }}
    >
      {children}
      {/* Dedicated audio element for crystal-clear incoming voice call playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
