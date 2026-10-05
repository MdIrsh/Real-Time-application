import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "../config/api";
import { compressImage } from "../utils/imageCompressor";
import { IoCamera, IoClose } from "react-icons/io5";

const Signup = () => {
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
    profilePhoto: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Optimizing photo...", { id: "signup-photo" });
      const compressed = await compressImage(file, { maxSize: 400, quality: 0.85 });
      setPhotoPreview(compressed.dataUrl);
      setUser((prev) => ({ ...prev, profilePhoto: compressed.dataUrl }));
      toast.success("Profile photo ready!", { id: "signup-photo" });
    } catch (err) {
      toast.error("Failed to process photo.", { id: "signup-photo" });
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setPhotoPreview(null);
    setUser((prev) => ({ ...prev, profilePhoto: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCheckbox = (gender) => {
    setUser({ ...user, gender });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!user.fullName.trim() || !user.username.trim() || !user.password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!user.gender) {
      toast.error("Please select a gender (Male or Female)");
      return;
    }

    if (user.password !== user.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/v1/user/register`,
        user,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        toast.success(res.data.message || "Account created successfully!");
        navigate("/login");
      }
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Signup failed! Check backend connection.";
      toast.error(errorMsg);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-theme="light" className="h-screen w-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-white border border-gray-200/80">
        <div className="flex flex-col items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1 font-bold text-2xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-[#111b21]">Create an Account</h1>
          <p className="text-xs text-gray-500 mt-0.5">Join to start messaging your friends</p>

          {/* Profile Photo Picker */}
          <div className="mt-3.5 flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full border-2 border-emerald-500/30 overflow-hidden bg-gray-50 flex items-center justify-center shadow-inner">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-emerald-600 transition-colors">
                    <IoCamera className="text-2xl" />
                    <span className="text-[10px] font-medium mt-0.5">Add DP</span>
                  </div>
                )}
              </div>

              {photoPreview ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                  title="Remove photo"
                >
                  <IoClose className="text-xs" />
                </button>
              ) : (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow border-2 border-white">
                  <span className="text-xs font-bold leading-none">+</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <span className="text-[11px] text-gray-400 mt-1">
              {photoPreview ? "Custom DP Selected ✓" : "Upload your real photo (Optional)"}
            </span>
          </div>
        </div>

        <form onSubmit={onSubmitHandler} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 !bg-white !text-[#111b21] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="text"
              placeholder="Full Name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 !bg-white !text-[#111b21] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="text"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 !bg-white !text-[#111b21] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              value={user.confirmPassword}
              onChange={(e) =>
                setUser({ ...user, confirmPassword: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-gray-300 !bg-white !text-[#111b21] text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              type="password"
              placeholder="Confirm Password"
              required
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <span className="text-xs font-semibold text-gray-700">Gender:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name="gender"
                checked={user.gender === "male"}
                onChange={() => handleCheckbox("male")}
                className="accent-emerald-600"
              />
              Male
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
              <input
                type="radio"
                name="gender"
                checked={user.gender === "female"}
                onChange={() => handleCheckbox("female")}
                className="accent-emerald-600"
              />
              Female
            </label>
          </div>

          <p className="text-center text-xs text-gray-600 pt-1">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Login
            </Link>
          </p>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-60 active:scale-98 text-white font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              <span>{loading ? "Creating Account..." : "Signup"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
