import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaChrome, FaSafari } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const WhatsAppInAppModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator?.userAgent) return;

    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    const isWA = /WhatsApp/i.test(ua);
    const android = /android/i.test(ua);
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

    setIsAndroid(android);
    setIsIOS(ios);

    // Trigger popup if inside WhatsApp in-app browser
    if (isWA) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href.replace(/^https?:\/\//, "")
      : "real-time-application-cyan.vercel.app";

  // Android Chrome Intent URL: Directly launches Chrome app out of WhatsApp!
  const chromeIntentUrl = `intent://${currentUrl}#Intent;scheme=https;package=com.android.chrome;end`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1c2c35] via-[#111b21] to-[#0c1317] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-center text-white">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <IoClose className="text-xl" />
        </button>

        {/* WhatsApp Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] text-3xl mb-4 shadow-lg">
          <FaWhatsapp />
          <div className="absolute inset-0 rounded-full border border-[#25D366] animate-ping opacity-30 pointer-events-none" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1.5">
          Open in Browser for Full Calling
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed mb-5">
          WhatsApp's internal viewer blocks Camera & Mic permissions. Tap below to open directly in <b>Google Chrome</b> or <b>Safari</b> so calls work 100%!
        </p>

        {isAndroid ? (
          <a
            href={chromeIntentUrl}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all mb-3"
          >
            <FaChrome className="text-lg" />
            <span>Open in Google Chrome 🚀</span>
          </a>
        ) : isIOS ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <FaSafari className="text-base" />
              <span>How to open on iPhone:</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-normal">
              Tap the <b>Safari (🧭) icon</b> at the bottom right corner of this screen to open in Safari!
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-gray-300 mb-3">
            Tap the <b>3 dots (⋮)</b> in the top right corner and choose <b>"Open in Browser"</b>.
          </div>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-gray-400 hover:text-gray-200 transition-colors py-1"
        >
          Continue inside WhatsApp anyway
        </button>
      </div>
    </div>
  );
};

export default WhatsAppInAppModal;
