import React, { useState, useEffect } from "react";
import { MdMic, MdMicOff, MdClose, MdLock, MdOpenInBrowser, MdRefresh } from "react-icons/md";
import toast from "react-hot-toast";

const MicPermissionPrompt = () => {
  const [permissionStatus, setPermissionStatus] = useState("unknown"); // "prompt" | "denied" | "granted"
  const [isDismissed, setIsDismissed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isHttpNetworkIP, setIsHttpNetworkIP] = useState(false);

  useEffect(() => {
    // Detect if page is opened on local network IP via HTTP (which blocks mobile phone microphones)
    if (typeof window !== "undefined") {
      const isHttp =
        window.location.protocol === "http:" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1";
      setIsHttpNetworkIP(isHttp);
    }

    // Detect if page is opened inside WhatsApp or other in-app WebViews
    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    const inApp = /FBAN|FBAV|Instagram|WhatsApp|Line|wv/i.test(ua);
    setIsInAppBrowser(inApp);

    // Check localStorage cached permission
    const cachedGranted = localStorage.getItem("mic_permission_allowed");

    if (navigator?.permissions?.query) {
      navigator.permissions
        .query({ name: "microphone" })
        .then((status) => {
          setPermissionStatus(status.state);
          if (status.state === "granted") {
            localStorage.setItem("mic_permission_allowed", "true");
          }
          status.onchange = () => {
            setPermissionStatus(status.state);
            if (status.state === "granted") {
              localStorage.setItem("mic_permission_allowed", "true");
              setIsDismissed(false);
            }
          };
        })
        .catch(() => {
          setPermissionStatus(cachedGranted ? "granted" : "prompt");
        });
    } else {
      setPermissionStatus(cachedGranted ? "granted" : "prompt");
    }
  }, []);

  const requestMicPermission = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Microphone requires HTTPS or localhost!");
      return;
    }

    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after acquiring permission
      stream.getTracks().forEach((track) => track.stop());
      setPermissionStatus("granted");
      localStorage.setItem("mic_permission_allowed", "true");
      setIsDismissed(false);
      toast.success("✅ Microphone allowed! Ab audio aur video call par aawaj clear aayegi.");
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      setPermissionStatus("denied");
      setShowHelpModal(true);
      toast.error("Microphone blocked! Kripya browser me 🔒 icon se Allow karein.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <>
      {/* WhatsApp / In-App Browser Warning Banner */}
      {isInAppBrowser && (
        <div className="bg-amber-600 text-white px-3 py-2 text-xs flex items-center justify-between shadow-sm z-40 border-b border-amber-700">
          <div className="flex items-center gap-2">
            <MdOpenInBrowser className="text-base shrink-0 animate-pulse" />
            <span>
              <strong>WhatsApp browser detected:</strong> Audio call aur mic ke liye upar <strong>⋮ (3 dots)</strong> dabakar <strong>"Open in Chrome"</strong> karein.
            </span>
          </div>
          <button
            onClick={() => setIsInAppBrowser(false)}
            className="text-white/80 hover:text-white p-1 ml-2 shrink-0"
            title="Dismiss"
          >
            <MdClose className="text-base" />
          </button>
        </div>
      )}

      {/* Local Network IP over HTTP Warning Banner for Mobile Phones */}
      {isHttpNetworkIP && (
        <div className="bg-rose-700 text-white px-3 py-2 text-xs flex items-center justify-between shadow-sm z-50 border-b border-rose-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <MdLock className="text-base shrink-0 animate-bounce" />
            <span>
              <strong>Phone HTTP Alert:</strong> Phone browser HTTP par microphone allow nahi karta. Call & audio ke liye{" "}
              <a
                href="https://real-time-application-cyan.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-amber-200 hover:text-white"
              >
                HTTPS Version (Vercel)
              </a>{" "}
              kholein!
            </span>
          </div>
          <button
            onClick={() => setIsHttpNetworkIP(false)}
            className="text-white/80 hover:text-white p-1 ml-2 shrink-0"
            title="Dismiss"
          >
            <MdClose className="text-base" />
          </button>
        </div>
      )}

      {/* Main Microphone Permission Banner */}
      {permissionStatus !== "granted" && !isDismissed && (
        <div className="bg-gradient-to-r from-emerald-600 via-[#00a884] to-teal-600 text-white px-3 py-2 text-xs sm:text-sm flex items-center justify-between shadow-md z-30 transition-all animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            {permissionStatus === "denied" ? (
              <span className="p-1 rounded-full bg-red-500/90 text-white shrink-0">
                <MdMicOff className="text-base" />
              </span>
            ) : (
              <span className="p-1 rounded-full bg-white/20 text-white shrink-0 animate-pulse">
                <MdMic className="text-base" />
              </span>
            )}

            <div className="truncate">
              {permissionStatus === "denied" ? (
                <span>
                  <strong className="font-semibold text-amber-200">Microphone Blocked:</strong>{" "}
                  Call me aawaj ke liye browser me mic allow karein.
                </span>
              ) : (
                <span>
                  <strong className="font-semibold">Call me Aawaj ke liye:</strong>{" "}
                  Microphone permission allow karein.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {permissionStatus === "denied" ? (
              <button
                onClick={() => setShowHelpModal(true)}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-md font-semibold text-xs transition-all shadow-sm flex items-center gap-1 active:scale-95"
              >
                <MdLock className="text-xs" /> Kaise Allow Karein?
              </button>
            ) : (
              <button
                onClick={requestMicPermission}
                disabled={isRequesting}
                className="bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1 rounded-md font-bold text-xs transition-all shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <MdMic className="text-xs" />
                {isRequesting ? "Prompting..." : "Allow Mic"}
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              title="Dismiss"
            >
              <MdClose className="text-base" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill button if user dismissed banner but hasn't granted permission yet */}
      {permissionStatus !== "granted" && isDismissed && (
        <button
          onClick={permissionStatus === "denied" ? () => setShowHelpModal(true) : requestMicPermission}
          className={`fixed bottom-20 right-4 z-40 ${
            permissionStatus === "denied" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
          } text-white text-xs font-semibold px-3 py-2 rounded-full shadow-xl flex items-center gap-1.5 transition-all animate-bounce active:scale-95`}
          title="Microphone Allow Karein"
        >
          {permissionStatus === "denied" ? <MdMicOff className="text-base" /> : <MdMic className="text-base" />}
          <span>{permissionStatus === "denied" ? "Mic Blocked (Fix)" : "Allow Mic"}</span>
        </button>
      )}

      {/* Help Modal when permission is Denied */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 text-gray-800 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 p-1"
            >
              <MdClose className="text-xl" />
            </button>

            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-3">
              <MdLock />
            </div>

            <h3 className="text-lg font-bold text-center text-gray-900 mb-1">
              Microphone Kaise Allow Karein?
            </h3>
            <p className="text-xs text-center text-gray-500 mb-4">
              Microphone block hone ki wajah se call par aawaj nahi ja rahi hai. Ise 5 second me theek karein:
            </p>

            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Browser ke top address bar me <strong>🔒 (Lock icon)</strong> ya <strong>Tune icon</strong> par tap karein.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  <strong>Permissions / Site Settings</strong> me jayein aur <strong>Microphone</strong> ko <strong>"Allow"</strong> karein.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  Page ko ek baar <strong>Reload / Refresh</strong> karein. Ab aawaj perfectly aane lagegi!
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-md active:scale-95"
              >
                <MdRefresh className="text-sm" /> Page Refresh Karein
              </button>
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-xl text-xs transition-all"
              >
                Theek Hai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MicPermissionPrompt;
