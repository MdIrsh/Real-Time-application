import { Reel } from "../models/reelModel.js";
import { User } from "../models/userModel.js";

// 8 Distinct Bollywood Trending Sample Reels with unique videos and songs
const INITIAL_DEMO_REELS = [
  {
    creatorName: "Aarav Sharma",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Aarav",
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    caption: "Kesar tera ishq hai piya... 🧡 Sunset ocean vibes with this magical track! #kesariya #arijitsingh #bollywood #sunset",
    musicTitle: "Kesariya - Arijit Singh (Brahmāstra) 🧡",
    likes: [],
    comments: [
      {
        userName: "Neha",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Neha",
        text: "Arijit Singh's voice is pure magic! 😍❤️",
        createdAt: new Date(),
      },
      {
        userName: "Sameer",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Sameer",
        text: "The visuals and song match perfectly! 🔥",
        createdAt: new Date(),
      },
    ],
    sharesCount: 38,
  },
  {
    creatorName: "Priya Patel",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Priya",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    caption: "Apna bana le piya... 🌸 Blooming aesthetic vibes! Feel the love. #apnabanale #arijitsingh #romance #aesthetic",
    musicTitle: "Apna Bana Le - Arijit Singh (Bhediya) 🌸",
    likes: [],
    comments: [
      {
        userName: "Ritu",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Ritu",
        text: "Fav song on loop forever! 💖",
        createdAt: new Date(),
      },
    ],
    sharesCount: 45,
  },
  {
    creatorName: "DJ Vicky",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=VickyDJ",
    videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    caption: "Tauba Tauba hook step on repeat! 🔥 Crank up the bass and dance! #taubatauba #karanaujla #trending #party",
    musicTitle: "Tauba Tauba - Karan Aujla (Bad Newz) 🔥",
    likes: [],
    comments: [
      {
        userName: "Aryan",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Aryan",
        text: "Energy is on another level! ⚡🕺",
        createdAt: new Date(),
      },
    ],
    sharesCount: 89,
  },
  {
    creatorName: "Simran Kaur",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Simran",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking-and-pause.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    caption: "Ishq jaisa kuch chaleya... ✨ Walking through the city lights with this banger! #chaleya #jawan #anirudh #citywalk",
    musicTitle: "Chaleya - Arijit Singh & Anirudh (Jawan) ✨",
    likes: [],
    comments: [
      {
        userName: "Kunal",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Kunal",
        text: "SRK vibes all the way! 👑",
        createdAt: new Date(),
      },
    ],
    sharesCount: 52,
  },
  {
    creatorName: "Kabir Mehra",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=KabirMehra",
    videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    caption: "Heeriye heeriye aa... ❤️ Pure soulful melody under the open sky! #heeriye #jasleenroyal #arijit #love",
    musicTitle: "Heeriye - Arijit Singh & Jasleen Royal ❤️",
    likes: [],
    comments: [
      {
        userName: "Zoya",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Zoya",
        text: "Most romantic track of the year! 🌹",
        createdAt: new Date(),
      },
    ],
    sharesCount: 74,
  },
  {
    creatorName: "Rohan Varma",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RohanNight",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/driver-action-recognition.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    caption: "Teri meri gallan ho gayi mashhoor... 🌙 Late night drive with Shershaah playlist! #raataanlambiyan #jubin #drive #night",
    musicTitle: "Raataan Lambiyan - Jubin Nautiyal (Shershaah) 🌙",
    likes: [],
    comments: [
      {
        userName: "Deepak",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Deepak",
        text: "Night drives + Raataan Lambiyan = Therapy 🚗💫",
        createdAt: new Date(),
      },
    ],
    sharesCount: 63,
  },
  {
    creatorName: "Ananya Deshmukh",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=AnanyaDesh",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    caption: "Kyunki tum hi ho... ab tum hi ho 🎶 College memories and golden days! Tag your best friends. #tumhiho #aashiqui2 #memories",
    musicTitle: "Tum Hi Ho - Arijit Singh (Aashiqui 2) 🎶",
    likes: [],
    comments: [
      {
        userName: "Pooja",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Pooja",
        text: "All time greatest Hindi song ❤️😭",
        createdAt: new Date(),
      },
    ],
    sharesCount: 88,
  },
  {
    creatorName: "Aryan Khan",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AryanKhan",
    videoUrl: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    caption: "Lut gaye hum toh pehli mulaqaat mein 🌹 Enjoying every second of life! #lutgaye #jubinnautiyal #banger #fun",
    musicTitle: "Lut Gaye - Jubin Nautiyal & Emraan Hashmi 🌹",
    likes: [],
    comments: [
      {
        userName: "Kavita",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Kavita",
        text: "Vibe is super energetic! 👏💃",
        createdAt: new Date(),
      },
    ],
    sharesCount: 95,
  },
];

export const getAllReels = async (req, res) => {
  try {
    let userReels = await Reel.find({ author: { $exists: true, $ne: null } })
      .populate("author", "fullName username profilePhoto")
      .populate("likes", "fullName username profilePhoto")
      .populate("comments.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Check if demo reels need to be refreshed to Bollywood tracks
    const existingDemo = await Reel.find({ author: null });
    const hasBollywood = existingDemo.some((r) =>
      r.musicTitle?.includes("Kesariya") || r.musicTitle?.includes("Tauba")
    );

    if (!hasBollywood || existingDemo.length < 8) {
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
    const { videoUrl, audioUrl, caption, musicTitle } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: "Video is required to post a Reel" });
    }

    const user = await User.findById(authorId);

    const newReel = await Reel.create({
      author: authorId,
      creatorName: user?.fullName || user?.username || "You",
      creatorAvatar: user?.profilePhoto || "",
      videoUrl,
      audioUrl: audioUrl || "",
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
