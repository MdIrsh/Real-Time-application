import { Status } from "../models/statusModel.js";
import { User } from "../models/userModel.js";
import { io } from "../socket/socket.js";

// Fetch all active statuses created by REAL registered users (past 24h)
export const getAllStatuses = async (req, res) => {
  try {
    const currentUserId = req.id;

    // Purge any lingering dummy/demo statuses so only real users appear
    await Status.deleteMany({
      $or: [
        { user: null },
        { user: { $exists: false } },
        {
          userName: {
            $in: [
              "Pooja Sharma",
              "Vikram Malhotra",
              "Neha Verma",
              "Aman Khan",
              "Simran Kaur",
            ],
          },
        },
      ],
    });

    // Fetch user and contact statuses from past 24 hours (REAL users only)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const allStatuses = await Status.find({
      user: { $ne: null, $exists: true },
      createdAt: { $gte: oneDayAgo },
    })
      .populate("user", "fullName username profilePhoto")
      .populate("viewers.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Separate My Statuses from Contact Statuses
    const myStatuses = allStatuses.filter(
      (s) => s.user && String(s.user._id || s.user) === String(currentUserId)
    );

    const otherStatuses = allStatuses.filter(
      (s) => s.user && String(s.user._id || s.user) !== String(currentUserId)
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
      (v) => String(v.user?._id || v.user) === String(userId)
    );

    const viewerUser = await User.findById(userId).select(
      "fullName username profilePhoto"
    );

    if (!alreadyViewed) {
      status.viewers.push({ user: userId, viewedAt: new Date() });
      await status.save();

      // Emit real-time statusViewed event so the status author sees who viewed instantly!
      try {
        io.emit("statusViewed", {
          statusId,
          viewer: {
            user: viewerUser,
            viewedAt: new Date(),
          },
        });
      } catch (e) {
        console.error("Socket emit statusViewed error:", e);
      }
    }

    const updatedStatus = await Status.findById(statusId).populate(
      "viewers.user",
      "fullName username profilePhoto"
    );

    return res.status(200).json({
      success: true,
      viewersCount: updatedStatus?.viewers?.length || 0,
      viewers: updatedStatus?.viewers || [],
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

    try {
      io.emit("statusDeleted", statusId);
    } catch (e) {
      console.error("Socket emit statusDeleted error:", e);
    }

    return res.status(200).json({
      success: true,
      message: "Status deleted successfully",
    });
  } catch (error) {
    console.error("deleteStatus error:", error);
    return res.status(500).json({ message: "Failed to delete status" });
  }
};
