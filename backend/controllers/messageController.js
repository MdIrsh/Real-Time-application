import { Conversation } from "../models/conversationMode.js";
import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message, image } = req.body;

    const sender = await User.findById(senderId).select("fullName username profilePhoto friends").lean();
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Check friendship: messaging locked unless request is accepted!
    const isFriend = sender.friends?.some(
      (fId) => fId.toString() === receiverId.toString()
    );

    if (!isFriend) {
      return res.status(403).json({
        message: "You can only send messages to accepted friends.",
        locked: true,
      });
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const isReceiverOnline = !!receiverSocketId;

    // Run lookups and message creation in parallel for maximum speed
    const [conversation, newMessage] = await Promise.all([
      Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      }),
      Message.create({
        senderId,
        receiverId,
        message,
        image,
        delivered: isReceiverOnline, // delivered if receiver is online
        seen: false, // only marked true once receiver views the chat
      }),
    ]);

    // 1. Emit Socket.IO event IMMEDIATELY to receiver (<15ms delivery)
    if (receiverSocketId) {
      const messagePayload = {
        ...newMessage.toObject(),
        sender,
      };
      io.to(receiverSocketId).emit("newMessage", messagePayload);
    }

    // 2. Respond to sender immediately so their UI confirms instantly
    res.status(201).json({
      newMessage,
    });

    // 3. Persist conversation relationship asynchronously without delaying the message
    if (!conversation) {
      await Conversation.create({
        participants: [senderId, receiverId],
        messages: [newMessage._id],
      });
    } else {
      conversation.messages.push(newMessage._id);
      await conversation.save();
    }
  } catch (error) {
    console.error("sendMessage error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getMessage = async (req, res) => {
  try {
    const receiverId = req.params.id; // user whose chat is opened
    const senderId = req.id; // me

    // Check friendship: cannot view messages of non-friends
    const currentUser = await User.findById(senderId).select("friends").lean();
    const isFriend = currentUser?.friends?.some(
      (fId) => fId.toString() === receiverId.toString()
    );

    if (!isFriend) {
      return res.status(200).json([]);
    }

    // Mark previous unread messages from this user as seen (Blue Tick)
    await Message.updateMany(
      { senderId: receiverId, receiverId: senderId, seen: false },
      { seen: true }
    );

    // Notify the sender in real-time that their messages are now seen
    const senderSocketId = getReceiverSocketId(receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { seenBy: senderId });
    }

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    return res.status(200).json(conversation?.messages || []);
  } catch (error) {
    console.error("getMessage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const senderId = req.params.id; // who sent the messages
    const receiverId = req.id; // current user who read them

    await Message.updateMany(
      { senderId, receiverId, seen: false },
      { seen: true }
    );

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", { seenBy: receiverId });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markAsSeen error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};