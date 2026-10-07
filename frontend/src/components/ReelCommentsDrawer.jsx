import React, { useState } from "react";
import { IoClose, IoSend } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { addReelComment } from "../redux/reelSlice";
import { BASE_URL } from "../config/api";
import axios from "axios";
import toast from "react-hot-toast";

const ReelCommentsDrawer = ({ reel, isOpen, onClose }) => {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const { authUser } = useSelector((store) => store.user);

  if (!isOpen || !reel) return null;

  const comments = reel.comments || [];

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${BASE_URL}/api/v1/reel/comment/${reel._id}`,
        { text: commentText.trim() },
        { withCredentials: true }
      );

      if (res.data?.comment) {
        dispatch(
          addReelComment({
            reelId: reel._id,
            comment: res.data.comment,
          })
        );
        setCommentText("");
        toast.success("Comment posted!");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full sm:max-w-md h-[65vh] sm:h-[550px] bg-[#1a1a1a] text-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 border border-white/10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#222]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">Comments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
              {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm py-12">
              <span className="text-3xl mb-2">💬</span>
              <p>No comments yet.</p>
              <p className="text-xs text-gray-500">Be the first to comment on this reel!</p>
            </div>
          ) : (
            comments.map((c, idx) => {
              const avatar =
                c.userAvatar ||
                c.user?.profilePhoto ||
                `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
                  c.userName || c.user?.username || "User"
                )}`;
              const name = c.userName || c.user?.fullName || c.user?.username || "User";

              return (
                <div key={c._id || idx} className="flex gap-3 items-start group">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
                    onError={(e) => {
                      e.target.src = "https://api.dicebear.com/10.x/personas/svg?seed=User";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-xs text-gray-200">{name}</span>
                      <span className="text-[10px] text-gray-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" }) : "Just now"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5 break-words font-normal">
                      {c.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input */}
        <form
          onSubmit={handlePostComment}
          className="p-3 border-t border-white/10 bg-[#222] flex items-center gap-2"
        >
          <img
            src={
              authUser?.profilePhoto ||
              "https://api.dicebear.com/10.x/personas/svg?seed=Me"
            }
            alt="Me"
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-white/10 text-white text-sm px-3.5 py-2 rounded-full outline-hidden border border-transparent focus:border-blue-500 placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || isSubmitting}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center justify-center text-white transition shrink-0"
          >
            <IoSend size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReelCommentsDrawer;
