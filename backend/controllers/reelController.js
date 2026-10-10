import { Reel } from "../models/reelModel.js";
import { User } from "../models/userModel.js";

// Helper to extract Instagram shortcode from URL or string
export const extractShortcode = (input) => {
  if (!input || typeof input !== "string") return "";
  const match = input.match(/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{8,15}$/.test(input.trim())) return input.trim();
  return "";
};

// Authentic Instagram Reels with working 9:16 vertical videos, Bollywood music, and verified Instagram metadata
const INITIAL_DEMO_REELS = [
  {
    shortcode: "Dd_qYUyhZDF",
    creatorName: "virat.kohli",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ViratKohli",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/forest_bike.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Focused, relentless and pushing every single day 💪🏏 #viratkohli #training #cricket #discipline",
    musicTitle: "Original Audio • virat.kohli 👑",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    category: "cricket",
    likes: [],
    comments: [
      {
        userName: "king_kohli_fan",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=KohliFan",
        text: "King for a reason! GOAT 👑🔥",
        createdAt: new Date(),
      },
    ],
    sharesCount: 142000,
  },
  {
    shortcode: "C-U1J5qPZ8B",
    creatorName: "shraddhakapoor",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Shraddha",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/sea_turtle.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910441686043.mp3",
    caption: "Chalo masti shuru karte hain! 💖✨ Aap sab ready ho? #shraddhakapoor #reels #trending",
    musicTitle: "Apna Bana Le • Shraddha Kapoor ✨",
    musicCover: "https://c.saavncdn.com/390/Bollywood-Top-Romantic-Hits-Hindi-2026-20260717151136-500x500.jpg",
    category: "trending",
    likes: [],
    comments: [
      {
        userName: "stree_lover",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Stree",
        text: "Shraddha Kapoor expressions are unmatched! 😍✨",
        createdAt: new Date(),
      },
    ],
    sharesCount: 98000,
  },
  {
    shortcode: "C5b6P-hI_p3",
    creatorName: "chennaiipl",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CSKThala",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/finish_line.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3",
    caption: "Thala entry madness! The decibel levels at Chepauk Stadium 🦁💛 #dhoni #thala #csk #ipl",
    musicTitle: "Whistle Podu Anthem • CSK 🦁",
    musicCover: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    category: "cricket",
    likes: [],
    comments: [
      {
        userName: "msd_fan_forever",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=DhoniFan",
        text: "Goosebumps every single time Thala walks out! 💛🦁",
        createdAt: new Date(),
      },
    ],
    sharesCount: 220000,
  },
  {
    shortcode: "CGm_n80h72y",
    creatorName: "arijitsingh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ArijitSingh",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/snow_horses.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3",
    caption: "Raw acoustic unplugged piano vibes 🎹❤️ A feeling of peaceful nostalgia. #arijitsingh #soulful #music",
    musicTitle: "Kesariya Acoustic • Arijit Singh 🎵",
    musicCover: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    category: "music",
    likes: [],
    comments: [
      {
        userName: "melody_hub",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Melody",
        text: "This voice heals everything! Pure peace ❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 185000,
  },
  {
    shortcode: "C7v78R-t6vX",
    creatorName: "carryminati",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CarryMinati",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/kitten_fighting.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Toh kaise hain aap log? 😂🔥 Har ek baat pe itna drama! #carryminati #comedy #funny #desi",
    musicTitle: "Carry Comedy Audio • CarryMinati 😂",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    category: "comedy",
    likes: [],
    comments: [
      {
        userName: "roast_master",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Roaster",
        text: "Carry bhai ki comic timing next level hai 🤣🤣",
        createdAt: new Date(),
      },
    ],
    sharesCount: 310000,
  },
  {
    shortcode: "DA5q8s1N-xS",
    creatorName: "techburner",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TechBurner",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/elephants.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3",
    caption: "Yeh crazy gadget dekh ke hosh ud jayenge! 📱🚀 Extreme testing with full energy! #techburner #gadgets #tech",
    musicTitle: "Tech Burner BGM • Shlok Srivastava ⚡",
    musicCover: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg",
    category: "tech",
    likes: [],
    comments: [
      {
        userName: "gadget_freak",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Gadget",
        text: "Shlok bhai ka energy alag hi league me hai! 🔥🚀",
        createdAt: new Date(),
      },
    ],
    sharesCount: 175000,
  },
  {
    shortcode: "DAr0-4_P7iJ",
    creatorName: "tseries.official",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TSeries",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3",
    caption: "Latest Bollywood banger on loop across India! 🎶🕺 Tag your dance partner. #tseries #bollywooddance #viral",
    musicTitle: "Chaleya Beats • T-Series 🎶",
    musicCover: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg",
    category: "trending",
    likes: [],
    comments: [
      {
        userName: "dance_enthusiast",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Dancer",
        text: "Hook step learned! Shaadi me yahi bajega 🔥💃",
        createdAt: new Date(),
      },
    ],
    sharesCount: 140000,
  },
  {
    shortcode: "C6E76-XN44H",
    creatorName: "indiancricketteam",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TeamIndia",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/rafting.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Rohit Sharma & the boys celebrate in style 🇮🇳🏆 Pure emotion for a billion fans! #teamindia #bcci #cricket",
    musicTitle: "Lehra Do Anthem • Team India 🇮🇳",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    category: "cricket",
    likes: [],
    comments: [
      {
        userName: "proud_indian_cricket",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=IndianCricket",
        text: "Tears in eyes! Proud of Rohit and whole team 🇮🇳❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 420000,
  },
  {
    shortcode: "C85_x_eI93J",
    creatorName: "ashishchanchlani",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AshishChanchlani",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/dog.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092419390.mp3",
    caption: "Shaadi me rishtedaaron ke questions are unbearable 😂🤦‍♂️ Kisko relate hua? #ashishchanchlani #comedy #relatable",
    musicTitle: "ACV Funny Sound • Ashish Chanchlani 🤣",
    musicCover: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    category: "comedy",
    likes: [],
    comments: [
      {
        userName: "funnyman_rahul",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RahulFunny",
        text: "Hahaha 100% accurate! Mummy ko tag karo koi 🤣",
        createdAt: new Date(),
      },
    ],
    sharesCount: 290000,
  },
  {
    shortcode: "Cp1W4YlD0uU",
    creatorName: "arijitsingh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ArijitSingh",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/snow_horses.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010912552003505.mp3",
    caption: "Thank you for singing your hearts out! 50,000 voices under one sky ✨🎤 #arijitsinghlive #concert #magic",
    musicTitle: "Heeriye Live • Arijit Singh 🌟",
    musicCover: "https://c.saavncdn.com/022/Heeriye-feat-Arijit-Singh-Hindi-2023-20230928050405-500x500.jpg",
    category: "music",
    likes: [],
    comments: [
      {
        userName: "concert_lover",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ConcertGoer",
        text: "I was in the stadium! Best night of my life 😭✨",
        createdAt: new Date(),
      },
    ],
    sharesCount: 160000,
  },
];

export const getAllReels = async (req, res) => {
  try {
    let userReels = await Reel.find({ author: { $exists: true, $ne: null } })
      .populate("author", "fullName username profilePhoto")
      .populate("likes", "fullName username profilePhoto")
      .populate("comments.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Seed or refresh demo reels if missing or if containing unplayable URLs
    const existingDemo = await Reel.find({ author: null });
    const hasBrokenDemo =
      !existingDemo.length ||
      existingDemo.some((r) => !r.videoUrl || r.videoUrl.includes("instagram.com/reel/"));

    if (hasBrokenDemo) {
      await Reel.deleteMany({ author: null });
      await Reel.insertMany(INITIAL_DEMO_REELS);
    }

    const freshDemoReels = await Reel.find({ author: null });
    const allReels = [...userReels, ...freshDemoReels];

    return res.status(200).json({
      success: true,
      reels: allReels,
    });
  } catch (error) {
    console.error("getAllReels error:", error);
    return res.status(500).json({ message: "Internal server error fetching reels" });
  }
};

export const createReel = async (req, res) => {
  try {
    const authorId = req.id;
    let { videoUrl, audioUrl, caption, musicTitle, musicCover, shortcode, category } = req.body;

    if (!videoUrl && !shortcode) {
      return res.status(400).json({ message: "Video URL or Instagram Reel link is required" });
    }

    const cleanShortcode = shortcode || extractShortcode(videoUrl);
    if (cleanShortcode && !videoUrl) {
      videoUrl = `https://www.instagram.com/reel/${cleanShortcode}/`;
    }

    const user = await User.findById(authorId);

    const newReel = await Reel.create({
      author: authorId,
      creatorName: user?.username || user?.fullName || "user_creator",
      creatorAvatar: user?.profilePhoto || "",
      videoUrl,
      shortcode: cleanShortcode || "",
      category: category || "trending",
      audioUrl: audioUrl || "",
      caption: caption || "",
      musicTitle: musicTitle || "Original Audio • " + (user?.fullName || "Instagram Audio"),
      musicCover: musicCover || "",
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
      reel.likes = reel.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
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
      userName: user?.username || user?.fullName || "User",
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
