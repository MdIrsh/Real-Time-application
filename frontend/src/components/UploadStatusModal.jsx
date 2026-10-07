import React, { useState, useRef } from "react";
import {
  IoClose,
  IoImageOutline,
  IoTextOutline,
  IoSend,
  IoColorPaletteOutline,
} from "react-icons/io5";
import { useDispatch } from "react-redux";
import { addMyStatus } from "../redux/statusSlice";
import { BASE_URL } from "../config/api";
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

const UploadStatusModal = ({ isOpen, onClose }) => {
  const [statusType, setStatusType] = useState("image"); // "image" | "text"
  const [textCaption, setTextCaption] = useState("");
  const [selectedColor, setSelectedColor] = useState(STATUS_COLORS[0]);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaData, setMediaData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select a valid image or short video");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be under 15MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (statusType === "text" && !textCaption.trim()) {
      toast.error("Please type your status text!");
      return;
    }

    const finalMedia = mediaData || mediaPreview;
    if (statusType === "image" && !finalMedia && !textCaption.trim()) {
      toast.error("Please upload a photo or write text!");
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
        },
        { withCredentials: true }
      );

      if (res.data?.status) {
        dispatch(addMyStatus(res.data.status));
        toast.success("Status posted! Disappears in 24 hours 🕒✨");
        onClose();
        setTextCaption("");
        setMediaPreview("");
        setMediaData("");
      }
    } catch (err) {
      console.error("Create status error:", err);
      toast.error(err.response?.data?.message || "Failed to post status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col max-h-[90vh]">
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
        <form onSubmit={handleSubmit} className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
          {statusType === "text" ? (
            /* WhatsApp Text Status Card */
            <div className="flex flex-col gap-3">
              <div
                className="w-full h-56 rounded-2xl p-6 flex items-center justify-center text-center shadow-inner transition-colors duration-300 relative overflow-hidden"
                style={{ backgroundColor: selectedColor }}
              >
                <textarea
                  rows={4}
                  placeholder="Type a status..."
                  value={textCaption}
                  onChange={(e) => setTextCaption(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-xl placeholder-white/70 outline-hidden resize-none text-center drop-shadow"
                />
              </div>

              {/* Color Palette Selector */}
              <div>
                <label className="text-xs text-[#8696a0] mb-2 flex items-center gap-1">
                  <IoColorPaletteOutline size={14} className="text-[#25d366]" /> Choose Background Color:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {STATUS_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full shrink-0 transition-transform active:scale-95 border-2 ${
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
                <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden border border-[#202c33] flex items-center justify-center">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPreview("");
                      setMediaData("");
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <IoClose size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-[#2a3942] hover:border-[#25d366] bg-[#0b141a] flex flex-col items-center justify-center gap-2 text-[#8696a0] hover:text-[#25d366] cursor-pointer transition"
                >
                  <IoImageOutline size={36} />
                  <span className="text-xs font-medium">Click to select photo or video</span>
                  <span className="text-[10px] text-gray-500">Supports JPG, PNG, MP4 up to 15MB</span>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="text-xs text-[#8696a0] mb-1 block">Add a caption...</label>
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

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#00a884] hover:bg-[#02906f] active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <IoSend size={15} />
                <span>Post Status (Disappears in 24h)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadStatusModal;
