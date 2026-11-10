import {Server} from "socket.io";
import http from "http";
import express from "express";
import { User } from "../models/userModel.js";
import { Group } from "../models/groupModel.js";

const app=express();

const server=http.createServer(app);
const io=new Server(server,{
  cors:{
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods:['GET', 'POST'],
    credentials: true,
  },
});
const userSocketMap = {}; // { userId: socketId }
const userStatusMap = {}; // { userId: "Online" | "Away" | "Offline" }
const groupCallRooms = {}; // { roomId: { [socketId]: { user, socketId, isMuted, isVideoOff } } }

export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return null;
  const idStr = typeof receiverId === "object" ? String(receiverId._id || receiverId) : String(receiverId);
  return userSocketMap[idStr];
};

io.on('connection', (socket) => {
  console.log('user connected', socket.id);
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    const uidStr = String(userId);
    socket.join(`user:${uidStr}`);
    userSocketMap[uidStr] = socket.id;
    if (!userStatusMap[uidStr] || userStatusMap[uidStr] === "Offline") {
      userStatusMap[uidStr] = "Online";
    }
  }
  io.emit('getOnlineUsers', Object.keys(userSocketMap));
  io.emit('getUserStatuses', userStatusMap);

  // Real-time custom user presence status (Online, Away, Offline)
  socket.on("changeUserStatus", async ({ userStatus }) => {
    try {
      const validStatuses = ["Online", "Away", "Offline"];
      if (!userStatus || !validStatuses.includes(userStatus)) return;
      const currentUserId = socket.handshake.query.userId;
      if (currentUserId && currentUserId !== "undefined") {
        userStatusMap[currentUserId] = userStatus;
        try {
          await User.findByIdAndUpdate(currentUserId, { userStatus });
        } catch (dbErr) {
          console.error("DB update status error:", dbErr);
        }
        io.emit("userStatusChanged", {
          userId: currentUserId,
          userStatus,
        });
        io.emit("getUserStatuses", userStatusMap);
      }
    } catch (err) {
      console.error("changeUserStatus socket error:", err);
    }
  });

  // WebRTC Calling Signaling Events (Locked to Accepted Friends only!)
  socket.on("callUser", async ({ userToCall, signalData, from, callType }) => {
    try {
      const callerId = from?._id || socket.handshake.query.userId;
      if (!callerId || !userToCall) {
        socket.emit("callUnavailable", { message: "Invalid call request." });
        return;
      }
      const caller = await User.findById(callerId).select("friends").lean();
      const isFriend = caller?.friends?.some(
        (fId) => fId.toString() === userToCall.toString()
      );
      if (!isFriend) {
        socket.emit("callUnavailable", {
          message: "Calling is locked. You must be accepted friends to call.",
        });
        return;
      }

      const receiverSocketId = getReceiverSocketId(userToCall);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incomingCall", {
          signal: signalData,
          from,
          callType,
        });
      } else {
        socket.emit("callUnavailable", { message: "User is currently offline." });
      }
    } catch (e) {
      console.error("callUser socket error:", e);
      socket.emit("callUnavailable", { message: "Failed to connect call." });
    }
  });

  socket.on("answerCall", ({ to, signal }) => {
    const callerSocketId = getReceiverSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callAccepted", { signal });
    }
  });

  socket.on("iceCandidate", ({ to, candidate }) => {
    const targetSocketId = getReceiverSocketId(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("iceCandidate", { candidate });
    }
  });

  socket.on("endCall", ({ to }) => {
    const targetSocketId = getReceiverSocketId(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callEnded");
    }
  });

  socket.on("rejectCall", ({ to }) => {
    const callerSocketId = getReceiverSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("callRejected");
    }
  });

  socket.on("callMediaState", ({ to, isVideoOff, isMuted }) => {
    const targetSocketId = getReceiverSocketId(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callMediaState", {
        isVideoOff: Boolean(isVideoOff),
        isMuted: Boolean(isMuted),
      });
    }
  });

  socket.on("markAsSeen", ({ senderId }) => {
    const userId = socket.handshake.query.userId;
    if (userId && senderId) {
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", { seenBy: userId });
      }
    }
  });

  socket.on("typing", ({ to, isTyping }) => {
    const receiverSocketId = getReceiverSocketId(to);
    const senderId = socket.handshake.query.userId;
    if (receiverSocketId && senderId) {
      io.to(receiverSocketId).emit("userTyping", {
        userId: senderId,
        isTyping: Boolean(isTyping),
      });
    }
  });

  // --- Group Chat Messaging Rooms ---
  socket.on("joinGroupChat", ({ groupId }) => {
    if (groupId) {
      socket.join(`group-chat-${groupId}`);
    }
  });

  socket.on("leaveGroupChat", ({ groupId }) => {
    if (groupId) {
      socket.leave(`group-chat-${groupId}`);
    }
  });

  // --- Group Call WebRTC Signaling Events ---
  socket.on("joinGroupCall", ({ roomId, user, isMuted = false, isVideoOff = false }) => {
    try {
      if (!roomId) return;
      if (!groupCallRooms[roomId]) {
        groupCallRooms[roomId] = {};
      }

      // Remove any stale socket entries for this same user in the room
      const joiningUid = user?._id ? String(user._id) : null;
      if (joiningUid) {
        for (const existingSid of Object.keys(groupCallRooms[roomId])) {
          const entry = groupCallRooms[roomId][existingSid];
          if (
            existingSid !== socket.id &&
            entry?.user?._id &&
            String(entry.user._id) === joiningUid
          ) {
            delete groupCallRooms[roomId][existingSid];
            socket.to(`group-call-${roomId}`).emit("groupCallPeerLeft", {
              socketId: existingSid,
            });
          }
        }
      }

      groupCallRooms[roomId][socket.id] = {
        user,
        socketId: socket.id,
        isMuted,
        isVideoOff,
      };

      socket.join(`group-call-${roomId}`);

      const existingPeers = Object.values(groupCallRooms[roomId]).filter(
        (p) => p.socketId !== socket.id
      );

      socket.emit("groupCallExistingPeers", {
        roomId,
        peers: existingPeers,
      });

      socket.to(`group-call-${roomId}`).emit("groupCallPeerJoined", {
        peer: {
          user,
          socketId: socket.id,
          isMuted,
          isVideoOff,
        },
      });
    } catch (err) {
      console.error("joinGroupCall error:", err);
    }
  });

  socket.on("groupCallSignal", ({ toSocketId, signal, fromUser, isOffer }) => {
    if (toSocketId) {
      io.to(toSocketId).emit("groupCallSignal", {
        fromSocketId: socket.id,
        signal,
        fromUser,
        isOffer,
      });
    }
  });

  socket.on("groupCallIceCandidate", ({ toSocketId, candidate }) => {
    if (toSocketId && candidate) {
      io.to(toSocketId).emit("groupCallIceCandidate", {
        fromSocketId: socket.id,
        candidate,
      });
    }
  });

  socket.on("groupCallMediaState", ({ roomId, isMuted, isVideoOff }) => {
    if (roomId && groupCallRooms[roomId]?.[socket.id]) {
      groupCallRooms[roomId][socket.id].isMuted = isMuted;
      groupCallRooms[roomId][socket.id].isVideoOff = isVideoOff;

      socket.to(`group-call-${roomId}`).emit("groupCallPeerMediaChanged", {
        socketId: socket.id,
        isMuted,
        isVideoOff,
      });
    }
  });

  socket.on("leaveGroupCall", ({ roomId }) => {
    try {
      if (roomId && groupCallRooms[roomId]) {
        delete groupCallRooms[roomId][socket.id];
        if (Object.keys(groupCallRooms[roomId]).length === 0) {
          delete groupCallRooms[roomId];
        }
        socket.leave(`group-call-${roomId}`);
        socket.to(`group-call-${roomId}`).emit("groupCallPeerLeft", {
          socketId: socket.id,
        });
      }
    } catch (err) {
      console.error("leaveGroupCall error:", err);
    }
  });

  socket.on("inviteToGroupCall", async ({ toUserId, toUserIds = [], roomId, fromUser, callType, roomTitle, groupId }) => {
    try {
      const callerId = String(fromUser?._id || socket.handshake.query.userId || "");
      const payload = {
        roomId,
        fromUser,
        callType: callType || "video",
        roomTitle: roomTitle || "",
        groupId: groupId || null,
      };

      const targetIds = new Set();
      if (toUserId) {
        targetIds.add(String(toUserId));
      }
      if (Array.isArray(toUserIds)) {
        toUserIds.forEach((id) => id && targetIds.add(String(id?._id || id)));
      }

      if (groupId) {
        try {
          const grp = await Group.findById(groupId).select("participants name").lean();
          if (grp) {
            if (!payload.roomTitle && grp.name) {
              payload.roomTitle = grp.name;
            }
            (grp.participants || []).forEach((pid) => {
              const idStr = String(pid?._id || pid || "");
              if (idStr && idStr !== callerId) {
                targetIds.add(idStr);
              }
            });
          }
        } catch (dbErr) {
          console.error("inviteToGroupCall DB lookup error:", dbErr);
        }
      }

      targetIds.forEach((uid) => {
        if (!uid || uid === callerId) return;
        io.to(`user:${uid}`).emit("incomingGroupCallInvite", payload);
        const receiverSocketId = getReceiverSocketId(uid);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("incomingGroupCallInvite", payload);
        }
      });

      if (groupId) {
        socket.to(`group-chat-${groupId}`).emit("incomingGroupCallInvite", payload);
      }
    } catch (err) {
      console.error("inviteToGroupCall error:", err);
    }
  });

  socket.on("cancelGroupCall", async ({ roomId, groupId, participantIds = [] }) => {
    try {
      const callerId = String(socket.handshake.query.userId || "");
      const targetIds = new Set((participantIds || []).map((id) => String(id?._id || id)));
      if (groupId) {
        try {
          const grp = await Group.findById(groupId).select("participants").lean();
          (grp?.participants || []).forEach((pid) => targetIds.add(String(pid?._id || pid)));
        } catch (e) {}
        socket.to(`group-chat-${groupId}`).emit("groupCallInviteCancelled", { roomId });
      }
      targetIds.forEach((uid) => {
        if (uid && uid !== callerId) {
          io.to(`user:${uid}`).emit("groupCallInviteCancelled", { roomId });
        }
      });
    } catch (err) {}
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    if (userId && userId !== "undefined") {
      const uidStr = String(userId);
      const activeSocketsInRoom = io.sockets.adapter.rooms.get(`user:${uidStr}`)?.size || 0;
      if (activeSocketsInRoom === 0 && userSocketMap[uidStr] === socket.id) {
        delete userSocketMap[uidStr];
        userStatusMap[uidStr] = "Offline";
        io.emit("userStatusChanged", {
          userId: uidStr,
          userStatus: "Offline",
        });
      }
    }
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
    io.emit('getUserStatuses', userStatusMap);

    // Clean up any group call rooms this socket was in
    for (const roomId in groupCallRooms) {
      if (groupCallRooms[roomId]?.[socket.id]) {
        delete groupCallRooms[roomId][socket.id];
        if (Object.keys(groupCallRooms[roomId]).length === 0) {
          delete groupCallRooms[roomId];
        } else {
          io.to(`group-call-${roomId}`).emit("groupCallPeerLeft", {
            socketId: socket.id,
          });
        }
      }
    }
  });
});

export { app, io, server }; 