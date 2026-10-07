import { Reel } from "../models/reelModel.js";
import { User } from "../models/userModel.js";

// Pre-seeded high quality vertical sample reels for instant experience
const INITIAL_DEMO_REELS = [
  {
    creatorName: "Alex Rivera",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AlexRivera",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    caption: "Golden hour glow ✨ Loving this serene evening vibe! #reels #sunset #vibes",
    musicTitle: "Golden Hour - Acoustic Sunset 🎸",
    likes: [],
    comments: [
      {
        userName: "Sophia",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Sophia",
        text: "The lighting is so aesthetic! 😍",
        createdAt: new Date(),
      },
      {
        userName: "Aryan",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Aryan",
        text: "Superb shots! 🔥",
        createdAt: new Date(),
      },
    ],
    sharesCount: 14,
  },
  {
    creatorName: "Maya Sharma",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=MayaSharma",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    caption: "Confidence is your superpower 💫 Stay positive always! #trending #lifestyle",
    musicTitle: "Feel Good - Indie Pop Beats 🎶",
    likes: [],
    comments: [
      {
        userName: "Kabir",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Kabir",
        text: "Inspiring reel! 👏",
        createdAt: new Date(),
      },
    ],
    sharesCount: 22,
  },
  {
    creatorName: "Cyberpunk Vibes",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CyberVibes",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    caption: "Future is now ⚡ Neon city lights & synthwave aesthetic. #cyberpunk #neon #synth",
    musicTitle: "Synthwave Dreams - Retro Electro ⚡",
    likes: [],
    comments: [
      {
        userName: "Vikram",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Vikram",
        text: "Visuals are top tier 🚀",
        createdAt: new Date(),
      },
    ],
    sharesCount: 45,
  },
];

export const getAllReels = async (req, res) => {
  try {
    let reels = await Reel.find()
      .populate("author", "fullName username profilePhoto")
      .populate("likes", "fullName username profilePhoto")
      .populate("comments.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // If database has no reels yet, seed with initial demo reels so user can watch immediately!
    if (!reels || reels.length === 0) {
      const seeded = await Reel.insertMany(INITIAL_DEMO_REELS);
      reels = seeded;
    } else {
      // Update any existing demo reels in DB with valid video & audio URLs
      for (const reel of reels) {
        if (!reel.author) {
          const match = INITIAL_DEMO_REELS.find((d) => d.creatorName === reel.creatorName);
          if (match && (!reel.audioUrl || reel.videoUrl.includes("mixkit"))) {
            reel.audioUrl = match.audioUrl;
            reel.videoUrl = match.videoUrl;
            await reel.save();
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      reels,
    });
  } catch (error) {
    console.error("getAllReels error:", error);
    return res.status(500).json({ message: "Internal server error fetching reels" });
  }
};

export const createReel = async (req, res) => {
  try {
    const authorId = req.id;
    const { videoUrl, caption, musicTitle } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: "Video is required to post a Reel" });
    }

    const user = await User.findById(authorId);

    const newReel = await Reel.create({
      author: authorId,
      creatorName: user?.fullName || user?.username || "You",
      creatorAvatar: user?.profilePhoto || "",
      videoUrl,
      caption: caption || "",
      musicTitle: musicTitle || "Original Audio - " + (user?.fullName || "User"),
      likes: [],
      comments: [],
    });

    const populatedReel = await Reel.findById(newReel._id).populate(
      "author",
      "fullName username profilePhoto"
    );

    return res.status(201).json({
      success: true,
      reel: populatedReel,
    });
  } catch (error) {
    console.error("createReel error:", error);
    return res.status(500).json({ message: "Internal server error creating reel" });
  }
};

export const toggleLikeReel = async (req, res) => {
  try {
    const userId = req.id;
    const { reelId } = req.params;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    const isLiked = reel.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (isLiked) {
      // Unlike
      reel.likes = reel.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like
      reel.likes.push(userId);
    }

    await reel.save();

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: reel.likes.length,
      likes: reel.likes,
    });
  } catch (error) {
    console.error("toggleLikeReel error:", error);
    return res.status(500).json({ message: "Internal server error liking reel" });
  }
};

export const addComment = async (req, res) => {
  try {
    const userId = req.id;
    const { reelId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text cannot be empty" });
    }

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    const user = await User.findById(userId);

    const newComment = {
      user: userId,
      userName: user?.fullName || user?.username || "User",
      userAvatar: user?.profilePhoto || "",
      text: text.trim(),
      createdAt: new Date(),
    };

    reel.comments.unshift(newComment);
    await reel.save();

    return res.status(201).json({
      success: true,
      comment: newComment,
      comments: reel.comments,
    });
  } catch (error) {
    console.error("addComment error:", error);
    return res.status(500).json({ message: "Internal server error commenting on reel" });
  }
};

export const shareReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      reelId,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    return res.status(200).json({ success: true, sharesCount: reel?.sharesCount || 1 });
  } catch (error) {
    console.error("shareReel error:", error);
    return res.status(500).json({ message: "Internal server error sharing reel" });
  }
};
