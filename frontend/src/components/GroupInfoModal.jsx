import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IoClose,
  IoPeople,
  IoPersonAddOutline,
  IoLogOutOutline,
  IoShieldCheckmark,
  IoCheckmark,
  IoCamera,
  IoSparkles,
} from "react-icons/io5";
import { setSelectedGroup, updateGroup } from "../redux/groupSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const PRESET_ICONS = [
  "👥", "🚀", "🔥", "🎉", "🎓", "⚽", "🏖️", "💼", "🎮", "🍕", "🎸", "🕉️", "☕", "❤️"
];

const GroupInfoModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { selectedGroup } = useSelector((store) => store.group);
  const { authUser, otherUsers } = useSelector((store) => store.user);

  const [isAdding, setIsAdding] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !selectedGroup) return null;

  const existingMemberIds = (selectedGroup.participants || []).map((p) =>
    (p._id || p).toString()
  );

  const availableFriends = (otherUsers || []).filter(
    (friend) => !existingMemberIds.includes(friend._id.toString())
  );

  const toggleSelectFriend = (friendId) => {
    setSelectedToAdd((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file is too large (max 15MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result;
      try {
        setLoading(true);
        const res = await axios.post(
          `${BASE_URL}/api/v1/group/update-avatar/${selectedGroup._id}`,
          { groupAvatar: base64Url },
          { withCredentials: true }
        );
        if (res.data?.success && res.data.group) {
          dispatch(updateGroup(res.data.group));
          toast.success("Group profile photo updated! 📸");
        }
      } catch (err) {
        console.error("updateGroupAvatar error:", err);
        toast.error(err.response?.data?.message || "Failed to update group DP");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiSelect = async (emoji) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/group/update-avatar/${selectedGroup._id}`,
        { groupAvatar: emoji },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.group) {
        dispatch(updateGroup(res.data.group));
        toast.success(`Group icon set to ${emoji}! 🎉`);
        setShowEmojiPicker(false);
      }
    } catch (err) {
      toast.error("Failed to update group icon");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/group/add-members/${selectedGroup._id}`,
        { memberIds: selectedToAdd },
        { withCredentials: true }
      );
      if (res.data?.success && res.data.group) {
        dispatch(updateGroup(res.data.group));
        toast.success("Members added to group! 🎉");
        setIsAdding(false);
        setSelectedToAdd([]);
      }
    } catch (err) {
      console.error("Add members error:", err);
      toast.error(err.response?.data?.message || "Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm(`Are you sure you want to leave "${selectedGroup.name}"?`))
      return;
    try {
      setLoading(true);
      await axios.post(
        `${BASE_URL}/api/v1/group/leave/${selectedGroup._id}`,
        {},
        { withCredentials: true }
      );
      toast.success("Left group successfully");
      dispatch(setSelectedGroup(null));
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  const adminId = selectedGroup.admin?._id || selectedGroup.admin;
  const isImageAvatar =
    selectedGroup.groupAvatar &&
    (selectedGroup.groupAvatar.startsWith("data:image") ||
      selectedGroup.groupAvatar.startsWith("http"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <IoPeople className="text-[#25d366]" size={18} />
            <h3 className="font-bold text-sm text-[#e9edef]">Group Details</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Avatar & Title Hero with Change DP Controls */}
          <div className="flex flex-col items-center text-center pb-3 border-b border-[#202c33]">
            {/* Group DP with interactive camera icon overlay */}
            <div className="relative group/dp cursor-pointer mb-2">
              {isImageAvatar ? (
                <img
                  src={selectedGroup.groupAvatar}
                  alt={selectedGroup.name}
                  className="w-24 h-24 rounded-full object-cover border-3 border-[#25d366]/60 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#103629] to-[#00a884]/40 border-3 border-[#25d366]/60 flex items-center justify-center text-4xl font-bold text-[#25d366] shadow-xl">
                  {selectedGroup.groupAvatar && selectedGroup.groupAvatar.length <= 4
                    ? selectedGroup.groupAvatar
                    : selectedGroup.name?.charAt(0)?.toUpperCase() || "👥"}
                </div>
              )}

              {/* Camera Icon Overlay Badge */}
              <label
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#25d366] hover:bg-[#20ba59] text-[#0b141a] rounded-full flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-transform border-2 border-[#111b21]"
                title="Change Group DP"
              >
                <IoCamera size={16} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <h2 className="text-lg font-bold text-white">{selectedGroup.name}</h2>
            {selectedGroup.description && (
              <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
                {selectedGroup.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[#25d366] font-semibold bg-[#103629] px-2.5 py-0.5 rounded-full">
                {selectedGroup.participants?.length || 0} participants
              </span>

              {/* Upload Photo Button */}
              <label className="px-2.5 py-1 bg-[#202c33] hover:bg-[#26353d] text-[11px] font-semibold text-[#25d366] rounded-lg border border-[#25d366]/30 cursor-pointer flex items-center gap-1 transition active:scale-95 shadow-sm">
                <IoCamera size={13} />
                <span>Change DP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>

              {/* Emoji Picker Toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="px-2 py-1 bg-[#202c33] hover:bg-[#26353d] text-[11px] text-gray-300 rounded-lg border border-white/10 transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <IoSparkles size={12} className="text-amber-400" />
                <span>Icons</span>
              </button>
            </div>

            {/* Quick Emoji Presets Bar */}
            {showEmojiPicker && (
              <div className="mt-3 p-2 bg-[#0b141a] rounded-xl border border-[#202c33] flex items-center justify-center gap-1.5 flex-wrap max-w-xs animate-fade-in">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="w-7 h-7 rounded-lg bg-[#202c33] hover:bg-[#25d366]/20 hover:scale-110 flex items-center justify-center text-sm transition cursor-pointer"
                    title={`Set ${emoji} as icon`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">
                Participants ({selectedGroup.participants?.length || 0})
              </h4>
              {!isAdding && availableFriends.length > 0 && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-semibold text-[#25d366] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <IoPersonAddOutline size={14} />
                  <span>Add Friends</span>
                </button>
              )}
            </div>

            {/* Inline Add Members Area */}
            {isAdding && (
              <div className="mb-3 p-3 bg-[#0b141a] rounded-xl border border-[#25d366]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#25d366]">
                    Select friends to add:
                  </span>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setSelectedToAdd([]);
                    }}
                    className="text-[11px] text-[#8696a0] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1">
                  {availableFriends.map((friend) => {
                    const isSelected = selectedToAdd.includes(friend._id);
                    return (
                      <div
                        key={friend._id}
                        onClick={() => toggleSelectFriend(friend._id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? "bg-[#25d366]/15 border border-[#25d366]/30"
                            : "hover:bg-[#202c33]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={getAvatarUrl(friend)}
                            alt={friend.fullName}
                            className="w-7 h-7 rounded-full object-cover"
                            onError={(e) => handleImageError(e, friend.fullName)}
                          />
                          <span className="text-xs text-gray-200 truncate">
                            {friend.fullName}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition ${
                            isSelected
                              ? "bg-[#25d366] text-[#0b141a]"
                              : "border border-gray-500"
                          }`}
                        >
                          {isSelected && <IoCheckmark size={12} />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  disabled={loading || selectedToAdd.length === 0}
                  onClick={handleAddMembers}
                  className="w-full py-1.5 bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] font-bold text-xs rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Adding..." : `Add ${selectedToAdd.length} Friend(s)`}
                </button>
              </div>
            )}

            {/* Existing Participants */}
            <div className="space-y-1.5 divide-y divide-[#202c33]/40">
              {(selectedGroup.participants || []).map((participant) => {
                const pId = participant._id || participant;
                const isMe = String(authUser?._id) === String(pId);
                const isAdmin = String(adminId) === String(pId);

                return (
                  <div
                    key={pId}
                    className="flex items-center justify-between pt-1.5 pb-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={getAvatarUrl(participant)}
                        alt={participant.fullName || "Member"}
                        className="w-8 h-8 rounded-full object-cover border border-[#202c33]"
                        onError={(e) =>
                          handleImageError(e, participant.fullName || "Member")
                        }
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-200 truncate flex items-center gap-1.5">
                          <span>{participant.fullName || "Member"}</span>
                          {isMe && (
                            <span className="text-[10px] text-[#25d366] bg-[#103629] px-1 py-0.1 rounded font-bold">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#8696a0] truncate">
                          @{participant.username || "user"}
                        </p>
                      </div>
                    </div>

                    {isAdmin && (
                      <span className="text-[10px] font-bold text-[#25d366] bg-[#103629] px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#25d366]/30">
                        <IoShieldCheckmark size={11} />
                        <span>Admin</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between shrink-0">
          <button
            onClick={handleLeaveGroup}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded transition hover:bg-red-500/10 cursor-pointer"
          >
            <IoLogOutOutline size={16} />
            <span>Leave Group</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white transition cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;
