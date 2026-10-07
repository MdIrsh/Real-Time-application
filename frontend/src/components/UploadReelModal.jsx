import React, { useState, useRef } from "react";
import { IoClose, IoCloudUploadOutline, IoMusicalNotes } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { addReel } from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const TRENDING_SONGS = [
  { name: "Original Video Sound (No Background Music)", url: "" },
  { name: "Kesariya - Arijit Singh (Brahmāstra) 🧡", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Apna Bana Le - Arijit Singh (Bhediya) 🌸", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { name: "Tauba Tauba - Karan Aujla (Bad Newz) 🔥", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { name: "Chaleya - Arijit Singh & Anirudh (Jawan) ✨", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { name: "Heeriye - Arijit Singh & Jasleen Royal ❤️", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { name: "Raataan Lambiyan - Jubin Nautiyal (Shershaah) 🌙", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
  { name: "Tum Hi Ho - Arijit Singh (Aashiqui 2) 🎶", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { name: "Lut Gaye - Jubin Nautiyal & Emraan Hashmi 🌹", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
];

const UploadReelModal = ({ isOpen, onClose }) => {
  const [videoPreview, setVideoPreview] = useState("");
  const [videoData, setVideoData] = useState("");
  const [selectedAudioUrl, setSelectedAudioUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file (MP4, WebM)");
      return;
    }

    // Limit to 20MB for fast processing
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Video size must be less than 20MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setVideoPreview(objectUrl);

    // Read as Base64 data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateReel = async (e) => {
    e.preventDefault();
    const finalVideo = videoData || videoPreview;
    if (!finalVideo) {
      toast.error("Please choose a video first!");
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
        },
        { withCredentials: true }
      );

      if (res.data?.reel) {
        dispatch(addReel(res.data.reel));
        toast.success("Reel published successfully! 🎬✨");
        onClose();
        setVideoPreview("");
        setVideoData("");
        setCaption("");
        setMusicTitle("");
      }
    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error(error.response?.data?.message || "Failed to publish reel");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#1a1a1a] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#222]">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <span>🎬</span> Create New Reel
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <IoClose size={22} />
          </button>
        </div>

        <form onSubmit={handleCreateReel} className="p-5 overflow-y-auto space-y-4">
          {/* Video Picker / Preview Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-56 rounded-xl border-2 border-dashed border-white/20 hover:border-blue-500 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition group"
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
                <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <IoCloudUploadOutline size={26} />
                </div>
                <p className="text-sm font-medium text-gray-200">
                  Click to select video
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  MP4, WebM (Short vertical clip)
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

          {/* Or Paste Video Link Option */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Or paste Video URL (MP4 link):
            </label>
            <input
              type="url"
              placeholder="https://example.com/video.mp4"
              value={!videoData && videoPreview ? videoPreview : ""}
              onChange={(e) => {
                setVideoPreview(e.target.value);
                setVideoData(e.target.value);
              }}
              className="w-full bg-white/10 text-white text-xs px-3 py-2 rounded-lg outline-hidden border border-white/10 focus:border-blue-500"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Caption & Hashtags</label>
            <textarea
              rows={3}
              placeholder="Write a caption... #trending #vibes"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-white/10 text-white text-sm px-3.5 py-2.5 rounded-xl outline-hidden border border-white/10 focus:border-blue-500 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Choose Song / Music Track */}
          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <IoMusicalNotes size={13} className="text-pink-400" /> Choose Song / Music Track
            </label>
            <select
              value={selectedAudioUrl}
              onChange={(e) => {
                const url = e.target.value;
                setSelectedAudioUrl(url);
                const found = TRENDING_SONGS.find((s) => s.url === url);
                if (found && found.url) {
                  setMusicTitle(found.name);
                }
              }}
              className="w-full bg-white/10 text-white text-xs px-3 py-2.5 rounded-lg outline-hidden border border-white/10 focus:border-pink-500 cursor-pointer"
            >
              {TRENDING_SONGS.map((song, i) => (
                <option key={i} value={song.url} className="bg-[#222] text-white">
                  {song.name}
                </option>
              ))}
            </select>
          </div>

          {/* Music Audio title */}
          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <IoMusicalNotes size={13} className="text-blue-400" /> Audio Title
            </label>
            <input
              type="text"
              placeholder="Original Audio - Song Name"
              value={musicTitle}
              onChange={(e) => setMusicTitle(e.target.value)}
              className="w-full bg-white/10 text-white text-xs px-3 py-2 rounded-lg outline-hidden border border-white/10 focus:border-blue-500 placeholder-gray-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || !videoPreview}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
};

export default UploadReelModal;
