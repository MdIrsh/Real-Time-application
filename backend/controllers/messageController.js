import { Conversation } from "../models/conversationMode.js";
import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message, image } = req.body;

    // Run lookups and message creation in parallel for maximum speed
    const [conversation, newMessage, sender] = await Promise.all([
      Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      }),
      Message.create({
        senderId,
        receiverId,
        message,
        image,
      }),
      User.findById(senderId).select("fullName username profilePhoto").lean(),
    ]);

    // 1. Emit Socket.IO event IMMEDIATELY to receiver (<15ms delivery)
    const receiverSocketId = getReceiverSocketId(receiverId);
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
    const receiverId = req.params.id;
    const senderId = req.id;
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate("messages");

    return res.status(200).json(conversation?.messages || []);
  } catch (error) {
    console.error("getMessage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};