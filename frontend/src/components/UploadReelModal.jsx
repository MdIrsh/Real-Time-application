import React, { useState, useRef, useEffect } from "react";
import {
  IoClose,
  IoCloudUploadOutline,
  IoMusicalNotes,
  IoPlay,
  IoPause,
  IoCheckmarkCircle,
} from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { addReel } from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import MusicPickerModal from "./MusicPickerModal";
import axios from "axios";
import toast from "react-hot-toast";

const UploadReelModal = ({ isOpen, onClose }) => {
  const [videoPreview, setVideoPreview] = useState("");
  const [videoData, setVideoData] = useState("");
  const [selectedAudioUrl, setSelectedAudioUrl] = useState("");
  const [selectedMusicCover, setSelectedMusicCover] = useState("");
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const fileInputRef = useRef(null);
  const audioPreviewRef = useRef(null);
  const dispatch = useDispatch();
  const { authUser } = useSelector((store) => store.user);

  useEffect(() => {
    if (!isOpen) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setIsPlayingPreview(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file (MP4, WebM)");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("Video size must be less than 20MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleAudioPreview = (e) => {
    e?.stopPropagation();
    if (!selectedAudioUrl) return;

    if (isPlayingPreview) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setIsPlayingPreview(false);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(selectedAudioUrl);
      audio.volume = 0.8;
      audio.onended = () => setIsPlayingPreview(false);
      audio.onerror = () => {
        toast.error("Preview not available for this track");
        setIsPlayingPreview(false);
      };
      audio.play().catch(() => setIsPlayingPreview(false));
      audioPreviewRef.current = audio;
      setIsPlayingPreview(true);
    }
  };

  const handleSelectSong = (song) => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingPreview(false);

    setSelectedSong(song);
    setSelectedAudioUrl(song.audioUrl);
    setMusicTitle(song.title);
    setSelectedMusicCover(song.coverUrl || "");
  };

  const handleRemoveSong = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingPreview(false);
    setSelectedSong(null);
    setSelectedAudioUrl("");
    setMusicTitle("");
    setSelectedMusicCover("");
  };

  const handleCreateReel = async (e) => {
    e.preventDefault();
    const finalVideo = videoData || videoPreview;
    if (!finalVideo) {
      toast.error("Please choose a video first!");
      return;
    }

    const token = localStorage.getItem("token");
    const isDemo = authUser?._id === "demo-user-me" || !token;

    const addReelLocally = () => {
      const mockReel = {
        _id: `reel_${Date.now()}`,
        author: authUser || { _id: "me", fullName: "You", username: "you" },
        creatorName: authUser?.username || authUser?.fullName || "you",
        creatorAvatar: authUser?.profilePhoto || "",
        videoUrl: finalVideo,
        audioUrl: selectedAudioUrl,
        caption: caption.trim(),
        musicTitle: musicTitle.trim() || "Original Audio 🎵",
        musicCover: selectedMusicCover,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      dispatch(addReel(mockReel));
      toast.success("Reel published successfully! 🎬✨");
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      onClose();
      setVideoPreview("");
      setVideoData("");
      setCaption("");
      setMusicTitle("");
      setSelectedAudioUrl("");
      setSelectedMusicCover("");
      setSelectedSong(null);
    };

    if (isDemo) {
      addReelLocally();
      return;
    }

    try {
      setIsUploading(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/reel/create`,
        {
          videoUrl: finalVideo,
          audioUrl: selectedAudioUrl,
          caption: caption.trim(),
          musicTitle: musicTitle.trim() || "Original Audio 🎵",
          musicCover: selectedMusicCover,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (res.data?.reel) {
        dispatch(addReel(res.data.reel));
        toast.success("Reel published successfully! 🎬✨");
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          audioPreviewRef.current = null;
        }
        onClose();
        setVideoPreview("");
        setVideoData("");
        setCaption("");
        setMusicTitle("");
        setSelectedAudioUrl("");
        setSelectedMusicCover("");
        setSelectedSong(null);
      }
    } catch (error) {
      console.error("Error creating reel:", error);
      if (error.response?.status === 401) {
        addReelLocally();
        toast("Session expired: Reel saved locally! Re-login to sync.", { icon: "⚠️" });
      } else {
        toast.error(error.response?.data?.message || "Failed to publish reel");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
        <div className="relative w-full max-w-md bg-[#1a1a1a] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#222]">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <span>🎬</span> Create New Reel
            </h3>
            <button
              onClick={() => {
                if (audioPreviewRef.current) audioPreviewRef.current.pause();
                onClose();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <IoClose size={22} />
            </button>
          </div>

          <form onSubmit={handleCreateReel} className="p-5 overflow-y-auto space-y-4">
            {/* Video Picker / Preview Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-52 rounded-xl border-2 border-dashed border-white/20 hover:border-pink-500 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition group"
            >
              {videoPreview ? (
                <video
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <IoCloudUploadOutline size={26} />
                  </div>
                  <p className="text-sm font-medium text-gray-200">
                    Click to select video
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    MP4, WebM (Vertical clip, max 20MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Video URL Alternative */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Or paste direct Video URL:
              </label>
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={!videoData && videoPreview ? videoPreview : ""}
                onChange={(e) => {
                  setVideoPreview(e.target.value);
                  setVideoData(e.target.value);
                }}
                className="w-full bg-white/10 text-white text-xs px-3 py-2 rounded-lg outline-hidden border border-white/10 focus:border-pink-500"
              />
            </div>

            {/* Choose Background Song / Music Track */}
            <div>
              <label className="text-xs text-gray-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IoMusicalNotes size={14} className="text-pink-400" />
                  Background Music Track
                </span>
                <span className="text-[10px] text-pink-400 font-medium">
                  235+ Hit Songs & Search
                </span>
              </label>

              {selectedAudioUrl ? (
                /* Selected Song Card */
                <div className="p-3 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-indigo-500/15 border border-pink-500/40 rounded-xl flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-black/40">
                      <img
                        src={
                          selectedMusicCover ||
                          "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg"
                        }
                        alt={musicTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg";
                        }}
                      />
                      {/* Play / Pause audio preview button */}
                      <button
                        type="button"
                        onClick={toggleAudioPreview}
                        className="absolute inset-0 bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition cursor-pointer"
                        title={isPlayingPreview ? "Pause" : "Play Preview"}
                      >
                        {isPlayingPreview ? (
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 h-3 bg-pink-400 animate-pulse rounded-full" />
                            <span className="w-0.5 h-4 bg-pink-400 animate-bounce rounded-full" />
                            <span className="w-0.5 h-2 bg-pink-400 animate-pulse rounded-full" />
                          </div>
                        ) : (
                          <IoPlay size={16} className="ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate flex items-center gap-1">
                        <span className="truncate">{musicTitle}</span>
                        <IoCheckmarkCircle
                          className="text-pink-400 shrink-0"
                          size={14}
                        />
                      </h4>
                      <p className="text-[11px] text-pink-300/80 truncate mt-0.5">
                        {isPlayingPreview
                          ? "Playing audio preview 🎵"
                          : "Tap play to test audio"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMusicPickerOpen(true)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSong}
                      className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                      title="Remove song"
                    >
                      <IoClose size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Select Song Trigger Button */
                <button
                  type="button"
                  onClick={() => setIsMusicPickerOpen(true)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 transition cursor-pointer group text-left shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
                      <IoMusicalNotes size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        Choose Music / Song
                        <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-medium border border-pink-500/30">
                          235+ Hits
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Bollywood, Punjabi, Romantic, Party & Live Search
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-pink-400 group-hover:translate-x-1 transition flex items-center gap-1">
                    Pick 🎵 →
                  </span>
                </button>
              )}
            </div>

            {/* Caption & Hashtags */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Caption & Hashtags
              </label>
              <textarea
                rows={3}
                placeholder="Write a caption... #trending #bollywood #vibes"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-white/10 text-white text-sm px-3.5 py-2.5 rounded-xl outline-hidden border border-white/10 focus:border-pink-500 placeholder-gray-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !videoPreview}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-pink-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing Reel...
                </>
              ) : (
                "Publish Reel 🚀"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 235+ Songs Music Picker Modal with Live Search */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        currentSong={selectedSong}
        onSelectSong={handleSelectSong}
      />
    </>
  );
};

export default UploadReelModal;
