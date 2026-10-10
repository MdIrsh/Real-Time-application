import React, { useState, useRef } from "react";
import {
  IoClose,
  IoCloudUploadOutline,
  IoMusicalNotes,
  IoLogoInstagram,
  IoClipboardOutline,
  IoPlay,
} from "react-icons/io5";
import { useDispatch } from "react-redux";
import { addReel } from "../redux/reelSlice";
import { extractInstagramShortcode } from "../utils/instagramReels";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const TRENDING_SONGS = [
  { name: "Original Video Sound (No Background Music)", url: "", cover: "" },
  { name: "Kesariya - Arijit Singh & Pritam (Brahmāstra) 🧡", url: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3", cover: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg" },
  { name: "Apna Bana Le - Arijit Singh & Sachin-Jigar (Bhediya) 🌸", url: "https://jiotunepreview.jio.com/content/Converted/010910441686043.mp3", cover: "https://c.saavncdn.com/390/Bollywood-Top-Romantic-Hits-Hindi-2026-20260717151136-500x500.jpg" },
  { name: "Tauba Tauba - Karan Aujla (Bad Newz) 🔥", url: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3", cover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg" },
  { name: "Chaleya - Arijit Singh, Shilpa Rao & Anirudh (Jawan) ✨", url: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3", cover: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg" },
  { name: "Heeriye - Jasleen Royal & Arijit Singh ❤️", url: "https://jiotunepreview.jio.com/content/Converted/010912552003505.mp3", cover: "https://c.saavncdn.com/022/Heeriye-feat-Arijit-Singh-Hindi-2023-20230928050405-500x500.jpg" },
  { name: "Raataan Lambiyan - Jubin Nautiyal & Asees Kaur (Shershaah) 🌙", url: "https://jiotunepreview.jio.com/content/Converted/010910141318776.mp3", cover: "https://c.saavncdn.com/238/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg" },
  { name: "Tum Hi Ho - Arijit Singh & Mithoon (Aashiqui 2) 🎶", url: "https://jiotunepreview.jio.com/content/Converted/010910092419390.mp3", cover: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg" },
];

const UploadReelModal = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState("instagram"); // "instagram" | "file"
  const [instagramLink, setInstagramLink] = useState("");
  const [detectedShortcode, setDetectedShortcode] = useState("");
  const [category, setCategory] = useState("trending");

  const [videoPreview, setVideoPreview] = useState("");
  const [videoData, setVideoData] = useState("");
  const [selectedAudioUrl, setSelectedAudioUrl] = useState("");
  const [selectedMusicCover, setSelectedMusicCover] = useState("");
  const [caption, setCaption] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleInstagramLinkChange = (val) => {
    setInstagramLink(val);
    const code = extractInstagramShortcode(val);
    setDetectedShortcode(code);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleInstagramLinkChange(text);
        toast.success("Pasted from clipboard! 📋");
      }
    } catch (e) {
      toast("Please paste manually using Ctrl+V");
    }
  };

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

  const handleCreateReel = async (e) => {
    e.preventDefault();

    if (tab === "instagram") {
      const code = detectedShortcode || extractInstagramShortcode(instagramLink);
      if (!code) {
        toast.error("Please enter a valid Instagram Reel URL or shortcode!");
        return;
      }

      try {
        setIsUploading(true);
        const res = await axios.post(
          `${BASE_URL}/api/v1/reel/create`,
          {
            videoUrl: `https://www.instagram.com/reel/${code}/`,
            shortcode: code,
            category: category,
            caption: caption.trim() || `Instagram Reel #${category}`,
            musicTitle: musicTitle.trim() || "Instagram Audio 🎵",
          },
          { withCredentials: true }
        );

        if (res.data?.reel) {
          dispatch(addReel(res.data.reel));
          toast.success("Real Instagram Reel added to Feed! 🎬✨");
          onClose();
          setInstagramLink("");
          setDetectedShortcode("");
          setCaption("");
        }
      } catch (error) {
        console.error("Error creating reel:", error);
        // Fallback local addition if network/backend issue
        const localReel = {
          _id: `ig-user-${Date.now()}`,
          shortcode: code,
          videoUrl: `https://www.instagram.com/reel/${code}/`,
          creatorName: "Instagram Creator",
          caption: caption.trim() || "Instagram Reel",
          category: category,
          likes: [],
          comments: [],
          sharesCount: 1,
        };
        dispatch(addReel(localReel));
        toast.success("Real Instagram Reel added! 🎬");
        onClose();
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Video File Upload
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
          musicCover: selectedMusicCover,
          category: category,
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
      }
    } catch (error) {
      console.error("Error creating reel:", error);
      toast.error(error.response?.data?.message || "Failed to publish reel");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#18181b] text-white rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-pink-600/30 via-purple-600/20 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <IoLogoInstagram size={19} />
            </div>
            <div>
              <h3 className="font-bold text-sm">Add Reel to Feed</h3>
              <p className="text-[11px] text-gray-400">Instagram Embed or Video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition active:scale-95"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Tab Switcher: Instagram Link vs Video Upload */}
        <div className="px-5 pt-3">
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setTab("instagram")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                tab === "instagram"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <IoLogoInstagram size={15} />
              <span>Paste Instagram Link</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("file")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 ${
                tab === "file"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <IoCloudUploadOutline size={15} />
              <span>Upload Video File</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateReel} className="p-5 overflow-y-auto space-y-4">
          {tab === "instagram" ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Instagram Reel URL / Link</span>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-normal cursor-pointer"
                  >
                    <IoClipboardOutline size={13} />
                    <span>Paste Clipboard</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://www.instagram.com/reel/C-U1J5qPZ8B/..."
                    value={instagramLink}
                    onChange={(e) => handleInstagramLinkChange(e.target.value)}
                    className="w-full bg-white/5 text-white text-xs px-3.5 py-2.5 pr-8 rounded-xl outline-hidden border border-white/15 focus:border-pink-500 placeholder-gray-500"
                    autoFocus
                  />
                  {instagramLink && (
                    <button
                      type="button"
                      onClick={() => handleInstagramLinkChange("")}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                    >
                      <IoClose size={16} />
                    </button>
                  )}
                </div>
                <p className="text-[10.5px] text-gray-400 mt-1">
                  Copy any reel link from the Instagram App and paste here.
                </p>
              </div>

              {detectedShortcode && (
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-white">Valid Reel Detected!</p>
                      <p className="text-[10px] text-pink-300 font-mono">ID: {detectedShortcode}</p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-bold">
                    Official Embed Ready
                  </span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden border border-white/15 focus:border-pink-500 cursor-pointer"
                >
                  <option value="trending" className="bg-[#222]">🔥 Trending</option>
                  <option value="cricket" className="bg-[#222]">🏏 Cricket</option>
                  <option value="comedy" className="bg-[#222]">😂 Comedy</option>
                  <option value="music" className="bg-[#222]">🎵 Music</option>
                  <option value="tech" className="bg-[#222]">📱 Tech</option>
                </select>
              </div>

              {/* Caption */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Custom Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="Caption for this reel..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs px-3.5 py-2.5 rounded-xl outline-hidden border border-white/15 focus:border-pink-500 placeholder-gray-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Video Picker / Preview Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-48 rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition group"
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
                    <p className="text-xs font-semibold text-gray-200">
                      Click to select MP4 / WebM video
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">Short vertical video clip (Max 20MB)</p>
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

              {/* Caption */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Caption & Hashtags</label>
                <textarea
                  rows={2}
                  placeholder="Write a caption... #trending #reels"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-white/5 text-white text-xs px-3.5 py-2 rounded-xl outline-hidden border border-white/15 focus:border-pink-500 placeholder-gray-500 resize-none"
                />
              </div>

              {/* Choose Song */}
              <div>
                <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <IoMusicalNotes size={13} className="text-pink-400" /> Bollywood Song
                </label>
                <select
                  value={selectedAudioUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setSelectedAudioUrl(url);
                    const found = TRENDING_SONGS.find((s) => s.url === url);
                    if (found) {
                      setMusicTitle(found.url ? found.name : "");
                      setSelectedMusicCover(found.cover || "");
                    }
                  }}
                  className="w-full bg-white/5 text-white text-xs px-3 py-2 rounded-xl outline-hidden border border-white/15 focus:border-pink-500 cursor-pointer"
                >
                  {TRENDING_SONGS.map((song, i) => (
                    <option key={i} value={song.url} className="bg-[#222] text-white">
                      {song.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading || (tab === "instagram" ? !instagramLink : !videoPreview)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Reel...</span>
              </>
            ) : (
              <>
                <IoPlay size={14} />
                <span>Add Real Instagram Reel 🚀</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadReelModal;
