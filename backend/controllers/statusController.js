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

function cleanHtml(str) {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// Live song search from music library & online catalog with genuine audio previews
export const searchSongs = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(200).json({ success: true, songs: [] });
    }

    const q = query.trim();
    const songs = [];
    const seenUrls = new Set();
    const seenTitles = new Set();

    // 1. JioSaavn Autocomplete
    try {
      const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(q)}`;
      const autoRes = await fetch(autoUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (autoRes.ok) {
        const autoData = await autoRes.json();
        if (autoData.songs && autoData.songs.data) {
          for (const item of autoData.songs.data) {
            const vlink = item.more_info?.vlink;
            const title = cleanHtml(item.title);
            const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

            if (vlink && !seenUrls.has(vlink) && !seenTitles.has(normTitle)) {
              seenUrls.add(vlink);
              seenTitles.add(normTitle);
              const coverUrl = item.image
                ? item.image.replace(/50x50\.jpg|150x150\.jpg/, "500x500.jpg")
                : "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg";
              const artist = cleanHtml(item.more_info?.primary_artists || item.description || "");
              const movie = cleanHtml(item.album || "");

              songs.push({
                id: `online_${item.id}`,
                title: `${title} • ${artist} ${movie ? `(${movie})` : ""}`.trim(),
                artist: artist || "Bollywood Hits",
                movie: movie || "Bollywood",
                category: cleanHtml(item.more_info?.language || "Online Hit"),
                audioUrl: vlink,
                coverUrl,
                isOnline: true,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Autocomplete search error:", e.message);
    }

    // 2. JioSaavn Search Results (for additional songs)
    if (songs.length < 15) {
      try {
        const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&p=1&n=25&q=${encodeURIComponent(q)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.results) {
            for (const item of searchData.results) {
              const vlink = item.vlink;
              const title = cleanHtml(item.song);
              const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");

              if (vlink && !seenUrls.has(vlink) && !seenTitles.has(normTitle)) {
                seenUrls.add(vlink);
                seenTitles.add(normTitle);
                const coverUrl = item.image
                  ? item.image.replace(/50x50\.jpg|150x150\.jpg/, "500x500.jpg")
                  : "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg";
                const artist = cleanHtml(item.primary_artists || item.singers || "");
                const movie = cleanHtml(item.album || "");

                songs.push({
                  id: `online_${item.id}`,
                  title: `${title} • ${artist} ${movie ? `(${movie})` : ""}`.trim(),
                  artist: artist || "Bollywood Hits",
                  movie: movie || "Bollywood",
                  category: cleanHtml(item.language || "Online Hit"),
                  audioUrl: vlink,
                  coverUrl,
                  isOnline: true,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error("Search.getResults error:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      songs,
    });
  } catch (error) {
    console.error("searchSongs error:", error);
    return res.status(500).json({ message: "Failed to search songs" });
  }
};

// Reliable Audio Streaming Proxy:
// Solves ISP blocks, ad-blocker domain filters, and browser CORS issues for JioTune MP3 previews
export const streamAudio = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send("No audio URL provided");
    }

    const audioRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!audioRes.ok) {
      return res.status(audioRes.status).send("Failed to fetch audio stream");
    }

    res.setHeader(
      "Content-Type",
      audioRes.headers.get("content-type") || "audio/mpeg"
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    if (audioRes.headers.get("content-length")) {
      res.setHeader("Content-Length", audioRes.headers.get("content-length"));
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("streamAudio error:", error);
    return res.status(500).send("Error streaming audio");
  }
};


