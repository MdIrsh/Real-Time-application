import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config/api";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import { useDispatch } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import {
  IoClose,
  IoSearchSharp,
  IoPersonAddOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoChatbubblesOutline,
} from "react-icons/io5";

const AddFriendModal = ({ isOpen, onClose, hookActions }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        axios.defaults.withCredentials = true;
        const res = await axios.get(
          `${BASE_URL}/api/v1/user/search?query=${encodeURIComponent(query.trim())}`
        );
        setResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Search users error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSend = async (user) => {
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));
    const res = await hookActions.sendRequest(user._id);
    if (res?.success) {
      // Update local state to reflect sent
      setResults((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, relationship: "sent" }
            : item
        )
      );
    }
    setActionLoading((prev) => ({ ...prev, [user._id]: false }));
  };

  const handleAccept = async (user) => {
    if (!user.requestId) return;
    setActionLoading((prev) => ({ ...prev, [user._id]: true }));
    const res = await hookActions.acceptRequest(user.requestId);
    if (res?.success) {
      setResults((prev) =>
        prev.map((item) =>
          item._id === user._id
            ? { ...item, relationship: "friends" }
            : item
        )
      );
    }
    setActionLoading((prev) => ({ ...prev, [user._id]: false }));
  };

  const handleStartChat = (user) => {
    dispatch(setSelectedUser(user));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100">
        {/* Header */}
        <div className="bg-[#f0f2f5] px-5 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <IoPersonAddOutline className="text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-[#111b21] text-base leading-tight">
                Add Friend
              </h3>
              <p className="text-xs text-gray-500">
                Find anyone by username or name to send a request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Search input bar */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative flex items-center">
            <IoSearchSharp className="absolute left-3 text-gray-400 text-lg" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or name..."
              className="w-full bg-[#f0f2f5] text-sm text-[#111b21] pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/30 transition-all border border-transparent focus:border-emerald-500/50"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[240px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span>Searching users...</span>
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-xs max-w-xs text-gray-500">
                Type a username or full name above to find registered users and send friend requests.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <p className="text-sm font-medium mb-1">No user found</p>
              <p className="text-xs text-gray-400">
                Try searching with a different username or spelling.
              </p>
            </div>
          ) : (
            results.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-emerald-50/20 border border-gray-200/80 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(user)}
                    alt="avatar"
                    className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0"
                    onError={(e) => handleImageError(e, user?.fullName)}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user.fullName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {user.relationship === "friends" ? (
                    <button
                      onClick={() => handleStartChat(user)}
                      className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      title="Open Chat"
                    >
                      <IoCheckmarkCircle className="text-emerald-600 text-sm" />
                      <span>Friends</span>
                      <IoChatbubblesOutline className="text-xs ml-0.5" />
                    </button>
                  ) : user.relationship === "sent" ? (
                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-medium rounded-lg flex items-center gap-1">
                      <IoTimeOutline className="text-xs" />
                      <span>Requested</span>
                    </span>
                  ) : user.relationship === "received" ? (
                    <button
                      disabled={actionLoading[user._id]}
                      onClick={() => handleAccept(user)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <span>Accept</span>
                    </button>
                  ) : (
                    <button
                      disabled={actionLoading[user._id]}
                      onClick={() => handleSend(user)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                      <IoPersonAddOutline className="text-xs" />
                      <span>Add Friend</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>🔒 Privacy First: Zero strangers in your chat inbox.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
