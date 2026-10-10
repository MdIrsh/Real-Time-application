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

// Authentic Instagram Reels across categories with real shortcodes and creators
const INITIAL_DEMO_REELS = [
  {
    shortcode: "Dd_qYUyhZDF",
    creatorName: "virat.kohli",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ViratKohli",
    videoUrl: "https://www.instagram.com/reel/Dd_qYUyhZDF/",
    audioUrl: "",
    caption: "Focused, relentless and pushing every single day 💪🏏 #viratkohli #training #cricket #discipline",
    musicTitle: "Original Audio • virat.kohli 👑",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=CricketAudio",
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
    videoUrl: "https://www.instagram.com/reel/C-U1J5qPZ8B/",
    audioUrl: "",
    caption: "Chalo masti shuru karte hain! 💖✨ Aap sab ready ho? #shraddhakapoor #reels #trending",
    musicTitle: "Trending Reel Sound • Instagram ✨",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=ShraddhaSong",
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
    videoUrl: "https://www.instagram.com/reel/C5b6P-hI_p3/",
    audioUrl: "",
    caption: "Thala entry madness! The decibel levels at Chepauk Stadium 🦁💛 #dhoni #thala #csk #ipl",
    musicTitle: "Whistle Podu Anthem • CSK 🦁",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=WhistlePodu",
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
    videoUrl: "https://www.instagram.com/reel/CGm_n80h72y/",
    audioUrl: "",
    caption: "Raw acoustic unplugged piano vibes 🎹❤️ A feeling of peaceful nostalgia. #arijitsingh #soulful #music",
    musicTitle: "Acoustic Piano Session • Arijit Singh 🎵",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=ArijitPiano",
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
    videoUrl: "https://www.instagram.com/reel/C7v78R-t6vX/",
    audioUrl: "",
    caption: "Toh kaise hain aap log? 😂🔥 Har ek baat pe itna drama! #carryminati #comedy #funny #desi",
    musicTitle: "Carry Comedy Audio • CarryMinati 😂",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=CarryLaugh",
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
    videoUrl: "https://www.instagram.com/reel/DA5q8s1N-xS/",
    audioUrl: "",
    caption: "Yeh crazy gadget dekh ke hosh ud jayenge! 📱🚀 Extreme testing with full energy! #techburner #gadgets #tech",
    musicTitle: "Tech Burner BGM • Shlok Srivastava ⚡",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=TechBgm",
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
    videoUrl: "https://www.instagram.com/reel/DAr0-4_P7iJ/",
    audioUrl: "",
    caption: "Latest Bollywood banger on loop across India! 🎶🕺 Tag your dance partner. #tseries #bollywooddance #viral",
    musicTitle: "Bollywood Trending Beats • T-Series 🎶",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=TseriesHit",
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
    videoUrl: "https://www.instagram.com/reel/C6E76-XN44H/",
    audioUrl: "",
    caption: "Rohit Sharma & the boys celebrate in style 🇮🇳🏆 Pure emotion for a billion fans! #teamindia #bcci #cricket",
    musicTitle: "Lehra Do Anthem • Team India 🇮🇳",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=IndiaVictory",
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
    shortcode: "Cp1W4YlD0uU",
    creatorName: "arijitsingh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ArijitSingh",
    videoUrl: "https://www.instagram.com/reel/Cp1W4YlD0uU/",
    audioUrl: "",
    caption: "Thank you for singing your hearts out! 50,000 voices under one sky ✨🎤 #arijitsinghlive #concert #magic",
    musicTitle: "Live Concert Chorus • Arijit Singh 🌟",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=LiveConcert",
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
  {
    shortcode: "C85_x_eI93J",
    creatorName: "ashishchanchlani",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AshishChanchlani",
    videoUrl: "https://www.instagram.com/reel/C85_x_eI93J/",
    audioUrl: "",
    caption: "Shaadi me rishtedaaron ke questions are unbearable 😂🤦‍♂️ Kisko relate hua? #ashishchanchlani #comedy #relatable",
    musicTitle: "ACV Funny Sound • Ashish Chanchlani 🤣",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=AshishLaugh",
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
    shortcode: "DA-rP0-v9eB",
    creatorName: "tech_insider",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TechInsider",
    videoUrl: "https://www.instagram.com/reel/DA-rP0-v9eB/",
    audioUrl: "",
    caption: "Mind-blowing AI and humanoid robotics tech breakthrough in 2026! 🤖💡 #future #technology #ai #robots",
    musicTitle: "Cyberpunk Future Synth • Tech Audio ⚡",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=FutureAi",
    category: "tech",
    likes: [],
    comments: [
      {
        userName: "ai_researcher",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AiScientist",
        text: "The future is arriving way faster than expected! 🤯",
        createdAt: new Date(),
      },
    ],
    sharesCount: 110000,
  },
  {
    shortcode: "DBa1u-P8z5Y",
    creatorName: "teamnaach",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=TeamNaach",
    videoUrl: "https://www.instagram.com/reel/DBa1u-P8z5Y/",
    audioUrl: "",
    caption: "Desi Dhol and Bollywood energetic steps! Full energy wedding vibe 🔥💃 #teamnaach #dancechoreography #sangeet",
    musicTitle: "Dhol Beats & Bollywood Mashup • Team Naach 🥁",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=NaachDance",
    category: "trending",
    likes: [],
    comments: [
      {
        userName: "desi_dancer_pooja",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=PoojaDance",
        text: "Love this choreography! Practicing for my sister's wedding 💃✨",
        createdAt: new Date(),
      },
    ],
    sharesCount: 135000,
  },
  {
    shortcode: "DA-R9J4JvH6",
    creatorName: "royalchallengersbangalore",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RCBKing",
    videoUrl: "https://www.instagram.com/reel/DA-R9J4JvH6/",
    audioUrl: "",
    caption: "Pure poetry in motion! King Kohli's iconic cover drive in slow motion 👑🏏 #rcb #viratkohli #chinnaswamy #cricket",
    musicTitle: "Play Bold Anthem • RCB 🔴⚫",
    musicCover: "https://api.dicebear.com/10.x/identicon/svg?seed=RcbTheme",
    category: "cricket",
    likes: [],
    comments: [
      {
        userName: "virat_the_goat",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=GoatKohli",
        text: "That textbook follow-through! Nothing beats this drive 👑❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 380000,
  },
];

export const getAllReels = async (req, res) => {
  try {
    let userReels = await Reel.find({ author: { $exists: true, $ne: null } })
      .populate("author", "fullName username profilePhoto")
      .populate("likes", "fullName username profilePhoto")
      .populate("comments.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Seed or refresh real Instagram demo reels if missing
    const existingDemo = await Reel.find({ author: null });
    const hasInstagramReels =
      existingDemo.length >= 10 &&
      existingDemo.some((r) => Boolean(r.shortcode));

    if (!hasInstagramReels) {
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
