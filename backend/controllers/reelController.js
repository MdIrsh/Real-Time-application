import { Reel } from "../models/reelModel.js";
import { User } from "../models/userModel.js";

// 12 Distinct Pure Indian Desi Reels with popular Bollywood tracks & unique videos
const INITIAL_DEMO_REELS = [
  {
    creatorName: "Rohit Vlogs (Mumbai)",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RohitMumbai",
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    caption: "Mumbai ki shaam, thandi hawa aur Marine Drive par cutting chai ☕🌅 Yeh sukoon kahin aur nahi! #mumbai #marinedrive #sukoon #kesariya",
    musicTitle: "Kesariya - Arijit Singh (Brahmāstra) 🧡",
    likes: [],
    comments: [
      {
        userName: "Aakash",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Aakash",
        text: "Marine drive ki chai is pure love! ☕❤️",
        createdAt: new Date(),
      },
      {
        userName: "Sneha",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Sneha",
        text: "Best sunset spot in India 🌅",
        createdAt: new Date(),
      },
    ],
    sharesCount: 142,
  },
  {
    creatorName: "Kashi Banaras Diaries",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=BanarasKashi",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    caption: "Banaras ki subah aur Ganga Aarti ka pavitra sukoon 🕉️✨ Har Har Mahadev! #varanasi #kashi #gangaaarti #sukoon #apnabanale",
    musicTitle: "Apna Bana Le - Arijit Singh (Bhediya) 🌸",
    likes: [],
    comments: [
      {
        userName: "Shubham",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Shubham",
        text: "Har Har Mahadev! Kashi Vishwanath ki jai 🙏✨",
        createdAt: new Date(),
      },
    ],
    sharesCount: 198,
  },
  {
    creatorName: "DJ Gurpreet Singh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=GurpreetSingh",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    caption: "Desi shaadi me Bhangra aur Punjabi Dhol ka swag alag hi hota hai! 🕺🥁 Full energy hook step! #taubatauba #karanaujla #punjabi #bhangra",
    musicTitle: "Tauba Tauba - Karan Aujla (Bad Newz) 🔥",
    likes: [],
    comments: [
      {
        userName: "Manpreet",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Manpreet",
        text: "Oye balle balle! Energy next level hai paaji! ⚡🕺",
        createdAt: new Date(),
      },
    ],
    sharesCount: 240,
  },
  {
    creatorName: "Delhi Foodie Junction",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=DelhiFoodie",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    caption: "Chandni Chowk ke famous spicy chole bhature aur garam rabdi jalebi 🍛😋 Dilwalon ki Dilli! #delhifood #streetfood #foodie #chaleya",
    musicTitle: "Chaleya - Arijit Singh & Anirudh (Jawan) ✨",
    likes: [],
    comments: [
      {
        userName: "Vikas",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Vikas",
        text: "Dilli ke chole bhature ka koi mukabla nahi! 🤤",
        createdAt: new Date(),
      },
    ],
    sharesCount: 165,
  },
  {
    creatorName: "Kashmir Paradise Vlogs",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=AanyaKashmir",
    videoUrl: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    caption: "Gar firdaus bar roo-e zameen ast... Kashmir sach me jannat hai! ❄️🏔️ Dal Lake aur baraf ka nazara. #kashmir #gulmarg #paradise #heeriye",
    musicTitle: "Heeriye - Arijit Singh & Jasleen Royal ❤️",
    likes: [],
    comments: [
      {
        userName: "Zubair",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Zubair",
        text: "Welcome to Heaven on Earth Kashmir! 🏔️❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 310,
  },
  {
    creatorName: "India Highway Drives",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=IndiaDrives",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/driver-action-recognition.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    caption: "Mumbai-Pune expressway par late night drive aur Shershaah gaane 🚗💨 Sukoon bhari raatein. #raataanlambiyan #nightdrive #longdrive",
    musicTitle: "Raataan Lambiyan - Jubin Nautiyal (Shershaah) 🌙",
    likes: [],
    comments: [
      {
        userName: "Ritik",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Ritik",
        text: "Late night drives with good music is pure therapy 🚗🎶",
        createdAt: new Date(),
      },
    ],
    sharesCount: 185,
  },
  {
    creatorName: "College Ke Din",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CollegeKeDin",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    caption: "College ke woh befikre din aur dosto ke sath backbench ki masti 🎓❤️ Tag your best school/college friends! #collegelife #dosti #yaari #tumhiho",
    musicTitle: "Tum Hi Ho - Arijit Singh (Aashiqui 2) 🎶",
    likes: [],
    comments: [
      {
        userName: "Rahul",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Rahul",
        text: "Miss those golden college days with my gang! 😭❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 220,
  },
  {
    creatorName: "Jaipur Royals Heritage",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=JaipurRoyals",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female-and-male.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    caption: "Padharo Mhare Desh! 🏰🦚 Pink City Jaipur ka shahi andaaz aur Hawa Mahal ki khoobsurti. #jaipur #rajasthan #heritage #lutgaye",
    musicTitle: "Lut Gaye - Jubin Nautiyal & Emraan Hashmi 🌹",
    likes: [],
    comments: [
      {
        userName: "Meenakshi",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Meenakshi",
        text: "Rajasthan culture is unmatched in the world! 🦚🏰",
        createdAt: new Date(),
      },
    ],
    sharesCount: 175,
  },
  {
    creatorName: "Desi Akhada Fitness",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=PahalwanFitness",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking-and-pause.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    caption: "Desi akhada, mitti aur sachhi mehnat! Haar mat maano, lagan se sab sambhav hai 💪🇮🇳 #desiakhada #fitness #hardwork #jaihind",
    musicTitle: "Zinda - Bhaag Milkha Bhaag 🔥",
    likes: [],
    comments: [
      {
        userName: "Kuldeep",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Kuldeep",
        text: "Desi diet aur mitti ki taakat! Jai Hind 🇮🇳💪",
        createdAt: new Date(),
      },
    ],
    sharesCount: 290,
  },
  {
    creatorName: "Goa Beach Sunsets",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=SunnyGoa",
    videoUrl: "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    caption: "Goa beach par golden sunset aur waves ki aawaz 🌴🌊 Zindagi jeene ka naam hai! #goa #beachvibes #travelindia #ilahi",
    musicTitle: "Ilahi - Yeh Jawaani Hai Deewani (Arijit) 🏖️",
    likes: [],
    comments: [
      {
        userName: "Karan",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Karan",
        text: "Goa trip plan ban gaya dosto ke sath! 🏖️💃",
        createdAt: new Date(),
      },
    ],
    sharesCount: 205,
  },
  {
    creatorName: "Kolkata City Of Joy",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=KolkataCity",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    caption: "Howrah bridge ki shaam aur yellow taxi ka safar 🚕💛 Kolkata is pure emotion! #kolkata #cityofjoy #howrah #kabira",
    musicTitle: "Kabira - Yeh Jawaani Hai Deewani 💛",
    likes: [],
    comments: [
      {
        userName: "Debashis",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Debashis",
        text: "Aami tomake bhalobhashi Kolkata! 💛",
        createdAt: new Date(),
      },
    ],
    sharesCount: 160,
  },
  {
    creatorName: "Desi Chai Lover",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ChaiLover",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/bottle-detection.mp4",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    caption: "Baarish ka mausam aur garam kulhad wali adrak chai ☕🌧️ Isse better sukoon kuch nahi! #chai #monsoon #baarish #desivibes",
    musicTitle: "Baarish - Half Girlfriend (Ash King) 🌧️",
    likes: [],
    comments: [
      {
        userName: "Roshni",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Roshni",
        text: "Barish + Adrak Chai = Heaven! ☕🌧️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 315,
  },
];

export const getAllReels = async (req, res) => {
  try {
    let userReels = await Reel.find({ author: { $exists: true, $ne: null } })
      .populate("author", "fullName username profilePhoto")
      .populate("likes", "fullName username profilePhoto")
      .populate("comments.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Force replace demo reels with the full 12 Indian Desi collection
    const existingDemo = await Reel.find({ author: null });
    const hasIndianCollection = existingDemo.some((r) =>
      r.caption?.includes("Marine") || r.caption?.includes("Banaras")
    );

    if (!hasIndianCollection || existingDemo.length < INITIAL_DEMO_REELS.length) {
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
