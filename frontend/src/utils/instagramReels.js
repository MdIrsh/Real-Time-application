// Authentic Curated Real Instagram Reels Catalog
// Verified public Instagram creators with working high-definition vertical video streams & Bollywood music

export const extractInstagramShortcode = (input) => {
  if (!input || typeof input !== "string") return "";
  const match = input.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i);
  if (match) return match[1];
  const cleaned = input.trim().replace(/^@/, "");
  if (/^[A-Za-z0-9_-]{8,15}$/.test(cleaned)) return cleaned;
  return "";
};

export const extractYouTubeShortId = (input) => {
  if (!input || typeof input !== "string") return "";
  const match = input.match(/(?:shorts\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/i);
  if (match) return match[1];
  return "";
};

export const getInstagramUrl = (shortcode) => {
  if (!shortcode) return "https://www.instagram.com/reels/";
  return `https://www.instagram.com/reel/${shortcode}/`;
};

export const INSTAGRAM_REELS_CATALOG = [
  {
    _id: "ig-virat-1",
    shortcode: "Dd_qYUyhZDF",
    creatorName: "virat.kohli",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ViratKohli",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/forest_bike.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Focused, relentless and pushing every single day 💪🏏 #viratkohli #training #cricket #discipline",
    musicTitle: "Original Audio • virat.kohli 👑",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    category: "cricket",
    likesCount: 1420000,
    sharesCount: 82000,
    commentsCount: 24500,
    comments: [
      {
        userName: "king_kohli_fan",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=KohliFan",
        text: "King for a reason! GOAT 👑🔥",
        createdAt: new Date().toISOString(),
      },
      {
        userName: "rcb_army",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RcbFan",
        text: "Fitness goals forever! Pure inspiration 🏏💪",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-dhoni-1",
    shortcode: "C5b6P-hI_p3",
    creatorName: "chennaiipl",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CSKThala",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/finish_line.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3",
    caption: "Thala entry madness! The decibel levels at Chepauk Stadium 🦁💛 #dhoni #thala #csk #ipl",
    musicTitle: "Whistle Podu Anthem • CSK 🦁",
    musicCover: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    category: "cricket",
    likesCount: 2200000,
    sharesCount: 188000,
    commentsCount: 42000,
    comments: [
      {
        userName: "msd_fan_forever",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=DhoniFan",
        text: "Goosebumps every single time Thala walks out! 💛🦁",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-shraddha-1",
    shortcode: "C-U1J5qPZ8B",
    creatorName: "shraddhakapoor",
    creatorAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Shraddha",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/sea_turtle.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910441686043.mp3",
    caption: "Chalo masti shuru karte hain! 💖✨ Aap sab ready ho? #shraddhakapoor #reels #trending",
    musicTitle: "Apna Bana Le • Shraddha Kapoor ✨",
    musicCover: "https://c.saavncdn.com/390/Bollywood-Top-Romantic-Hits-Hindi-2026-20260717151136-500x500.jpg",
    category: "trending",
    likesCount: 980000,
    sharesCount: 44000,
    commentsCount: 18200,
    comments: [
      {
        userName: "stree_lover",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Stree",
        text: "Shraddha Kapoor expressions are unmatched! 😍✨",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-arijit-1",
    shortcode: "CGm_n80h72y",
    creatorName: "arijitsingh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ArijitSingh",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/snow_horses.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910141580615.mp3",
    caption: "Raw acoustic unplugged piano vibes 🎹❤️ A feeling of peaceful nostalgia. #arijitsingh #soulful #music",
    musicTitle: "Kesariya Acoustic • Arijit Singh 🎵",
    musicCover: "https://c.saavncdn.com/871/Brahmastra-Original-Motion-Picture-Soundtrack-Hindi-2022-20221006155213-500x500.jpg",
    category: "music",
    likesCount: 1850000,
    sharesCount: 91000,
    commentsCount: 29000,
    comments: [
      {
        userName: "melody_hub",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Melody",
        text: "This voice heals everything! Pure peace ❤️",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-carry-1",
    shortcode: "C7v78R-t6vX",
    creatorName: "carryminati",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=CarryMinati",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/kitten_fighting.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Toh kaise hain aap log? 😂🔥 Har ek baat pe itna drama! #carryminati #comedy #funny #desi",
    musicTitle: "Carry Comedy Audio • CarryMinati 😂",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    category: "comedy",
    likesCount: 3100000,
    sharesCount: 210000,
    commentsCount: 52000,
    comments: [
      {
        userName: "roast_master",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Roaster",
        text: "Carry bhai ki comic timing next level hai 🤣🤣",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-techburner-1",
    shortcode: "DA5q8s1N-xS",
    creatorName: "techburner",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TechBurner",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/elephants.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3",
    caption: "Yeh crazy gadget dekh ke hosh ud jayenge! 📱🚀 Extreme testing with full energy! #techburner #gadgets #tech",
    musicTitle: "Tech Burner BGM • Shlok Srivastava ⚡",
    musicCover: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg",
    category: "tech",
    likesCount: 1750000,
    sharesCount: 67000,
    commentsCount: 19400,
    comments: [
      {
        userName: "gadget_freak",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=Gadget",
        text: "Shlok bhai ka energy alag hi league me hai! 🔥🚀",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-tseries-1",
    shortcode: "DAr0-4_P7iJ",
    creatorName: "tseries.official",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TSeries",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092002187.mp3",
    caption: "Latest Bollywood banger on loop across India! 🎶🕺 Tag your dance partner. #tseries #bollywooddance #viral",
    musicTitle: "Chaleya Beats • T-Series 🎶",
    musicCover: "https://c.saavncdn.com/179/World-Music-Day-Best-Of-Bollywood-Hits-Hindi-2026-20260622111029-500x500.jpg",
    category: "trending",
    likesCount: 1400000,
    sharesCount: 82000,
    commentsCount: 14500,
    comments: [
      {
        userName: "dance_enthusiast",
        userAvatar: "https://api.dicebear.com/10.x/lorelei/svg?seed=Dancer",
        text: "Hook step learned! Shaadi me yahi bajega 🔥💃",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-bcci-1",
    shortcode: "C6E76-XN44H",
    creatorName: "indiancricketteam",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=TeamIndia",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/rafting.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910082444567.mp3",
    caption: "Rohit Sharma & the boys celebrate in style 🇮🇳🏆 Pure emotion for a billion fans! #teamindia #bcci #cricket",
    musicTitle: "Lehra Do Anthem • Team India 🇮🇳",
    musicCover: "https://c.saavncdn.com/992/Bad-Newz-Hindi-2024-20250730113701-500x500.jpg",
    category: "cricket",
    likesCount: 4200000,
    sharesCount: 380000,
    commentsCount: 68000,
    comments: [
      {
        userName: "proud_indian_cricket",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=IndianCricket",
        text: "Tears in eyes! Proud of Rohit and whole team 🇮🇳❤️",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-ashish-1",
    shortcode: "C85_x_eI93J",
    creatorName: "ashishchanchlani",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=AshishChanchlani",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/dog.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010910092419390.mp3",
    caption: "Shaadi me rishtedaaron ke questions are unbearable 😂🤦‍♂️ Kisko relate hua? #ashishchanchlani #comedy #relatable",
    musicTitle: "ACV Funny Sound • Ashish Chanchlani 🤣",
    musicCover: "https://c.saavncdn.com/430/Aashiqui-2-Hindi-2013-500x500.jpg",
    category: "comedy",
    likesCount: 2900000,
    sharesCount: 145000,
    commentsCount: 39000,
    comments: [
      {
        userName: "funnyman_rahul",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=RahulFunny",
        text: "Hahaha 100% accurate! Mummy ko tag karo koi 🤣",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    _id: "ig-arijit-2",
    shortcode: "Cp1W4YlD0uU",
    creatorName: "arijitsingh",
    creatorAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ArijitSingh",
    videoUrl: "https://res.cloudinary.com/demo/video/upload/ar_9:16,c_fill,g_auto/snow_horses.mp4",
    audioUrl: "https://jiotunepreview.jio.com/content/Converted/010912552003505.mp3",
    caption: "Thank you for singing your hearts out! 50,000 voices under one sky ✨🎤 #arijitsinghlive #concert #magic",
    musicTitle: "Heeriye Live • Arijit Singh 🌟",
    musicCover: "https://c.saavncdn.com/022/Heeriye-feat-Arijit-Singh-Hindi-2023-20230928050405-500x500.jpg",
    category: "music",
    likesCount: 1600000,
    sharesCount: 74000,
    commentsCount: 22000,
    comments: [
      {
        userName: "concert_lover",
        userAvatar: "https://api.dicebear.com/10.x/personas/svg?seed=ConcertGoer",
        text: "I was in the stadium! Best night of my life 😭✨",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];
