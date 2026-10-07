import React, { useState } from "react";
import {
  IoClose,
  IoCall,
  IoVideocam,
  IoSearchOutline,
  IoPersonAddOutline,
  IoPeople,
} from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import { useCall } from "../context/CallContext";
import { openGroupCall } from "../redux/groupCallSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";

const CallsModal = ({ isOpen, onClose, onOpenAddModal }) => {
  const [search, setSearch] = useState("");
  const { otherUsers, onlineUsers } = useSelector((store) => store.user);
  const { startCall } = useCall();
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const friends = otherUsers || [];
  const filteredFriends = friends.filter((f) =>
    (f.fullName || f.username || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleCall = (user, type) => {
    onClose();
    startCall({ user, type });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#111b21] text-[#e9edef] rounded-2xl shadow-2xl border border-[#202c33] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#103629] text-[#25d366] flex items-center justify-center">
              <IoCall size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#e9edef]">Calls & Video</h3>
              <p className="text-[11px] text-[#8696a0]">
                High-definition audio & video calls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8696a0] hover:text-white hover:bg-[#2a3942] transition"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Start Group Call Card */}
        <div className="p-3 bg-gradient-to-r from-[#103629]/80 to-[#111b21] border-b border-[#202c33] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#25d366]/20 text-[#25d366] flex items-center justify-center shrink-0 border border-[#25d366]/40 shadow-xs">
              <IoPeople size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                New Group Call Room 👥
              </h4>
              <p className="text-[10.5px] text-[#8696a0] truncate">
                Call multiple friends in a single video room
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              dispatch(
                openGroupCall({
                  roomId: `group-${Date.now().toString(36)}`,
                  callType: "video",
                  roomTitle: "Group Video Room",
                })
              );
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] font-bold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer shrink-0 shadow-md"
          >
            <span>Start</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[#202c33] shrink-0">
          <div className="relative flex items-center">
            <IoSearchOutline className="absolute left-3 text-[#8696a0] text-base" />
            <input
              type="text"
              placeholder="Search contacts to call..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#202c33] text-xs text-[#e9edef] pl-9 pr-3 py-2 rounded-lg outline-hidden border border-transparent focus:border-[#00a884] placeholder-[#8696a0]"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#202c33]/40">
          {filteredFriends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-[#202c33] text-[#8696a0] flex items-center justify-center mb-2">
                <IoCall size={22} />
              </div>
              <h4 className="text-sm font-semibold text-[#e9edef]">
                No contacts to call yet
              </h4>
              <p className="text-xs text-[#8696a0] mt-1 max-w-xs">
                Add friends using their username to start instant voice and video calls!
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAddModal) onOpenAddModal();
                }}
                className="mt-4 px-4 py-2 bg-[#00a884] hover:bg-[#02906f] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <IoPersonAddOutline size={15} />
                <span>Add Friends</span>
              </button>
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isOnline = onlineUsers?.includes(friend._id);
              return (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-2.5 hover:bg-[#202c33]/50 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={getAvatarUrl(friend)}
                        alt={friend.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-[#202c33]"
                        onError={(e) => handleImageError(e, friend.fullName)}
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-[#111b21] rounded-full" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#e9edef] truncate">
                        {friend.fullName}
                      </h4>
                      <p className="text-xs text-[#8696a0] truncate">
                        {isOnline ? (
                          <span className="text-[#25d366] font-medium">online</span>
                        ) : (
                          `@${friend.username}`
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Call Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCall(friend, "audio")}
                      className="w-9 h-9 rounded-full bg-[#103629] hover:bg-[#154636] text-[#25d366] flex items-center justify-center transition active:scale-95 shadow-sm"
                      title="Audio Call"
                    >
                      <IoCall size={18} />
                    </button>
                    <button
                      onClick={() => handleCall(friend, "video")}
                      className="w-9 h-9 rounded-full bg-[#103629] hover:bg-[#154636] text-[#25d366] flex items-center justify-center transition active:scale-95 shadow-sm"
                      title="Video Call"
                    >
                      <IoVideocam size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CallsModal;
