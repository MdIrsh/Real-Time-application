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
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSelector((store) => store.socket);
  const { authUser } = useSelector((store) => store.user);

  const [callActive, setCallActive] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [callUser, setCallUser] = useState(null);
  const [callType, setCallType] = useState("audio"); // "audio" | "video"
  const [callStatus, setCallStatus] = useState("Ringing..."); // "Calling...", "Connected", "Ended"
  const [callSeconds, setCallSeconds] = useState(0);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localStreamRef = useRef(null);
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
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
    setCallActive(false);
    setIsIncoming(false);
    setCallUser(null);
    setCallStatus("Ended");
    setCallSeconds(0);
    setIsMuted(false);
    setIsVideoOff(false);
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

  // Acquire camera and mic stream with high-quality audio
  const getUserMediaStream = async (type) => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video:
          type === "video"
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
            : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.log("Could not get requested media, falling back to audio:", err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        audioOnlyStream.getAudioTracks().forEach((t) => {
          t.enabled = true;
        });
        localStreamRef.current = audioOnlyStream;
        return audioOnlyStream;
      } catch (audioErr) {
        console.error("Audio permission denied:", audioErr);
        toast.error("Microphone permission needed to speak!");
        return null;
      }
    }
  };

  // Unlock audio policy on mobile browsers (Android/iOS)
  const unlockMobileAudio = () => {
    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("Mobile audio unlock:", e);
    }
  };

  // Attach remote stream to audio & video elements
  const attachRemoteStream = (stream) => {
    stopCallSounds();
    playCallConnectedTone();
    setCallStatus("Connected");

    if (remoteAudioRef.current) {
      if (remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
      }
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.muted = false;
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn("Audio play auto-policy warning:", e));
      }
    }

    if (remoteVideoRef.current) {
      if (remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      const videoPlay = remoteVideoRef.current.play();
      if (videoPlay !== undefined) {
        videoPlay.catch((e) => console.warn("Video play error:", e));
      }
    }
  };

  // Start outgoing call
  const startCall = async ({ user, type = "audio" }) => {
    if (!user?._id) return;
    if (user._id === "meta-ai") {
      toast("Meta AI is a text assistant!", { icon: "🤖" });
      return;
    }

    unlockMobileAudio();
    setCallUser(user);
    setCallType(type);
    setIsVideoOff(type === "audio");
    setCallStatus("Calling...");
    setCallActive(true);
    setIsIncoming(false);
    setCallSeconds(0);
    candidateQueueRef.current = [];

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

        // Provide real voice feedback so the user hears voice through speakers!
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

    // Handle remote tracks
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      attachRemoteStream(incomingStream);
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
    unlockMobileAudio();
    const targetUser = callUserRef.current;
    const signal = incomingSignalRef.current;
    if (!targetUser || !signal) {
      cleanupCall();
      return;
    }

    setIsIncoming(false);
    setCallStatus("Connecting...");

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
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      attachRemoteStream(incomingStream);
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
      // Flush any ICE candidates that arrived before remoteDescription was set
      await flushCandidateQueue(pc);

      const answer = await pc.createAnswer();
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
      if (peerConnectionRef.current && signal) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
          // Flush any queued ICE candidates
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
        // Queue until remoteDescription is set!
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
        localVideoRef,
        remoteVideoRef,
        startCall,
        acceptIncomingCall,
        declineIncomingCall,
        endCall,
        toggleMute,
        toggleVideo,
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
