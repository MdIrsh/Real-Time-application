import React from "react";

export const META_AI_USER = {
  _id: "meta-ai",
  fullName: "Meta AI",
  username: "meta.ai",
  isAi: true,
  profilePhoto: "meta-ai-icon"
};

export const MetaAiRing = ({ size = "w-10 h-10" }) => (
  <div
    className={`relative ${size} rounded-full p-[2.5px] bg-gradient-to-tr from-[#0064e0] via-[#00d2ff] to-[#ff007f] flex items-center justify-center shrink-0 shadow-sm`}
    title="Meta AI"
  >
    <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-[2px]">
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#0064e0]/20 via-[#00d2ff]/20 to-[#ff007f]/20 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#0064e0] to-[#ff007f]" />
      </div>
    </div>
  </div>
);

export const getInitialMetaAiMessages = () => [
  {
    _id: "meta-ai-intro-1",
    senderId: "meta-ai",
    message: "👋 Hi! I'm Meta AI with Llama 3. Ask me anything—current affairs, coding questions, general knowledge, translations, or ideas!",
    createdAt: new Date().toISOString()
  }
];

// Comprehensive fast knowledge base for instant answers to common facts & current affairs
const getQuickKnowledge = (query) => {
  const q = query.toLowerCase();

  // Chief Minister of Bihar
  if (
    q.includes("bihar") &&
    (q.includes("cm") ||
      q.includes("chief minister") ||
      q.includes("mukhyamantri") ||
      q.includes("mukhya mantri") ||
      q.includes("mantri") ||
      q.includes("leader"))
  ) {
    return "The current Chief Minister of Bihar is **Nitish Kumar** (Janata Dal - United). He has served as the Chief Minister across multiple terms. 🇮🇳";
  }

  // Chief Minister of Uttar Pradesh (UP)
  if (
    (q.includes("uttar pradesh") || q.includes("up ") || q.includes(" up") || q.includes("u.p.")) &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri") || q.includes("mukhya mantri"))
  ) {
    return "The current Chief Minister of Uttar Pradesh is **Yogi Adityanath** (BJP), serving since March 2017. 🇮🇳";
  }

  // Chief Minister of Delhi
  if (
    q.includes("delhi") &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri") || q.includes("mukhya mantri"))
  ) {
    return "The current Chief Minister of Delhi is **Atishi** (AAP), who took office in September 2024 succeeding Arvind Kejriwal. 🇮🇳";
  }

  // Chief Minister of West Bengal
  if (
    (q.includes("bengal") || q.includes("kolkata")) &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The current Chief Minister of West Bengal is **Mamata Banerjee** (All India Trinamool Congress). 🇮🇳";
  }

  // Chief Minister of Maharashtra
  if (
    (q.includes("maharashtra") || q.includes("mumbai")) &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Maharashtra is **Eknath Shinde** (with Devendra Fadnavis & Ajit Pawar as Deputy CMs). 🇮🇳";
  }

  // Chief Minister of Rajasthan
  if (
    q.includes("rajasthan") &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Rajasthan is **Bhajan Lal Sharma** (BJP). 🇮🇳";
  }

  // Chief Minister of Madhya Pradesh
  if (
    (q.includes("madhya pradesh") || q.includes("mp ") || q.includes(" mp")) &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Madhya Pradesh is **Dr. Mohan Yadav** (BJP). 🇮🇳";
  }

  // Chief Minister of Gujarat
  if (
    q.includes("gujarat") &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Gujarat is **Bhupendra Patel** (BJP). 🇮🇳";
  }

  // Chief Minister of Punjab
  if (
    q.includes("punjab") &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Punjab is **Bhagwant Mann** (AAP). 🇮🇳";
  }

  // Chief Minister of Tamil Nadu
  if (
    (q.includes("tamil nadu") || q.includes("tamilnadu")) &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Tamil Nadu is **M. K. Stalin** (DMK). 🇮🇳";
  }

  // Chief Minister of Karnataka
  if (
    (q.includes("karnataka") || q.includes("bangalore") || q.includes("bengaluru")) &&
    (q.includes("cm") || q.includes("chief minister") || q.includes("mukhyamantri"))
  ) {
    return "The Chief Minister of Karnataka is **Siddaramaiah** (INC). 🇮🇳";
  }

  // Prime Minister of India
  if (
    q.includes("pm of india") ||
    q.includes("prime minister of india") ||
    q.includes("bharat ke pradhanmantri") ||
    q.includes("bharat ka pradhan mantri") ||
    q.includes("pradhan mantri") ||
    q.includes("pm kaun hai") ||
    q.includes("pm kon hai") ||
    q.includes("india ka pm") ||
    q.includes("india ke pm")
  ) {
    return "The current Prime Minister of India is **Narendra Modi** (Shri Narendra Damodardas Modi). He has been serving as the Prime Minister since May 2014. 🇮🇳";
  }

  // President of India
  if (
    q.includes("president of india") ||
    q.includes("bharat ke rashtrapati") ||
    q.includes("rashtrapati kaun hai") ||
    q.includes("rashtrapati kon hai") ||
    q.includes("india ke president")
  ) {
    return "The current President of India is **Smt. Droupadi Murmu**. She is the 15th President of India, serving since July 2022. 🇮🇳";
  }

  // Vice President of India
  if (
    q.includes("vice president of india") ||
    q.includes("up rashtrapati") ||
    q.includes("uprashtrapati")
  ) {
    return "The Vice President of India is **Jagdeep Dhankhar**. 🇮🇳";
  }

  // Capital of India
  if (
    q.includes("capital of india") ||
    q.includes("bharat ki rajdhani") ||
    q.includes("india ki capital")
  ) {
    return "The capital of India is **New Delhi**.";
  }

  // Capital of Bihar
  if (
    q.includes("bihar") &&
    (q.includes("capital") || q.includes("rajdhani"))
  ) {
    return "The capital of Bihar is **Patna**.";
  }

  // Capital of UP
  if (
    (q.includes("uttar pradesh") || q.includes("up ") || q.includes(" up")) &&
    (q.includes("capital") || q.includes("rajdhani"))
  ) {
    return "The capital of Uttar Pradesh is **Lucknow**.";
  }

  // Capital of Maharashtra
  if (
    q.includes("maharashtra") &&
    (q.includes("capital") || q.includes("rajdhani"))
  ) {
    return "The capital of Maharashtra is **Mumbai**.";
  }

  // CEO of Google
  if (q.includes("ceo of google") || q.includes("google ka ceo") || q.includes("google ceo")) {
    return "The CEO of Google (and Alphabet Inc.) is **Sundar Pichai**.";
  }

  // CEO of Meta / Facebook
  if (
    q.includes("ceo of meta") ||
    q.includes("meta ka ceo") ||
    q.includes("facebook ka ceo") ||
    q.includes("ceo of facebook") ||
    q.includes("meta ceo")
  ) {
    return "The founder and CEO of Meta (formerly Facebook) is **Mark Zuckerberg**.";
  }

  // CEO of Microsoft
  if (q.includes("ceo of microsoft") || q.includes("microsoft ka ceo") || q.includes("microsoft ceo")) {
    return "The Chairman and CEO of Microsoft is **Satya Nadella**.";
  }

  // CEO of Apple
  if (q.includes("ceo of apple") || q.includes("apple ka ceo") || q.includes("apple ceo")) {
    return "The CEO of Apple is **Tim Cook**.";
  }

  // CEO of Tesla / SpaceX / Twitter / X
  if (
    (q.includes("tesla") || q.includes("spacex") || q.includes("twitter") || q.includes(" x ")) &&
    (q.includes("ceo") || q.includes("owner") || q.includes("founder"))
  ) {
    return "The CEO of Tesla and SpaceX, and owner of X (Twitter), is **Elon Musk**.";
  }

  // Who are you / Meta AI identity
  if (
    q.includes("who are you") ||
    q.includes("tum kaun ho") ||
    q.includes("kya ho") ||
    q.includes("about meta ai") ||
    q.includes("aap kaun ho")
  ) {
    return "Main **Meta AI** hoon, powered by Llama 3! 🚀\nMain aapke questions ke answers dene, coding me madad karne, general knowledge, study aur creative ideas generate karne ke liye yahan hoon.";
  }

  return null;
};

