import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IoClose,
  IoCheckmark,
  IoSearchOutline,
  IoPeople,
  IoCamera,
} from "react-icons/io5";
import { addGroup, setSelectedGroup, setIsCreateGroupOpen } from "../redux/groupSlice";
import { setSelectedUser } from "../redux/userSlice";
import { BASE_URL } from "../config/api";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import axios from "axios";
import toast from "react-hot-toast";

const PRESET_ICONS = [
  "👥", "🚀", "🔥", "🎉", "🎓", "⚽", "🏖️", "💼", "🎮", "🍕", "🎸", "🕉️", "☕"
];

const CreateGroupModal = () => {
  const dispatch = useDispatch();
  const { isCreateGroupOpen } = useSelector((store) => store.group);
  const { otherUsers } = useSelector((store) => store.user);
  const { socket } = useSelector((store) => store.socket);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("👥");
  const [uploadedAvatar, setUploadedAvatar] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateGroupOpen) return null;

  const friends = otherUsers || [];
  const filteredFriends = friends.filter((f) =>
    (f.fullName || f.username || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const toggleSelectMember = (friendId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedAvatar(reader.result);
      toast.success("Group photo attached! 📸");
    };
    reader.readAsDataURL(file);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedMemberIds.length === 0) {
      toast.error("Please select at least 1 friend to add to the group");
      return;
    }

    try {
      setIsSubmitting(true);
      const groupAvatar = uploadedAvatar || selectedEmoji || "👥";

      const res = await axios.post(
        `${BASE_URL}/api/v1/group/create`,
        {
          name: groupName.trim(),
          description: description.trim(),
          participants: selectedMemberIds,
          groupAvatar,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.group) {
        dispatch(addGroup(res.data.group));
        // Switch active conversation to the newly created group
        dispatch(setSelectedGroup(res.data.group));
        dispatch(setSelectedUser(null));

        if (socket) {
          socket.emit("joinGroupChat", { groupId: res.data.group._id });
        }

        toast.success(`Group "${res.data.group.name}" created! 🎉`, {
          id: "group-create-toast",
        });

        // Reset & Close
        setGroupName("");
        setDescription("");
        setUploadedAvatar("");
        setSelectedMemberIds([]);
        dispatch(setIsCreateGroupOpen(false));
      }
    } catch (err) {
      console.error("Create group error:", err);
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFriends = friends.filter((f) =>
    selectedMemberIds.includes(f._id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#103629] text-[#25d366] flex items-center justify-center">
              <IoPeople size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e9edef]">Create New Group</h3>
              <p className="text-[11px] text-[#8696a0]">
                Add friends and start group chatting
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(setIsCreateGroupOpen(false))}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition"
          >
            <IoClose size={20} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col overflow-hidden">
          {/* Group Info Inputs */}
          <div className="p-4 bg-[#0b141a] border-b border-[#202c33] space-y-3 shrink-0">
            <div className="flex items-center gap-3">
              {/* Group Emoji Avatar Badge or Uploaded Photo */}
              <div className="relative shrink-0">
                <label className="w-14 h-14 rounded-full bg-[#202c33] border-2 border-[#25d366]/40 flex items-center justify-center text-2xl shrink-0 shadow-md overflow-hidden cursor-pointer block">
                  {uploadedAvatar ? (
                    <img
                      src={uploadedAvatar}
                      alt="group-dp"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{selectedEmoji}</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <label
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] rounded-full flex items-center justify-center cursor-pointer shadow border border-[#111b21] transition active:scale-95"
                  title="Upload group photo"
                >
                  <IoCamera size={11} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Group Name (e.g. Goa Trip, Dosti Adda)..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-[#202c33] text-sm text-[#e9edef] px-3.5 py-2.5 rounded-xl outline-hidden border border-[#2a3942] focus:border-[#25d366] placeholder-[#8696a0] font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Emoji Avatar Selectors */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] text-[#8696a0] shrink-0">Icon:</span>
              {PRESET_ICONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition shrink-0 cursor-pointer ${
                    selectedEmoji === emoji
                      ? "bg-[#25d366]/20 border border-[#25d366] scale-110"
                      : "bg-[#202c33] hover:bg-[#26353d]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Group Description */}
            <input
              type="text"
              placeholder="Group Description (Optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={60}
              className="w-full bg-[#202c33] text-xs text-[#e9edef] px-3 py-2 rounded-xl outline-hidden border border-[#2a3942] focus:border-[#25d366] placeholder-[#8696a0]"
            />
          </div>

          {/* Selected Member Chips */}
          {selectedFriends.length > 0 && (
            <div className="px-3 py-2 bg-[#111b21] border-b border-[#202c33] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] text-[#25d366] font-semibold shrink-0 mr-1">
                {selectedFriends.length} selected:
              </span>
              {selectedFriends.map((f) => (
                <div
                  key={f._id}
                  onClick={() => toggleSelectMember(f._id)}
                  className="flex items-center gap-1 bg-[#202c33] hover:bg-red-900/30 text-white text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition border border-white/10 shrink-0"
                >
                  <span className="truncate max-w-[80px]">{f.fullName}</span>
                  <IoClose size={13} className="text-gray-400 hover:text-red-400" />
                </div>
              ))}
            </div>
          )}

          {/* Search Friends Filter */}
          <div className="p-2.5 border-b border-[#202c33] shrink-0">
            <div className="relative flex items-center">
              <IoSearchOutline className="absolute left-3 text-[#8696a0] text-sm" />
              <input
                type="text"
                placeholder="Search friends to add..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#202c33] text-xs text-[#e9edef] pl-8 pr-3 py-2 rounded-lg outline-hidden border border-transparent focus:border-[#25d366] placeholder-[#8696a0]"
              />
            </div>
          </div>

          {/* Friends List with Checkboxes */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#202c33]/40">
            {filteredFriends.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <p>No contacts found to add.</p>
                <p className="mt-1 text-[11px] text-[#8696a0]">
                  Add friends in the Contacts tab first!
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedMemberIds.includes(friend._id);
                return (
                  <div
                    key={friend._id}
                    onClick={() => toggleSelectMember(friend._id)}
                    className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? "bg-[#25d366]/10 border border-[#25d366]/30"
                        : "hover:bg-[#202c33]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={getAvatarUrl(friend)}
                        alt={friend.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-[#202c33]"
                        onError={(e) => handleImageError(e, friend.fullName)}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-100 truncate">
                          {friend.fullName}
                        </p>
                        <p className="text-[10px] text-[#8696a0] truncate">
                          @{friend.username}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                        isSelected
                          ? "bg-[#25d366] text-[#0b141a]"
                          : "border-2 border-[#8696a0]"
                      }`}
                    >
                      {isSelected && <IoCheckmark size={14} className="font-bold" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between shrink-0">
            <span className="text-xs text-[#8696a0]">
              {selectedMemberIds.length} members selected
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => dispatch(setIsCreateGroupOpen(false))}
                className="px-3.5 py-1.5 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !groupName.trim() || selectedMemberIds.length === 0}
                className="px-4 py-2 rounded-xl bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] font-bold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? "Creating..." : "Create Group 👥"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
