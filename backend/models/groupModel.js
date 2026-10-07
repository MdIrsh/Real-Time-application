import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    groupAvatar: {
      type: String,
      default: "",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastMessage: {
      text: { type: String, default: "" },
      senderName: { type: String, default: "" },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      time: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", groupSchema);
