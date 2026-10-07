import React, { useState } from "react";
import { IoClose, IoSend, IoCheckmarkCircle } from "react-icons/io5";
import { useSelector, useDispatch } from "react-redux";
import { incrementReelShares } from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const ShareReelModal = ({ reel, isOpen, onClose }) => {
  const { otherUsers } = useSelector((store) => store.user);
  const [sentUsers, setSentUsers] = useState({});
  const [sendingId, setSendingId] = useState(null);
  const dispatch = useDispatch();

  if (!isOpen || !reel) return null;

  const handleSendToFriend = async (friend) => {
    try {
      setSendingId(friend._id);
      const messageContent = `🎬 Watch this Reel by ${reel.creatorName || "Creator"}:\n"${reel.caption || "Trending video"}"\n\n${reel.videoUrl}`;

      await axios.post(
        `${BASE_URL}/api/v1/message/send/${friend._id}`,
        { message: messageContent },
        { withCredentials: true }
      );

      // Increment shares on backend
      await axios.put(
        `${BASE_URL}/api/v1/reel/share/${reel._id}`,
        {},
        { withCredentials: true }
      );

      dispatch(incrementReelShares({ reelId: reel._id }));
      setSentUsers((prev) => ({ ...prev, [friend._id]: true }));
      toast.success(`Shared with ${friend.fullName}! 🚀`);
    } catch (err) {
      console.error("Error sharing reel:", err);
      toast.error("Failed to share reel");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#1e1e1e] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#252525]">
          <h3 className="font-semibold text-sm">Share Reel in Chat</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Reel Preview Mini card */}
        <div className="px-4 py-2.5 bg-black/30 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-14 bg-black rounded-md overflow-hidden shrink-0 border border-white/20">
            <video
              src={reel.videoUrl}
              className="w-full h-full object-cover pointer-events-none"
              muted
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-200 truncate">
              {reel.creatorName || "Reel"}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {reel.caption || "No caption"}
            </p>
          </div>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {!otherUsers || otherUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              <p>No friends found to share with.</p>
              <p className="mt-1 text-gray-500">Add friends first in Chats!</p>
            </div>
          ) : (
            otherUsers.map((friend) => {
              const isSent = sentUsers[friend._id];
              const isPending = sendingId === friend._id;

              return (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        friend.profilePhoto ||
                        `https://api.dicebear.com/10.x/personas/svg?seed=${friend.username}`
                      }
                      alt={friend.fullName}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">
                        {friend.fullName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendToFriend(friend)}
                    disabled={isSent || isPending}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                      isSent
                        ? "bg-green-600/30 text-green-400 border border-green-500/40"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {isSent ? (
                      <>
                        <IoCheckmarkCircle size={14} /> Sent
                      </>
                    ) : isPending ? (
                      "Sending..."
                    ) : (
                      <>
                        <IoSend size={12} /> Send
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareReelModal;
