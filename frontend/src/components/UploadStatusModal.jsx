import React, { useState, useRef, useEffect } from "react";
import {
  IoClose,
  IoImageOutline,
  IoTextOutline,
  IoSend,
  IoColorPaletteOutline,
  IoMusicalNotes,
  IoPlay,
  IoPause,
} from "react-icons/io5";
import { useDispatch } from "react-redux";
import { addMyStatus } from "../redux/statusSlice";
import { BASE_URL } from "../config/api";
import MusicPickerModal from "./MusicPickerModal";
import { STATUS_SONGS } from "../utils/statusSongs";
import axios from "axios";
import toast from "react-hot-toast";

const STATUS_COLORS = [
  "#128c7e", // Classic WhatsApp Green
  "#075e54", // Deep Forest Green
  "#7b1fa2", // Royal Purple
  "#c2185b", // Crimson Pink
  "#d87b00", // Sunset Amber
  "#007aff", // Ocean Blue
  "#202c33", // Dark Slate
];

const UploadStatusModal = ({ isOpen, onClose, initialType = "image" }) => {
  const [statusType, setStatusType] = useState(initialType); // "image" | "text"
  const [textCaption, setTextCaption] = useState("");
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isMusicPickerOpen, setIsMusicPickerOpen] = useState(false);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaData, setMediaData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      setStatusType(initialType);
    }
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPreviewPlaying(false);
    };
  }, [isOpen, initialType]);

  const togglePreviewAudio = () => {
    if (!selectedSong) return;
    if (isPreviewPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPreviewPlaying(false);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(selectedSong.audioUrl);
      audio.volume = 0.8;
      audio.play().catch(() => {});
      audio.onended = () => setIsPreviewPlaying(false);
      previewAudioRef.current = audio;
      setIsPreviewPlaying(true);
    }
  };

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select a valid image or short video");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);

    if (file.type.startsWith("image/")) {
      // High-performance client-side image compression
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1280;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
          setMediaData(compressedBase64);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Video files
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (statusType === "text" && !textCaption.trim() && !selectedSong) {
      toast.error("Please type your status text or add music!");
      return;
    }

    const finalMedia = mediaData || mediaPreview;
    if (statusType === "image" && !finalMedia && !textCaption.trim() && !selectedSong) {
      toast.error("Please upload a photo, write text, or add music!");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/status/create`,
        {
          mediaUrl: statusType === "image" ? finalMedia : "",
          mediaType: statusType === "image" ? "image" : "text",
          caption: textCaption.trim(),
          bgColor: selectedColor,
          song: selectedSong
            ? {
                title: selectedSong.title,
                artist: selectedSong.artist,
                audioUrl: selectedSong.audioUrl,
                coverUrl: selectedSong.coverUrl,
              }
            : null,
        },
        { withCredentials: true }
      );

      if (res.data?.status) {
        dispatch(addMyStatus(res.data.status));
        toast.success(
          selectedSong
            ? `Status with "${selectedSong.title}" posted! 🎵✨`
            : "Status posted! Disappears in 24 hours 🕒✨"
        );
        onClose();
        setTextCaption("");
        setMediaPreview("");
        setMediaData("");
        setSelectedSong(null);
      }
    } catch (err) {
      console.error("Create status error:", err);
      toast.error(err.response?.data?.message || "Failed to post status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in select-none">
        <div className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
            <h3 className="font-bold text-sm text-[#e9edef]">Add to My Status</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#111b21] transition"
            >
              <IoClose size={20} />
            </button>
          </div>

          {/* Type Toggle: Photo/Media vs Text Status */}
          <div className="flex border-b border-[#202c33] bg-[#0b141a]">
            <button
              type="button"
              onClick={() => setStatusType("image")}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                statusType === "image"
                  ? "text-[#25d366] border-b-2 border-[#25d366] bg-[#111b21]"
                  : "text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              <IoImageOutline size={16} />
              <span>Photo / Video</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusType("text")}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                statusType === "text"
                  ? "text-[#25d366] border-b-2 border-[#25d366] bg-[#111b21]"
                  : "text-[#8696a0] hover:text-[#e9edef]"
              }`}
            >
              <IoTextOutline size={16} />
              <span>Text Story</span>
            </button>
          </div>

          {/* Main Content Area */}
          <form onSubmit={handleSubmit} className="p-4 flex-1 flex flex-col gap-3.5 overflow-y-auto">
            {statusType === "text" ? (
              /* WhatsApp Text Status Card */
              <div className="flex flex-col gap-3">
                <div
                  className="w-full h-52 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner transition-colors duration-300 relative overflow-hidden"
                  style={{ backgroundColor: selectedColor }}
                >
                  {/* Floating Instagram/WhatsApp Music Sticker Overlay */}
                  {selectedSong && (
                    <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white shadow-lg animate-fade-in">
                      <img
                        src={selectedSong.coverUrl}
                        alt="Music cover"
                        className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/30"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[11px] font-semibold truncate flex items-center gap-1">
                          <IoMusicalNotes size={11} className="text-[#25d366] shrink-0" />
                          <span>{selectedSong.title}</span>
                          <span className="text-gray-300 text-[10px]">• {selectedSong.artist}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSong(null)}
                        className="text-gray-300 hover:text-white text-xs px-1"
                        title="Remove song"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    placeholder="Type a status..."
                    value={textCaption}
                    onChange={(e) => setTextCaption(e.target.value)}
                    className="w-full bg-transparent text-white font-bold text-xl placeholder-white/70 outline-hidden resize-none text-center drop-shadow mt-4"
                  />
                </div>

                {/* Color Palette Selector */}
                <div>
                  <label className="text-xs text-[#8696a0] mb-1.5 flex items-center gap-1">
                    <IoColorPaletteOutline size={14} className="text-[#25d366]" /> Choose Background Color:
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {STATUS_COLORS.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`w-7 h-7 rounded-full shrink-0 transition-transform active:scale-95 border-2 ${
                          selectedColor === c ? "scale-110 border-white shadow-md" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Photo / Media Status Upload */
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {mediaPreview ? (
                  <div className="relative w-full h-52 bg-black rounded-2xl overflow-hidden border border-[#202c33] flex items-center justify-center">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />

                    {/* Floating Instagram/WhatsApp Music Sticker Overlay */}
                    {selectedSong && (
                      <div className="absolute top-3 left-3 right-3 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-white shadow-lg animate-fade-in">
                        <img
                          src={selectedSong.coverUrl}
                          alt="Music cover"
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/30"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[11px] font-semibold truncate flex items-center gap-1">
                            <IoMusicalNotes size={11} className="text-[#25d366] shrink-0" />
                            <span>{selectedSong.title}</span>
                            <span className="text-gray-300 text-[10px]">• {selectedSong.artist}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSong(null)}
                          className="text-gray-300 hover:text-white text-xs px-1"
                          title="Remove song"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMediaPreview("");
                        setMediaData("");
                      }}
                      className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <IoClose size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-2xl border-2 border-dashed border-[#2a3942] hover:border-[#25d366] bg-[#0b141a] flex flex-col items-center justify-center gap-2 text-[#8696a0] hover:text-[#25d366] cursor-pointer transition"
                  >
                    <IoImageOutline size={34} />
                    <span className="text-xs font-medium">Click to select photo or video</span>
                    <span className="text-[10px] text-gray-500">Supports JPG, PNG, MP4 up to 15MB</span>
                  </div>
                )}

                {/* Caption */}
                <div>
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={textCaption}
                    onChange={(e) => setTextCaption(e.target.value)}
                    className="w-full bg-[#202c33] text-xs text-[#e9edef] px-3.5 py-2.5 rounded-xl outline-hidden border border-transparent focus:border-[#00a884] placeholder-[#8696a0]"
                  />
                </div>
              </div>
            )}

            {/* Song / Music Selector Bar */}
            <div className="p-2.5 rounded-xl bg-[#0b141a] border border-[#202c33] flex flex-col gap-2">
              {selectedSong ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedSong.coverUrl}
                    alt={selectedSong.title}
                    className="w-10 h-10 rounded-lg object-cover shadow shrink-0 border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e9edef] truncate">
                      <IoMusicalNotes className="text-[#25d366] shrink-0" size={13} />
                      <span className="truncate">{selectedSong.title}</span>
                    </div>
                    <p className="text-[11px] text-[#8696a0] truncate mt-0.5">
                      {selectedSong.artist}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Play/Pause Audio Preview */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePreviewAudio();
                      }}
                      className="w-7 h-7 rounded-full bg-[#103629] text-[#25d366] hover:bg-[#25d366] hover:text-[#0b141a] flex items-center justify-center text-xs transition cursor-pointer"
                      title={isPreviewPlaying ? "Pause Preview" : "Play Preview"}
                    >
                      {isPreviewPlaying ? <IoPause size={13} /> : <IoPlay size={13} className="ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsMusicPickerOpen(true);
                      }}
                      className="text-xs text-[#25d366] hover:underline px-1.5 py-1 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (previewAudioRef.current) {
                          previewAudioRef.current.pause();
                        }
                        setIsPreviewPlaying(false);
                        setSelectedSong(null);
                      }}
                      className="w-6 h-6 rounded-full bg-[#202c33] text-[#8696a0] hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                      title="Remove music"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsMusicPickerOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#202c33] hover:bg-[#2a3942] active:scale-98 transition flex items-center justify-center gap-2 text-xs font-semibold text-[#25d366] cursor-pointer border border-[#25d366]/30 hover:border-[#25d366]/60 shadow-sm"
                  >
                    <IoMusicalNotes size={16} />
                    <span>🎵 Add Bollywood Music / Song</span>
                  </button>

                  {/* 1-Tap Quick Pick Trending Songs */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <span className="text-[10px] text-[#8696a0] font-medium flex items-center gap-1">
                      <span>⚡ Quick 1-Tap Select:</span>
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                      {STATUS_SONGS.slice(0, 6).map((song) => (
                        <button
                          key={song.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedSong(song);
                            toast.success(`Selected "${song.title}"! 🎵`, { id: "song-quick" });
                          }}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#103629]/60 hover:bg-[#103629] text-[#25d366] border border-[#25d366]/30 hover:border-[#25d366] shrink-0 transition cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <span>🎵</span>
                          <span className="truncate max-w-[85px]">{song.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#00a884] hover:bg-[#02906f] active:scale-98 text-[#0b141a] rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#0b141a] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <IoSend size={15} />
                  <span>
                    {selectedSong
                      ? `Post Status with "${selectedSong.title}" 🎵`
                      : "Post Status (Disappears in 24h)"}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Music Picker Drawer / Modal */}
      <MusicPickerModal
        isOpen={isMusicPickerOpen}
        onClose={() => setIsMusicPickerOpen(false)}
        onSelectSong={(song) => setSelectedSong(song)}
        currentSong={selectedSong}
      />
    </>
  );
};

export default UploadStatusModal;