// Fallback Wikipedia search for general knowledge & facts
const getWikipediaSummary = async (query) => {
  try {
    const cleanQ = query
      .replace(/[?.,!]/g, " ")
      .replace(/\b(who is the|who is|what is the|what is|tell me about|explain|who was|what are)\b/gi, "")
      .trim();

    if (!cleanQ || cleanQ.length < 3) return null;

    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleanQ
      )}&utf8=&format=json&origin=*`
    );
    const searchData = await searchRes.json();
    if (searchData?.query?.search?.length > 0) {
      const topTitle = searchData.query.search[0].title;
      const pageRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`
      );
      const pageData = await pageRes.json();
      if (pageData?.extract && !pageData.extract.includes("may refer to:")) {
        return pageData.extract;
      }
    }
  } catch (e) {
    console.warn("Wikipedia fallback error:", e);
  }
  return null;
};

export const generateAiReply = async (userPrompt) => {
  const query = userPrompt.trim().toLowerCase();

  // 1. Instant check from Quick Knowledge Base
  const quickFact = getQuickKnowledge(query);
  if (quickFact) {
    await new Promise((r) => setTimeout(r, 350));
    return quickFact;
  }

  // 2. Fetch live answer from AI API (Pollinations AI)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000); // 16s timeout

    const response = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(userPrompt)}`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      const trimmed = text ? text.trim() : "";
      if (
        trimmed &&
        trimmed !== "{}" &&
        !trimmed.startsWith("<!DOCTYPE") &&
        !trimmed.startsWith('{"error"')
      ) {
        return trimmed;
      }
    }
  } catch (err) {
    console.log("Live AI response error:", err);
  }

  // 3. Wikipedia factual lookup fallback if AI endpoint didn't respond
  try {
    const wikiText = await getWikipediaSummary(userPrompt);
    if (wikiText) {
      return `📚 **Info:**\n\n${wikiText}`;
    }
  } catch (err) {
    console.log("Wikipedia fallback error:", err);
  }

  // 4. Smart conversational fallbacks
  if (/^(hi|hello|hey|namaste|salam|kya haal|kaise ho|hlo|helo)/i.test(query)) {
    return "Hello! 😊 Main Meta AI hoon. Main aapki kya madad kar sakta hoon aaj? Aap mujhse koi bhi sawal pooch sakte hain ya coding, GK, study me help le sakte hain!";
  }

  if (query.includes("shayari") || query.includes("kavita")) {
    return "Yeh rahi aapke liye ek khoobsurat shayari ✨:\n\n*\"Manzil mile na mile yeh to mukaddar ki baat hai,*\n*Hum koshish bhi na karein yeh to galat baat hai!\"* 🌟";
  }

  if (query.includes("joke") || query.includes("chutkula")) {
    return "😂 Ek mazedaar chutkula:\n\nTeacher: 'Batao sabse tezi se udne wali cheez kya hai?'\nPappu: 'Sir, Sunday ki chhutti!' 🏃‍♂️💨";
  }

  if (query.includes("solve") || query.includes("kaise kare") || query.includes("help")) {
    return "Main zaroor help karunga! Aap apna sawal ya problem batayein, main step-by-step explain kar dunga. 👍";
  }

  // 5. Polite fallback if connection failed completely
  return `Maaf kijiye, server busy hone ke karan abhi iska live answer fetch nahi ho paya. Kripya apna internet connection check karein ya thodi der baad dobara poochhein! 🔄`;
};
