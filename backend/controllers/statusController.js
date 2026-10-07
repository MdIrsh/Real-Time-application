import { Status } from "../models/statusModel.js";
import { User } from "../models/userModel.js";
import { io } from "../socket/socket.js";

// Authentic Demo Friend Statuses with songs so users immediately experience music statuses!
const INITIAL_DEMO_STATUSES = [
  {
    userName: "Pooja Sharma",
    userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=PoojaSharma",
    mediaUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    mediaType: "image",
    caption: "Sunset therapy after a long day at work 🌅☕ Peaceful vibes only! #MumbaiDiaries",
    bgColor: "#128c7e",
    song: {
      title: "Kesariya",
      artist: "Arijit Singh & Pritam (Brahmāstra)",
      audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3",
      coverUrl: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    },
    viewers: [],
    createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 mins ago
  },
  {
    userName: "Vikram Malhotra",
    userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=VikramMalhotra",
    mediaUrl: "",
    mediaType: "text",
    caption: "Har Har Mahadev! Kashi Vishwanath & Ganga Aarti trip booked with family! 🕉️✨ Can't wait! 🙏",
    bgColor: "#7b1fa2", // Royal Purple WhatsApp text status
    song: {
      title: "Apna Bana Le",
      artist: "Arijit Singh & Sachin-Jigar",
      audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910441686043.mp3",
      coverUrl: "https://c.saavncdn.com/390/Bollywood-Top-Romantic-Hits-Hindi-2026-20260717151136-500x500.jpg",
    },
    viewers: [],
    createdAt: new Date(Date.now() - 75 * 60 * 1000), // 1h 15m ago
  },
  {
    userName: "Neha Verma",
    userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=NehaVerma",
    mediaUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    caption: "Morning walk in nature 🌿🌸 Fresh air and positivity! Have a great Wednesday everyone ✨",
    bgColor: "#075e54",
    song: {
      title: "Chaleya",
      artist: "Arijit Singh, Shilpa Rao & Anirudh",
      audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3",
      coverUrl: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg",
    },
    viewers: [],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    userName: "Aman Khan",
    userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AmanKhan",
    mediaUrl: "",
    mediaType: "text",
    caption: "Adrak wali kulhad chai + thandi hawa = Ultimate Sukoon ☕🌧️ Tag your chai partner!",
    bgColor: "#c2185b", // Crimson Pink WhatsApp text status
    song: {
      title: "Tum Hi Ho",
      artist: "Arijit Singh & Mithoon (Aashiqui 2)",
      audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092419390.mp3",
      coverUrl: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    },
    viewers: [],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    userName: "Simran Kaur",
    userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=SimranKaur",
    mediaUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&auto=format&fit=crop&q=80",
    mediaType: "image",
    caption: "Desi wedding celebrations start tonight! 💃✨ Dhol, bhangra & unlimited fun! 🕺🥁",
    bgColor: "#d87b00",
    song: {
      title: "Tauba Tauba",
      artist: "Karan Aujla (Bad Newz)",
      audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
      coverUrl: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    },
    viewers: [],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
];

export const getAllStatuses = async (req, res) => {
  try {
    const currentUserId = req.id;

    // Check if demo statuses exist with songs
    const existingDemo = await Status.find({ user: null });
    if (existingDemo.length < 5 || !existingDemo[0]?.song?.title) {
      await Status.deleteMany({ user: null });
      await Status.insertMany(INITIAL_DEMO_STATUSES);
    }

    // Fetch user and contact statuses from past 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allStatuses = await Status.find({
      $or: [{ createdAt: { $gte: oneDayAgo } }, { user: null }],
    })
      .populate("user", "fullName username profilePhoto")
      .populate("viewers.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Separate My Statuses from Contact Statuses
    const myStatuses = allStatuses.filter(
      (s) => s.user && String(s.user._id || s.user) === String(currentUserId)
    );

    const otherStatuses = allStatuses.filter(
      (s) => !s.user || String(s.user._id || s.user) !== String(currentUserId)
    );

    return res.status(200).json({
      success: true,
      myStatuses,
      otherStatuses,
      allStatuses,
    });
  } catch (error) {
    console.error("getAllStatuses error:", error);
    return res.status(500).json({ message: "Failed to fetch statuses" });
  }
};

export const createStatus = async (req, res) => {
  try {
    const authorId = req.id;
    const { mediaUrl, mediaType, caption, bgColor, song } = req.body;

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!mediaUrl && !caption && !song?.audioUrl) {
      return res.status(400).json({ message: "Status must have text, media or a song" });
    }

    const newStatus = await Status.create({
      user: authorId,
      userName: user.fullName || user.username || "User",
      userAvatar: user.profilePhoto || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || (mediaUrl ? "image" : "text"),
      caption: caption || "",
      bgColor: bgColor || "#128c7e",
      song: song || {},
      viewers: [],
    });

    const populatedStatus = await Status.findById(newStatus._id).populate(
      "user",
      "fullName username profilePhoto"
    );

    try {
      io.emit("newStatus", populatedStatus);
    } catch (e) {
      console.error("Socket emit newStatus error:", e);
    }

    return res.status(201).json({
      success: true,
      status: populatedStatus,
      message: "Status published successfully!",
    });
  } catch (error) {
    console.error("createStatus error:", error);
    return res.status(500).json({ message: "Failed to create status" });
  }
};

export const viewStatus = async (req, res) => {
  try {
    const userId = req.id;
    const { statusId } = req.params;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    const alreadyViewed = status.viewers?.some(
      (v) => String(v.user) === String(userId)
    );

    if (!alreadyViewed) {
      status.viewers.push({ user: userId, viewedAt: new Date() });
      await status.save();
    }

    return res.status(200).json({
      success: true,
      viewersCount: status.viewers.length,
    });
  } catch (error) {
    console.error("viewStatus error:", error);
    return res.status(500).json({ message: "Failed to view status" });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const userId = req.id;
    const { statusId } = req.params;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    if (String(status.user) !== String(userId)) {
      return res.status(403).json({ message: "Unauthorized to delete status" });
    }

    await Status.findByIdAndDelete(statusId);

    return res.status(200).json({
      success: true,
      message: "Status deleted successfully",
    });
  } catch (error) {
    console.error("deleteStatus error:", error);
    return res.status(500).json({ message: "Failed to delete status" });
  }
};
