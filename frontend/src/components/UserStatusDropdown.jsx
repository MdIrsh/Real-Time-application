import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { IoChevronDown, IoCheckmark } from "react-icons/io5";
import { setUserStatus } from "../redux/userSlice";
import { BASE_URL } from "../config/api";
import { STATUS_OPTIONS, STATUS_CONFIG } from "../utils/statusHelper";

const UserStatusDropdown = ({ variant = "pill", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  const { authUser, userStatuses } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);
  const dispatch = useDispatch();

  // Single active status - strictly one of "Online" | "Away" | "Offline"
  const currentStatus =
    (authUser?._id && userStatuses?.[authUser._id]) ||
    authUser?.userStatus ||
    "Online";

  const activeConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.Online;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Handle status selection with instant UI update, WebSocket emission & Database persistence
  const handleSelectStatus = async (newStatus) => {
    if (!authUser?._id) return;
    setIsOpen(false);

    if (newStatus === currentStatus) return;

    // 1. Instant optimistic UI re-render
    dispatch(
      setUserStatus({
        userId: authUser._id,
        userStatus: newStatus,
      })
    );

    // 2. Real-time WebSocket emission to all connected clients
    if (socket && socket.connected) {
      socket.emit("changeUserStatus", { userStatus: newStatus });
    }

    // 3. Database persistence via API
    setIsUpdating(true);
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.put(
        `${BASE_URL}/api/v1/user/profile/status`,
        { userStatus: newStatus },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus} ✨`, { id: "status-update" });
      }
    } catch (error) {
      console.error("Status update API error:", error);
      // Soft failure toast (optimistic socket emission keeps UI responsive)
      toast.error(
        error?.response?.data?.message || "Failed to sync status to server",
        { id: "status-update" }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Clickable Status Button */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Current Status: ${activeConfig.label} (Click to change)`}
        className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all duration-200 select-none shadow-xs border ${
          isUpdating ? "opacity-75 cursor-wait" : ""
        } ${
          isOpen
            ? "bg-[#111e3b] border-blue-500/80 text-white ring-2 ring-blue-500/30 shadow-[0_0_12px_rgba(59,130,246,0.35)]"
            : "bg-[#0d1629]/90 hover:bg-[#152244] border-[#1d2b4f] text-[#d1d7db] hover:border-blue-500/50 hover:text-white"
        }`}
      >
        {/* Single active status dot badge */}
        <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${activeConfig.dotClass} transition-colors shadow-[0_0_6px_currentColor]`}
          />
        </span>

        {/* Current status text */}
        <span className="font-medium tracking-wide">{activeConfig.label}</span>

        {/* Dropdown caret indicator */}
        <IoChevronDown
          size={12}
          className={`text-[#8696a0] group-hover:text-white transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-400" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#0a1224]/98 border border-[#1d2b4f] shadow-2xl py-2 z-50 text-xs text-[#e9edef] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 origin-top-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3.5 py-1.5 border-b border-[#1d2b4f]/70 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8ea2c6] uppercase tracking-wider">
              Current Status ▼
            </span>
            <span className="text-[10px] text-blue-400 font-semibold">
              {activeConfig.label}
            </span>
          </div>

          {/* Status Options */}
          <div className="flex flex-col gap-0.5 px-1">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.id === currentStatus;
              return (
                <button
                  key={opt.id}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelectStatus(opt.id)}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-colors text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#111e3b] text-white font-semibold shadow-inner border border-blue-500/30"
                      : "hover:bg-[#131f3b] text-[#cbd5e1]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Status Dot */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${opt.dotClass} shrink-0 ring-2 ring-black/30 shadow-[0_0_6px_currentColor]`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-none">{opt.label}</p>
                      <p className="text-[10px] text-[#8ea2c6] mt-0.5 leading-none">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  {/* Active checkmark */}
                  {isSelected && (
                    <span className="text-blue-400 ml-2 shrink-0 animate-in fade-in zoom-in duration-150">
                      <IoCheckmark size={15} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Hint */}
          <div className="mt-1 pt-1.5 border-t border-[#1d2b4f]/70 px-3.5">
            <p className="text-[10px] text-[#8ea2c6] italic">
              Changes reflect instantly to all contacts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatusDropdown;
