import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // optional so pre-seeded demo reels can display without an author
    },
    creatorName: {
      type: String,
      default: "Creator",
    },
    creatorAvatar: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    musicTitle: {
      type: String,
      default: "Original Audio - Trending Sound 🎵",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        userName: {
          type: String,
          default: "User",
        },
        userAvatar: {
          type: String,
          default: "",
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sharesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Reel = mongoose.model("Reel", reelSchema);
