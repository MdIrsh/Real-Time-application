import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import {
  IoClose,
  IoCheckmark,
  IoTrashOutline,
  IoPersonAddOutline,
  IoPaperPlaneOutline,
  IoTimeOutline,
} from "react-icons/io5";

const FriendRequestsModal = ({ isOpen, onClose, onOpenAddModal, hookActions }) => {
  const [activeTab, setActiveTab] = useState("received"); // "received" | "sent"
  const { friendRequests } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const received = friendRequests?.received || [];
  const sent = friendRequests?.sent || [];

  const handleAccept = async (requestId) => {
    const res = await hookActions.acceptRequest(requestId);
    if (res?.success && res?.friend) {
      dispatch(setSelectedUser(res.friend));
      onClose();
    }
  };

  const handleReject = async (requestId) => {
    await hookActions.rejectRequest(requestId);
  };

  const handleCancel = async (requestId) => {
    await hookActions.cancelRequest(requestId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100">
        {/* Header */}
        <div className="bg-[#f0f2f5] px-5 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              👥
            </div>
            <div>
              <h3 className="font-bold text-[#111b21] text-base leading-tight">
                Friend Requests
              </h3>
              <p className="text-xs text-gray-500">
                Manage your connections & private chat access
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

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/60 p-1">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "received"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>Received</span>
            {received.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {received.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "sent"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>Sent Requests</span>
            {sent.length > 0 && (
              <span className="bg-gray-300 text-gray-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {sent.length}
              </span>
            )}
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
          {activeTab === "received" ? (
            received.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 text-2xl">
                  📭
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">
                  No Incoming Requests
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mb-4">
                  When someone wants to chat with you, their request will appear here for your approval.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenAddModal) onOpenAddModal();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <IoPersonAddOutline className="text-sm" />
                  <span>Find People to Connect</span>
                </button>
              </div>
            ) : (
              received.map((req) => (
                <div
                  key={req._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 hover:bg-emerald-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getAvatarUrl(req.sender)}
                      alt="sender"
                      className="w-11 h-11 rounded-full object-cover border border-gray-200"
                      onError={(e) => handleImageError(e, req.sender?.fullName)}
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {req.sender?.fullName}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        @{req.sender?.username}
                      </p>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <IoTimeOutline />
                        <span>wants to connect</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => handleAccept(req._id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95"
                      title="Accept request"
                    >
                      <IoCheckmark className="text-sm" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Decline"
                    >
                      <IoClose className="text-lg" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 text-2xl">
                <IoPaperPlaneOutline />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                No Pending Sent Requests
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                You haven't sent any requests that are waiting for acceptance.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAddModal) onOpenAddModal();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <IoPersonAddOutline className="text-sm" />
                <span>Add a Friend</span>
              </button>
            </div>
          ) : (
            sent.map((req) => (
              <div
                key={req._id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(req.receiver)}
                    alt="receiver"
                    className="w-11 h-11 rounded-full object-cover border border-gray-200"
                    onError={(e) => handleImageError(e, req.receiver?.fullName)}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {req.receiver?.fullName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      @{req.receiver?.username}
                    </p>
                    <span className="text-[10px] text-amber-600 font-medium inline-block mt-0.5">
                      Waiting for acceptance...
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(req._id)}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-200 rounded-lg transition-colors flex items-center gap-1"
                  title="Cancel request"
                >
                  <IoTrashOutline className="text-xs" />
                  <span>Cancel</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>🔒 Messages & calls remain locked until accepted.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendRequestsModal;
