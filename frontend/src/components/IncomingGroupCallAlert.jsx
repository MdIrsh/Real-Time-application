import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoCall, IoVideocam, IoClose } from "react-icons/io5";
import { openGroupCall } from "../redux/groupCallSlice";
import { getAvatarUrl, handleImageError } from "../utils/avatar";
import {
  startIncomingRingtone,
  stopCallSounds,
  resumeAudioContext,
} from "../utils/callSounds";

const IncomingGroupCallAlert = () => {
  const { socket } = useSelector((store) => store.socket);
  const { authUser } = useSelector((store) => store.user);
  const { isGroupCallOpen } = useSelector((store) => store.groupCall);
  const [invite, setInvite] = useState(null); // { roomId, fromUser, callType, roomTitle, groupId }
  const dispatch = useDispatch();
  const isGroupCallOpenRef = useRef(isGroupCallOpen);
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    isGroupCallOpenRef.current = isGroupCallOpen;
    if (isGroupCallOpen) {
      stopCallSounds();
      setInvite(null);
    }
  }, [isGroupCallOpen]);

  useEffect(() => {
    if (!socket) return;

    const handleInvite = (data) => {
      if (!data?.roomId) return;
      // Ignore self-originated invite or if already in a group call
      const senderId = String(data.fromUser?._id || "");
      if (authUser?._id && senderId === String(authUser._id)) return;
      if (isGroupCallOpenRef.current) return;

      setInvite((prev) => {
        if (prev?.roomId === data.roomId) return prev;
        try {
          startIncomingRingtone();
        } catch (e) {}
        return data;
      });

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(() => {
        setInvite((current) => {
          if (current?.roomId === data.roomId) {
            stopCallSounds();
            return null;
          }
          return current;
        });
      }, 35000);
    };

    const handleCancelled = ({ roomId }) => {
      setInvite((current) => {
        if (!current) return null;
        if (!roomId || current.roomId === roomId) {
          stopCallSounds();
          return null;
        }
        return current;
      });
    };

    socket.on("incomingGroupCallInvite", handleInvite);
    socket.on("groupCallInviteCancelled", handleCancelled);

    return () => {
      socket.off("incomingGroupCallInvite", handleInvite);
      socket.off("groupCallInviteCancelled", handleCancelled);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [socket, authUser?._id]);

  if (!invite || isGroupCallOpen) return null;

  const isVideo = (invite.callType || "video") === "video";
  const groupLabel = invite.roomTitle
    ? `${invite.roomTitle} • ${isVideo ? "Group Video Call" : "Group Audio Call"}`
    : isVideo
    ? "Incoming Group Video Call"
    : "Incoming Group Audio Call";

  const handleJoin = () => {
    stopCallSounds();
    try {
      resumeAudioContext();
    } catch (e) {}
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dispatch(
      openGroupCall({
        roomId: invite.roomId,
        callType: invite.callType || "video",
        groupId: invite.groupId || null,
        roomTitle:
          invite.roomTitle || `${invite.fromUser?.fullName || "Group"} Call`,
      })
    );
    setInvite(null);
  };

  const handleDecline = () => {
    stopCallSounds();
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setInvite(null);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[140] w-[94%] max-w-md bg-[#111e33]/95 backdrop-blur-xl border-2 border-[#2ecc71] text-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] p-3.5 sm:p-4 flex items-center justify-between gap-3 animate-fade-in select-none">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          <img
            src={getAvatarUrl(invite.fromUser)}
            alt="caller"
            className="w-12 h-12 rounded-full object-cover border-2 border-[#2ecc71] animate-pulse"
            onError={(e) => handleImageError(e, invite.fromUser?.fullName)}
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#2ecc71] text-[#0b141a] rounded-full flex items-center justify-center shadow">
            {isVideo ? <IoVideocam size={12} /> : <IoCall size={12} />}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-bold text-white truncate">
            {invite.fromUser?.fullName || "A Friend"}
          </h4>
          <p className="text-xs text-[#2ecc71] font-semibold truncate">
            {groupLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDecline}
          className="w-10 h-10 rounded-full bg-[#e06363]/20 hover:bg-[#e06363] text-[#e06363] hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Decline"
        >
          <IoClose size={20} />
        </button>

        <button
          onClick={handleJoin}
          className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#2ecc71] hover:bg-[#27ae60] text-[#0b141a] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-[#2ecc71]/30 transition active:scale-95 cursor-pointer"
        >
          {isVideo ? <IoVideocam size={16} /> : <IoCall size={15} />}
          <span>Join</span>
        </button>
      </div>
    </div>
  );
};

export default IncomingGroupCallAlert;
