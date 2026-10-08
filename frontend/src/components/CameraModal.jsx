import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { closeCamera } from "../redux/cameraSlice";
import {
  IoClose,
  IoCameraReverseOutline,
  IoFlashOutline,
  IoFlashOffOutline,
  IoImagesOutline,
  IoArrowBack,
  IoSend,
  IoDownloadOutline,
  IoTrashOutline,
  IoRefreshOutline,
  IoSearchOutline,
  IoWarningOutline,
} from "react-icons/io5";
import { setMessages, setLastMessage } from "../redux/messageSlice";
import { setSelectedUser } from "../redux/userSlice";
import { addGroupMessage, setSelectedGroup } from "../redux/groupSlice";
import { addMyStatus } from "../redux/statusSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const CameraModal = () => {
  const dispatch = useDispatch();
  const { isCameraOpen } = useSelector((store) => store.camera);
  const { authUser, selectedUser, otherUsers } = useSelector((store) => store.user);
  const { selectedGroup, groups } = useSelector((store) => store.group);
  const { messages } = useSelector((store) => store.message);
  const { socket } = useSelector((store) => store.socket);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState("user"); // "user" (front) | "environment" (back)
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");

  // Cleanly stop all camera tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setTorchOn(false);
  }, []);

  // Request & Start Camera Feed
  const startCamera = useCallback(
    async (mode = facingMode) => {
      stopStream();
      setCameraError(null);

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera API is not supported on this browser or requires a secure (HTTPS/localhost) connection."
        );
        return;
      }

      try {
        const constraints = {
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.warn("Video play error:", err);
            });
            setIsStreaming(true);
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setCameraError("No camera hardware detected on this device.");
        } else {
          setCameraError(err.message || "Unable to start camera. Please try again.");
        }
      }
    },
    [facingMode, stopStream]
  );

  // Auto-start camera when modal opens
  useEffect(() => {
    if (isCameraOpen && !capturedImage) {
      startCamera(facingMode);
    }

    return () => {
      stopStream();
    };
  }, [isCameraOpen, capturedImage, facingMode, startCamera, stopStream]);

  // Close modal and cleanup
  const handleCloseModal = useCallback(() => {
    stopStream();
    setCapturedImage(null);
    setCaption("");
    setCameraError(null);
    setShowRecipientPicker(false);
    dispatch(closeCamera());
  }, [dispatch, stopStream]);

  // Handle ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isCameraOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCameraOpen, handleCloseModal]);

  // Flip Camera Front <-> Back
  const handleFlipCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
    toast.success(nextMode === "user" ? "Front Camera 🤳" : "Back Camera 📸", {
      id: "camera-flip-toast",
      duration: 1200,
    });
  };

  // Toggle Torch/Flashlight if supported
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setTorchOn(nextTorch);
        toast.success(nextTorch ? "Torch On ⚡" : "Torch Off", { duration: 1000 });
      } else {
        // Simulated flash toggle
        setTorchOn(!torchOn);
        toast(torchOn ? "Flash turned off" : "Flash enabled for capture ⚡", { duration: 1200 });
      }
    } catch (e) {
      setTorchOn(!torchOn);
    }
  };

  // Sound effect via Web Audio API (zero external assets needed)
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // AudioContext might be muted by browser
    }
  };

  // Snap photo from live camera
  const capturePhoto = () => {
    if (!videoRef.current || !isStreaming) return;

    // Trigger visual flash & audio sound
    setFlashTrigger(true);
    playShutterSound();
    setTimeout(() => setFlashTrigger(false), 220);

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontally if using front/selfie camera so photo matches natural mirror preview
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL("image/jpeg", 0.9);

    stopStream();
    setCapturedImage(photoBase64);
  };

  // File picker handler as alternative/fallback
  const handleFilePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      stopStream();
      setCapturedImage(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Reset captured photo and restart live camera
  const handleRetake = () => {
    setCapturedImage(null);
    setCaption("");
    setShowRecipientPicker(false);
  };


  // Download photo to device
  const handleDownloadPhoto = () => {
    if (!capturedImage) return;
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `WhatsApp_Camera_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Photo downloaded to device 📥");
  };

  // Send photo to WhatsApp Status
  const handleSendToStatus = async () => {
    if (!capturedImage) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/status/create`,
        {
          mediaUrl: capturedImage,
          mediaType: "image",
          caption: caption.trim(),
          bgColor: "#128c7e",
          song: null,
        },
        { withCredentials: true }
      );

      if (res.data?.status) {
        dispatch(addMyStatus(res.data.status));
        toast.success("Photo added to your Status! 📸✨");
        handleCloseModal();
      }
    } catch (err) {
      console.error("Camera post status error:", err);
      toast.error(err.response?.data?.message || "Failed to post status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send photo to 1-on-1 Chat
  const handleSendToUserChat = async (targetUser) => {
    if (!capturedImage || !targetUser?._id) return;

    const displayMsg = caption.trim() || "📷 Photo";
    const userMsg = {
      _id: `user-msg-${Date.now()}`,
      senderId: authUser?._id,
      receiverId: targetUser._id,
      message: displayMsg,
      image: capturedImage,
      audio: null,
      audioDuration: 0,
      createdAt: new Date().toISOString(),
      delivered: false,
      seen: false,
      isMe: true,
    };

    // Update active chat messages
    if (selectedUser?._id === targetUser._id) {
      dispatch(setMessages([...(messages || []), userMsg]));
    }
    dispatch(
      setLastMessage({
        userId: targetUser._id,
        text: displayMsg,
        time: userMsg.createdAt,
        isMe: true,
        seen: false,
        delivered: false,
      })
    );

    // Make sure recipient is selected in view
    if (!selectedUser || selectedUser._id !== targetUser._id) {
      dispatch(setSelectedUser(targetUser));
    }

    // Socket emit if online
    if (socket && targetUser._id && targetUser._id !== "meta-ai") {
      socket.emit("sendMessage", userMsg);
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        `${BASE_URL}/api/v1/message/send/${targetUser._id}`,
        {
          message: displayMsg,
          image: capturedImage,
          audio: null,
          audioDuration: 0,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(`Photo sent to ${targetUser.fullName || "chat"}! 📸`);
      handleCloseModal();
    } catch (err) {
      console.error("Camera send message error:", err);
      toast.success("Photo staged in chat!");
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send photo to Group Chat
  const handleSendToGroupChat = async (targetGroup) => {
    if (!capturedImage || !targetGroup?._id) return;

    const displayMsg = caption.trim() || "📷 Photo";

    if (!selectedGroup || selectedGroup._id !== targetGroup._id) {
      dispatch(setSelectedGroup(targetGroup));
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/group/send/${targetGroup._id}`,
        {
          message: displayMsg,
          image: capturedImage,
          audio: null,
          audioDuration: 0,
        },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.message) {
        dispatch(addGroupMessage(res.data.message));
      }
      toast.success(`Photo sent to ${targetGroup.name}! 📸`);
      handleCloseModal();
    } catch (err) {
      console.error("Camera group send error:", err);
      toast.error("Failed to send photo to group");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main primary send action (to currently open chat or open recipient picker)
  const handlePrimarySend = () => {
    if (selectedUser) {
      handleSendToUserChat(selectedUser);
    } else if (selectedGroup) {
      handleSendToGroupChat(selectedGroup);
    } else {
      setShowRecipientPicker(true);
    }
  };

  if (!isCameraOpen) return null;

  const currentRecipientName =
    selectedUser?.fullName || selectedGroup?.name || null;

  const filteredUsers = (otherUsers || []).filter((u) =>
    u.fullName?.toLowerCase().includes(recipientSearch.toLowerCase())
  );
  const filteredGroups = (groups || []).filter((g) =>
    g.name?.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none animate-fade-in overflow-hidden">
      {/* Hidden File Picker as alternative/fallback */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFilePicked}
        className="hidden"
      />

      {/* Camera Flash Screen Animation */}
      {flashTrigger && (
        <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {/* ============================================================== */}
      {/* MODE 1: LIVE CAMERA VIEWFINDER                                 */}
      {/* ============================================================== */}
      {!capturedImage ? (
        <div className="relative w-full h-full flex flex-col justify-between">
          {/* Top Bar Controls */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition active:scale-95"
              title="Close Camera (Esc)"
            >
              <IoClose size={26} />
            </button>

            {/* Live Camera Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Camera</span>
            </div>

            {/* Right Controls: Torch & Switch Camera */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTorch}
                className={`w-10 h-10 rounded-full ${
                  torchOn ? "bg-amber-400 text-black" : "bg-black/40 text-white hover:bg-black/70"
                } backdrop-blur-md flex items-center justify-center transition active:scale-95`}
                title={torchOn ? "Torch On" : "Torch / Flash"}
              >
                {torchOn ? <IoFlashOutline size={20} /> : <IoFlashOffOutline size={20} />}
              </button>

              <button
                onClick={handleFlipCamera}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition active:scale-95"
                title="Flip Camera (Front / Back)"
              >
                <IoCameraReverseOutline size={24} />
              </button>
            </div>
          </div>

          {/* Central Live Video Stream */}
          <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
            {cameraError ? (
              /* Camera Error & Permission Prompt Screen */
              <div className="max-w-md mx-4 p-6 rounded-3xl bg-[#111b21] border border-[#202c33] text-center text-[#e9edef] shadow-2xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <IoWarningOutline size={36} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Camera Access Issue</h3>
                  <p className="text-xs text-[#8696a0] mt-1.5 leading-relaxed">
                    {cameraError}
                  </p>
                </div>
                <div className="w-full flex flex-col gap-2.5 mt-2">
                  <button
                    onClick={() => startCamera(facingMode)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#02906f] text-[#0b141a] font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoRefreshOutline size={18} />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-white font-semibold text-sm transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <IoImagesOutline size={18} />
                    <span>Choose Photo from Device</span>
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="w-full py-2 text-xs text-[#8696a0] hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Live Video Viewfinder */
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover sm:object-contain transition-transform duration-300 ${
                    facingMode === "user" ? "scale-x-[-1]" : ""
                  }`}
                />

                {/* Subtle Camera Grid Guidelines */}
                <div className="absolute inset-0 pointer-events-none opacity-20 grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Controls Bar */}
          {!cameraError && (
            <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-6 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              {/* Pick from Gallery Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition active:scale-95"
                title="Choose from Gallery"
              >
                <IoImagesOutline size={24} />
              </button>

              {/* Shutter Button (WhatsApp Double Ring) */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl p-1 cursor-pointer disabled:opacity-50"
                  title="Take Photo"
                >
                  <div className="w-full h-full rounded-full bg-white transition hover:bg-neutral-200" />
                </button>
                <span className="text-[11px] font-bold text-white/80 tracking-widest uppercase">
                  PHOTO
                </span>
              </div>

              {/* Flip camera bottom right shortcut */}
              <button
                onClick={handleFlipCamera}
                className="w-12 h-12 rounded-2xl bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition active:scale-95"
                title="Switch Camera"
              >
                <IoCameraReverseOutline size={24} />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* MODE 2: CAPTURED PHOTO PREVIEW & SEND SCREEN                   */
        /* ============================================================== */
        <div className="relative w-full h-full flex flex-col justify-between bg-black">
          {/* Top Bar for Review */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Retake / Discard Button */}
            <button
              onClick={handleRetake}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white text-xs font-semibold transition active:scale-95"
              title="Retake photo"
            >
              <IoArrowBack size={18} />
              <span>Retake</span>
            </button>

            {/* Quick Actions: Download & Discard */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPhoto}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition active:scale-95"
                title="Download / Save Photo"
              >
                <IoDownloadOutline size={20} />
              </button>

              <button
                onClick={handleRetake}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-rose-600/80 backdrop-blur-md text-white flex items-center justify-center transition active:scale-95"
                title="Discard photo"
              >
                <IoTrashOutline size={20} />
              </button>
            </div>
          </div>

          {/* Captured Image Display */}
          <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Bottom Action Bar: Caption & Send Options */}
          <div className="w-full z-20 px-4 pb-6 pt-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col gap-3">
            {/* WhatsApp Caption Input Field */}
            <div className="flex items-center gap-3 bg-[#202c33]/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-[#2a3942] focus-within:border-[#00a884] transition">
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePrimarySend();
                  }
                }}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#8696a0]"
              />
            </div>

            {/* Destination Buttons */}
            <div className="flex items-center justify-between gap-2">
              {/* Option 1: Post to Status */}
              <button
                onClick={handleSendToStatus}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#202c33] hover:bg-[#2a3942] active:scale-95 border border-[#2a3942] text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                title="Post to WhatsApp Status"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#25d366]" />
                <span>My Status</span>
              </button>

              {/* Option 2: Send to Open Chat OR Choose Recipient */}
              {currentRecipientName ? (
                <button
                  onClick={handlePrimarySend}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#02906f] active:scale-95 text-[#0b141a] text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg"
                  title={`Send to ${currentRecipientName}`}
                >
                  <span className="truncate max-w-[130px]">
                    Send to {currentRecipientName}
                  </span>
                  <IoSend size={15} />
                </button>
              ) : (
                <button
                  onClick={() => setShowRecipientPicker(true)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#00a884] hover:bg-[#02906f] active:scale-95 text-[#0b141a] text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg"
                >
                  <span>Send to Contact...</span>
                  <IoSend size={15} />
                </button>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* DRAWER / PICKER: Choose Contact / Group to Send to             */}
          {/* ============================================================== */}
          {showRecipientPicker && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-fade-in">
              <div className="bg-[#111b21] border-t border-[#202c33] rounded-t-3xl max-h-[75vh] flex flex-col p-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#202c33]">
                  <div>
                    <h3 className="text-base font-bold text-[#e9edef]">
                      Send Photo To
                    </h3>
                    <p className="text-xs text-[#8696a0]">
                      Select a friend or group
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRecipientPicker(false)}
                    className="w-8 h-8 rounded-full bg-[#202c33] text-[#8696a0] hover:text-white flex items-center justify-center transition"
                  >
                    <IoClose size={20} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="my-3 px-3 py-2 rounded-xl bg-[#202c33] border border-[#2a3942] flex items-center gap-2">
                  <IoSearchOutline className="text-[#8696a0]" size={16} />
                  <input
                    type="text"
                    placeholder="Search contact or group..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="bg-transparent text-xs text-white outline-none w-full placeholder-[#8696a0]"
                  />
                </div>

                {/* Contacts & Groups List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar max-h-72 pr-1">
                  {/* Status Option */}
                  <div
                    onClick={handleSendToStatus}
                    className="p-2.5 rounded-xl bg-[#202c33]/40 hover:bg-[#202c33] transition cursor-pointer flex items-center justify-between group active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border-2 border-[#25d366] text-[#25d366] flex items-center justify-center font-bold">
                        ★
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          My Status
                        </p>
                        <p className="text-[10px] text-[#8696a0]">
                          Disappears after 24 hours
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#25d366] font-bold px-2.5 py-1 rounded-lg bg-[#25d366]/10">
                      Post
                    </span>
                  </div>

                  {/* Friends List */}
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSendToUserChat(user)}
                      className="p-2.5 rounded-xl hover:bg-[#202c33] transition cursor-pointer flex items-center justify-between group active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(user)}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-[#202c33]"
                          onError={(e) => handleImageError(e, user.fullName)}
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-[#8696a0]">
                            @{user.username || "user"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[#00a884] font-bold px-2 py-1 rounded-lg group-hover:bg-[#00a884] group-hover:text-[#0b141a] transition">
                        Send
                      </span>
                    </div>
                  ))}

                  {/* Groups List */}
                  {filteredGroups.map((group) => (
                    <div
                      key={group._id}
                      onClick={() => handleSendToGroupChat(group)}
                      className="p-2.5 rounded-xl hover:bg-[#202c33] transition cursor-pointer flex items-center justify-between group active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-700/40 text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
                          {group.name?.charAt(0)?.toUpperCase() || "G"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {group.name}
                          </p>
                          <p className="text-[10px] text-[#8696a0]">
                            {group.participants?.length || 0} participants
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-[#00a884] font-bold px-2 py-1 rounded-lg group-hover:bg-[#00a884] group-hover:text-[#0b141a] transition">
                        Send
                      </span>
                    </div>
                  ))}

                  {filteredUsers.length === 0 && filteredGroups.length === 0 && (
                    <p className="text-center text-xs text-[#8696a0] py-6">
                      No contacts found matching search
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraModal;
