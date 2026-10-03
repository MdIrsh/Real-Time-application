import {Server} from "socket.io";
import http from "http";
import express from "express";

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

export const getReceiverSocketId = (receiverId) => {
  if (!receiverId) return null;
  const idStr = typeof receiverId === "object" ? String(receiverId._id || receiverId) : String(receiverId);
  return userSocketMap[idStr];
};

io.on('connection', (socket) => {
  console.log('user connected', socket.id);
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  // WebRTC Calling Signaling Events
  socket.on("callUser", ({ userToCall, signalData, from, callType }) => {
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

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

export { app, io, server }; 