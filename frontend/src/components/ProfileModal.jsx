import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { BASE_URL } from "../config/api";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { compressImage } from "../utils/imageCompressor";
import { updateUserProfilePhoto } from "../redux/userSlice";
import {
  IoClose,
  IoCamera,
  IoCloudUploadOutline,
  IoTrashOutline,
  IoCheckmarkCircle,
  IoPersonOutline,
  IoAtOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";

const ProfileModal = ({ isOpen, onClose }) => {
  const { authUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const fileInputRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoInfo, setPhotoInfo] = useState(null); // { sizeKB, width, height }
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (isOpen && authUser) {
      setFullName(authUser.fullName || "");
      setPreviewPhoto(null);
      setPhotoInfo(null);
    }
  }, [isOpen, authUser]);

  if (!isOpen) return null;

  const currentAvatar = previewPhoto || getAvatarUrl(authUser);

  // Handle file select & client-side compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file (JPG, PNG, WebP)");
      return;
    }

    try {
      toast.loading("Processing photo...", { id: "photo-proc" });
      const compressed = await compressImage(file, { maxSize: 450, quality: 0.88 });
      setPreviewPhoto(compressed.dataUrl);
      setPhotoInfo({
        sizeKB: compressed.sizeKB,
        width: compressed.width,
        height: compressed.height,
      });
      toast.success(`Photo ready! (${compressed.sizeKB} KB)`, { id: "photo-proc" });
    } catch (err) {
      console.error("Image compression error:", err);
      toast.error("Failed to process image. Try another photo.", { id: "photo-proc" });
    } finally {
      // Clear file input so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit profile photo update permanently
  const handleSave = async (e) => {
    e.preventDefault();
    if (!previewPhoto && fullName.trim() === (authUser?.fullName || "")) {
      toast("No changes to save.", { icon: "ℹ️" });
      onClose();
      return;
    }

    setLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.put(`${BASE_URL}/api/v1/user/profile/update-photo`, {
        profilePhoto: previewPhoto || undefined,
        fullName: fullName.trim() || undefined,
      });

      if (res.data?.user) {
        const updated = res.data.user;
        dispatch(
          updateUserProfilePhoto({
            userId: updated._id,
            profilePhoto: updated.profilePhoto,
            fullName: updated.fullName,
          })
        );
        toast.success("Profile photo updated permanently! 🎉");
        onClose();
      }
    } catch (error) {
      console.error("Update profile error:", error);
      const msg = error?.response?.data?.message || "Failed to update profile photo.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Reset to default dicebear avatar
  const handleResetPhoto = async () => {
    if (!window.confirm("Are you sure you want to reset your profile photo to the default avatar?")) {
      return;
    }

    setResetLoading(true);
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.put(`${BASE_URL}/api/v1/user/profile/reset-photo`);

      if (res.data?.user) {
        const updated = res.data.user;
        setPreviewPhoto(null);
        setPhotoInfo(null);
        dispatch(
          updateUserProfilePhoto({
            userId: updated._id,
            profilePhoto: updated.profilePhoto,
            fullName: updated.fullName,
          })
        );
        toast.success("Profile photo reset to default avatar.");
      }
    } catch (error) {
      console.error("Reset photo error:", error);
      toast.error("Failed to reset photo.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#00a884] text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <IoPersonOutline className="text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Profile Settings</h2>
              <p className="text-xs text-emerald-100">Set your real photo & display info</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/20 shadow-lg bg-gray-100 relative">
                <img
                  src={currentAvatar}
                  alt={authUser?.fullName || "User DP"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  onError={(e) => handleImageError(e, authUser?.fullName)}
                />

                {/* Hover overlay with Camera trigger */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <IoCamera className="text-3xl drop-shadow" />
                  <span className="text-[11px] font-semibold mt-1 drop-shadow">
                    Change Photo
                  </span>
                </div>
              </div>

              {/* Quick action button below avatar circle */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-95 cursor-pointer"
                title="Choose new photo from device"
              >
                <IoCamera className="text-lg" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Photo info / status banner */}
            {previewPhoto && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <IoCheckmarkCircle className="text-emerald-600 text-sm" />
                <span>
                  New real photo selected ({photoInfo?.sizeKB || "~50"} KB) • Click Save
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPhoto(null);
                    setPhotoInfo(null);
                  }}
                  className="ml-1 text-[11px] text-gray-500 hover:text-red-500 underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Choose / Reset Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-[#00a884] hover:text-[#008f6f] bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <IoCloudUploadOutline className="text-sm" />
                <span>Upload From Gallery/PC</span>
              </button>

              <button
                type="button"
                onClick={handleResetPhoto}
                disabled={resetLoading}
                className="text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                title="Reset to default avatar"
              >
                <IoTrashOutline className="text-sm" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3.5 bg-gray-50/80 p-4 rounded-xl border border-gray-200/60">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <IoPersonOutline />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white text-sm text-[#111b21] px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <IoAtOutline />
                <span>Username</span>
              </label>
              <div className="w-full bg-gray-100 text-sm text-gray-600 px-3 py-2 rounded-lg border border-gray-200 select-all font-mono flex items-center justify-between">
                <span>@{authUser?.username}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-sans">
                  Permanent
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1">
                <IoShieldCheckmarkOutline className="text-emerald-600 text-sm" />
                <span>Account: Active</span>
              </span>
              <span className="capitalize bg-white px-2 py-0.5 rounded border border-gray-200 font-medium text-gray-600">
                {authUser?.gender || "User"}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-60 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-98"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <IoCheckmarkCircle className="text-sm" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
