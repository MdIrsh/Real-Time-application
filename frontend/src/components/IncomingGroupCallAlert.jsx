import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoCall, IoClose } from "react-icons/io5";
import { openGroupCall } from "../redux/groupCallSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";

const IncomingGroupCallAlert = () => {
  const { socket } = useSelector((store) => store.socket);
  const { isGroupCallOpen } = useSelector((store) => store.groupCall);
  const [invite, setInvite] = useState(null); // { roomId, fromUser, callType }
  const dispatch = useDispatch();

  useEffect(() => {
    if (!socket) return;

    const handleInvite = (data) => {
      // Don't show invite if already in a group call
      if (isGroupCallOpen) return;
      setInvite(data);

      // Auto dismiss after 30 seconds if not answered
      setTimeout(() => {
        setInvite((current) => (current?.roomId === data.roomId ? null : current));
      }, 30000);
    };

    socket.on("incomingGroupCallInvite", handleInvite);

    return () => {
      socket.off("incomingGroupCallInvite", handleInvite);
    };
  }, [socket, isGroupCallOpen]);

  if (!invite || isGroupCallOpen) return null;

  const handleJoin = () => {
    dispatch(
      openGroupCall({
        roomId: invite.roomId,
        callType: invite.callType || "video",
        roomTitle: `${invite.fromUser?.fullName || "Friend"}'s Room`,
      })
    );
    setInvite(null);
  };

  const handleDecline = () => {
    setInvite(null);
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[130] w-[92%] max-w-md bg-[#111b21] border-2 border-[#25d366] text-white rounded-2xl shadow-2xl p-3.5 flex items-center justify-between gap-3 animate-bounce select-none">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <img
            src={getAvatarUrl(invite.fromUser)}
            alt="caller"
            className="w-12 h-12 rounded-full object-cover border border-[#25d366]"
            onError={(e) => handleImageError(e, invite.fromUser?.fullName)}
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#25d366] text-[#0b141a] rounded-full flex items-center justify-center animate-pulse">
            <IoCall size={12} />
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-gray-100 truncate">
            {invite.fromUser?.fullName || "A Friend"}
          </h4>
          <p className="text-xs text-[#25d366] font-medium truncate">
            Invited you to join Group Call 👥
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDecline}
          className="w-9 h-9 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Decline"
        >
          <IoClose size={18} />
        </button>

        <button
          onClick={handleJoin}
          className="px-3.5 py-2 rounded-xl bg-[#25d366] hover:bg-[#22c35e] text-[#0b141a] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#25d366]/30 transition active:scale-95 cursor-pointer"
        >
          <IoCall size={14} />
          <span>Join</span>
        </button>
      </div>
    </div>
  );
};

export default IncomingGroupCallAlert;
