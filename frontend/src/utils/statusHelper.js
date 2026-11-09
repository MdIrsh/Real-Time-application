/**
 * User Presence Status Helper
 * Provides deterministic active status computation & configuration
 * Strictly ensures only ONE active status is returned (Online, Away, Offline)
 */

export const STATUS_TYPES = {
  ONLINE: "Online",
  AWAY: "Away",
  OFFLINE: "Offline",
};

export const STATUS_CONFIG = {
  Online: {
    id: "Online",
    label: "Online",
    dotClass: "bg-[#25d366]",
    ringClass: "ring-[#25d366]/30",
    textClass: "text-[#25d366]",
    badgeBg: "bg-[#25d366]/15",
    color: "#25d366",
    description: "Active now",
  },
  Away: {
    id: "Away",
    label: "Away",
    dotClass: "bg-amber-400",
    ringClass: "ring-amber-400/30",
    textClass: "text-amber-400",
    badgeBg: "bg-amber-400/15",
    color: "#fbbf24",
    description: "Away / Idle",
  },
  Offline: {
    id: "Offline",
    label: "Offline",
    dotClass: "bg-gray-400",
    ringClass: "ring-gray-400/30",
    textClass: "text-[#8696a0]",
    badgeBg: "bg-gray-500/15",
    color: "#9ca3af",
    description: "Appear offline",
  },
};

export const STATUS_OPTIONS = [
  {
    id: "Online",
    label: "Online",
    color: "#25d366",
    dotClass: "bg-[#25d366]",
    textClass: "text-[#25d366]",
    badgeBg: "bg-[#25d366]/20",
    description: "Active now",
  },
  {
    id: "Away",
    label: "Away",
    color: "#fbbf24",
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    badgeBg: "bg-amber-400/20",
    description: "Away / Idle",
  },
  {
    id: "Offline",
    label: "Offline",
    color: "#9ca3af",
    dotClass: "bg-gray-400",
    textClass: "text-[#8696a0]",
    badgeBg: "bg-gray-500/20",
    description: "Appear offline",
  },
];

/**
 * Deterministically computes the single active status for any user.
 * Returns exactly one of: "Online" | "Away" | "Offline".
 */
export const getActiveUserStatus = (user, onlineUsers = [], userStatuses = {}) => {
  if (!user) return STATUS_TYPES.OFFLINE;
  if (user._id === "meta-ai") return STATUS_TYPES.ONLINE;

  const userId = user._id || user.id;
  if (!userId) return STATUS_TYPES.OFFLINE;

  // Check socket connectivity
  const isConnected = Array.isArray(onlineUsers) && onlineUsers.includes(userId);
  if (!isConnected) {
    return STATUS_TYPES.OFFLINE;
  }

  // Get user's custom chosen status
  const chosen = userStatuses?.[userId] || user.userStatus || STATUS_TYPES.ONLINE;
  if (chosen === STATUS_TYPES.OFFLINE) return STATUS_TYPES.OFFLINE;
  if (chosen === STATUS_TYPES.AWAY) return STATUS_TYPES.AWAY;
  return STATUS_TYPES.ONLINE;
};
