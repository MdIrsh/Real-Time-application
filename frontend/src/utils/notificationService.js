import { playNotificationSound } from "./notificationSound";

export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
};

let titleInterval = null;
const ORIGINAL_TITLE = "Chat App";

export const startTitleAlert = (senderName) => {
  if (typeof document === "undefined") return;
  if (titleInterval) clearInterval(titleInterval);

  let toggled = false;
  titleInterval = setInterval(() => {
    document.title = toggled
      ? `(1) 💬 Message from ${senderName}`
      : "Chat App • New Message";
    toggled = !toggled;
  }, 1200);

  const clearAlert = () => {
    if (titleInterval) {
      clearInterval(titleInterval);
      titleInterval = null;
    }
    document.title = ORIGINAL_TITLE;
    window.removeEventListener("focus", clearAlert);
    window.removeEventListener("click", clearAlert);
  };

  window.addEventListener("focus", clearAlert);
  window.addEventListener("click", clearAlert);
};

/**
 * Triggers sound, document title alert, and OS Desktop notification.
 */
export const triggerMessageNotification = ({
  senderName = "Someone",
  senderAvatar = null,
  messageText = "Sent you a message",
  isCurrentChatActive = false,
  onClick = null,
}) => {
  // 1. Play incoming message chime
  playNotificationSound();

  // 2. Alert in browser tab title if not focused or not active chat
  const isTabHidden = typeof document !== "undefined" && document.hidden;
  if (isTabHidden || !isCurrentChatActive) {
    startTitleAlert(senderName);
  }

  // 3. Desktop Native Notification (if permission is granted)
  if (isNotificationSupported() && Notification.permission === "granted") {
    // Show if tab is hidden OR user is looking at another chat
    if (isTabHidden || !isCurrentChatActive) {
      try {
        const title = `Message from ${senderName}`;
        const options = {
          body: messageText || "Sent an attachment",
          icon: senderAvatar || "/logo192.png",
          badge: "/favicon.ico",
          tag: `chat-msg-${senderName}`,
          renotify: true,
        };

        const notification = new Notification(title, options);

        notification.onclick = () => {
          window.focus();
          if (typeof onClick === "function") {
            onClick();
          }
          notification.close();
        };
      } catch (err) {
        console.log("Desktop notification error:", err);
      }
    }
  }
};
