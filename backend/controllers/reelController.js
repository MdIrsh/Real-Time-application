import { Reel } from "../models/reelModel.js";
import { User } from "../models/userModel.js";

// 12 Authentic Indian Bollywood Reels with 9:16 vertical videos and real Bollywood audio tracks
const INITIAL_DEMO_REELS = [
  {
    creatorName: "rohit_mumbai_vlogs",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RohitMumbai",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/sea_turtle.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3",
    caption: "Mumbai ki shaam aur Marine Drive par cutting chai ☕🌅 Yeh sukoon kahin aur nahi! Tag your sunset buddy. #mumbai #marinedrive #kesariya #sukoon #bollywood",
    musicTitle: "Kesariya • Arijit Singh & Pritam (Brahmāstra) 🧡",
    musicCover: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "aakash_travels",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Aakash",
        text: "Marine drive sunset is pure magic! 🌅☕",
        createdAt: new Date(),
      },
      {
        userName: "sneha_kapoor",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Sneha",
        text: "Kesariya on loop forever! ❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 14200,
  },
  {
    creatorName: "kashi_banaras_diaries",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=BanarasKashi",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910441686043.mp3",
    caption: "Subah-e-Banaras aur Dashashwamedh Ghat ki pavitra aarti 🕉️✨ Har Har Mahadev! Man ko adbhut shanti mil gayi. #varanasi #kashi #gangaaarti #apnabanale #spiritual",
    musicTitle: "Apna Bana Le • Arijit Singh & Sachin-Jigar (Bhediya) 🌸",
    musicCover: "https://c.saavncdn.com/390/Bollywood-Top-Romantic-Hits-Hindi-2026-20260717151136-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "shubham_singh",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Shubham",
        text: "Har Har Mahadev! Kashi Vishwanath ki jai 🙏✨",
        createdAt: new Date(),
      },
    ],
    sharesCount: 29800,
  },
  {
    creatorName: "dj_gurpreet_singh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=GurpreetSingh",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/people-detection.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Desi shaadi me Bhangra aur Punjabi Dhol ka swag alag hi hota hai! 🕺🥁 Full energy hook step! #taubatauba #karanaujla #punjabi #bhangra #viral",
    musicTitle: "Tauba Tauba • Karan Aujla (Bad Newz) 🔥",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "manpreet_kaur",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Manpreet",
        text: "Oye balle balle! Energy next level hai paaji! ⚡🕺",
        createdAt: new Date(),
      },
    ],
    sharesCount: 42100,
  },
  {
    creatorName: "delhi_foodie_junction",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=DelhiFoodie",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3",
    caption: "Chandni Chowk ke spicy chole bhature aur garam rabdi jalebi 🍛😋 Dilwalon ki Dilli ka swaad! #delhifood #streetfood #chaleya #jawan #foodie",
    musicTitle: "Chaleya • Arijit Singh, Shilpa Rao & Anirudh (Jawan) ✨",
    musicCover: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "vikas_vlogs",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Vikas",
        text: "Dilli ke chole bhature ka koi mukabla nahi! 🤤",
        createdAt: new Date(),
      },
    ],
    sharesCount: 31600,
  },
  {
    creatorName: "kashmir_paradise_vlogs",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=AanyaKashmir",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/snow_horses.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010912552003505.mp3",
    caption: "Gar firdaus bar roo-e zameen ast... Kashmir sach me jannat hai! ❄️🏔️ Gulmarg baraf aur Shikara ride. #kashmir #gulmarg #heeriye #paradise #travel",
    musicTitle: "Heeriye • Jasleen Royal & Arijit Singh ❤️",
    musicCover: "https://c.saavncdn.com/022/Heeriye-feat-Arijit-Singh-Hindi-2023-20230928050405-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "zubair_kashmiri",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Zubair",
        text: "Welcome to Heaven on Earth Kashmir! 🏔️❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 51200,
  },
  {
    creatorName: "speed_drives_india",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=IndiaDrives",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/driver-action-recognition.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141318776.mp3",
    caption: "Mumbai-Pune expressway par late night drive aur Shershaah gaane 🚗💨 Sukoon bhari hawayein. #raataanlambiyan #nightdrive #longdrive #shershaah",
    musicTitle: "Raataan Lambiyan • Jubin Nautiyal & Asees Kaur (Shershaah) 🌙",
    musicCover: "https://c.saavncdn.com/238/Shershaah-Original-Motion-Picture-Soundtrack--Hindi-2021-20210815181610-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "ritik_car_lover",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Ritik",
        text: "Late night drives with good music is pure therapy 🚗🎶",
        createdAt: new Date(),
      },
    ],
    sharesCount: 28500,
  },
  {
    creatorName: "college_ke_din",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CollegeKeDin",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/classroom.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092419390.mp3",
    caption: "College ke woh befikre din aur backbench ki dosti! 🎓❤️ Tag your best friends jinke bina zindagi adhoori hai. #collegelife #dosti #yaari #tumhiho",
    musicTitle: "Tum Hi Ho • Arijit Singh & Mithoon (Aashiqui 2) 🎶",
    musicCover: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "rahul_verma",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Rahul",
        text: "Miss those golden college days with my gang! 😭❤️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 39000,
  },
  {
    creatorName: "jaipur_royals_heritage",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=JaipurRoyals",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female-and-male.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910091194217.mp3",
    caption: "Padharo Mhare Desh! 🏰🦚 Pink City Jaipur ka shahi andaaz aur Hawa Mahal ki khoobsurti. #jaipur #rajasthan #heritage #lutgaye #culture",
    musicTitle: "Lut Gaye • Jubin Nautiyal & Emraan Hashmi 🌹",
    musicCover: "https://c.saavncdn.com/106/Emraan-Hashmi-Hits-Hindi-2026-20260905191028-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "meenakshi_rathore",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Meenakshi",
        text: "Rajasthan culture is unmatched in the world! 🦚🏰",
        createdAt: new Date(),
      },
    ],
    sharesCount: 27500,
  },
  {
    creatorName: "desi_akhada_fitness",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=PahalwanFitness",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/face-demographics-walking-and-pause.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910140012874.mp3",
    caption: "Desi akhada, mitti aur sachhi mehnat! Haar mat maano, lagan se sab sambhav hai 💪🇮🇳 #desiakhada #fitness #hardwork #jaihind #zinda",
    musicTitle: "Zinda • Shankar-Ehsaan-Loy & Siddharth (Bhaag Milkha Bhaag) 🔥",
    musicCover: "https://c.saavncdn.com/575/Bhaag-Milkha-Bhaag-Hindi-2013-20260120201340-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "kuldeep_yadav",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Kuldeep",
        text: "Desi diet aur mitti ki taakat! Jai Hind 🇮🇳💪",
        createdAt: new Date(),
      },
    ],
    sharesCount: 62000,
  },
  {
    creatorName: "kerala_gods_own_country",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=KeralaTravel",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/elephants.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910090382254.mp3",
    caption: "God's Own Country Kerala 🐘🌴 Munnar ke haseen pahad aur backwaters boat ride. Nature at its finest! #kerala #munnar #travelindia #ilahi #yjhd",
    musicTitle: "Ilahi • Arijit Singh & Pritam (YJHD) 🏖️",
    musicCover: "https://c.saavncdn.com/440/Yeh-Jawaani-Hai-Deewani-2013-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "karan_malhotra",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Karan",
        text: "Munnar is literal heaven on earth! 🌴🐘",
        createdAt: new Date(),
      },
    ],
    sharesCount: 34500,
  },
  {
    creatorName: "kolkata_city_of_joy",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=KolkataCity",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910090382398.mp3",
    caption: "Howrah bridge ki shaam aur yellow taxi ka suhana safar 🚕💛 Kolkata is pure emotion! #kolkata #cityofjoy #howrah #kabira #retro",
    musicTitle: "Kabira • Tochi Raina & Rekha Bhardwaj (YJHD) 💛",
    musicCover: "https://c.saavncdn.com/440/Yeh-Jawaani-Hai-Deewani-2013-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "debashis_roy",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Debashis",
        text: "Aami tomake bhalobhashi Kolkata! 💛",
        createdAt: new Date(),
      },
    ],
    sharesCount: 26800,
  },
  {
    creatorName: "chai_aur_baarish",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ChaiLover",
    videoUrl: "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/bottle-detection.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910440564900.mp3",
    caption: "Baarish ka mausam aur garam kulhad wali adrak chai ☕🌧️ Isse better sukoon kuch nahi! Tag your chai partner. #chai #monsoon #baarish #desivibes",
    musicTitle: "Baarish • Ash King & Shashaa Tirupati (Half Girlfriend) 🌧️",
    musicCover: "https://c.saavncdn.com/441/Half-Girlfriend-Hindi-2017-20180622-500x500.jpg",
    likes: [],
    comments: [
      {
        userName: "roshni_patil",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Roshni",
        text: "Barish + Adrak Chai = Heaven! ☕🌧️",
        createdAt: new Date(),
      },
    ],
    sharesCount: 48900,
  },
];

export const getAllReels = async (req, res) => {
  try {
    let userReels = await Reel.find({ author: { $exists: true, $ne: null } })
      .populate("author", "fullName username profilePhoto")
      .populate("likes", "fullName username profilePhoto")
      .populate("comments.user", "fullName username profilePhoto")
      .sort({ createdAt: -1 });

    // Cleanly replace old demo reels with 12 fresh Indian Bollywood reels with JioSaavn audio
    const existingDemo = await Reel.find({ author: null });
    const hasAll12 =
      existingDemo.length >= 12 &&
      existingDemo.some((r) => r.audioUrl?.includes("jiotunepreview"));

    if (!hasAll12) {
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
    const { videoUrl, audioUrl, caption, musicTitle, musicCover } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: "Video is required to post a Reel" });
    }

    const user = await User.findById(authorId);

    const newReel = await Reel.create({
      author: authorId,
      creatorName: user?.username || user?.fullName || "user_creator",
      creatorAvatar: user?.profilePhoto || "",
      videoUrl,
      audioUrl: audioUrl || "",
      caption: caption || "",
      musicTitle: musicTitle || "Original Audio • " + (user?.fullName || "User"),
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
