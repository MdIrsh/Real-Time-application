import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // optional for demo friend statuses
    },
    userName: {
      type: String,
      default: "Contact",
    },
    userAvatar: {
      type: String,
      default: "",
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "text"],
      default: "image",
    },
    caption: {
      type: String,
      default: "",
    },
    bgColor: {
      type: String,
      default: "#128c7e",
    },
    song: {
      title: { type: String, default: "" },
      artist: { type: String, default: "" },
      audioUrl: { type: String, default: "" },
      coverUrl: { type: String, default: "" },
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Status = mongoose.model("Status", statusSchema);
