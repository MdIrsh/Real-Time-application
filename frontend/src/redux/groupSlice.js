import { createSlice } from "@reduxjs/toolkit";

const groupSlice = createSlice({
  name: "group",
  initialState: {
    groups: [],
    selectedGroup: null,
    groupMessages: [],
    groupUnreadCounts: {}, // { [groupId]: number }
    isCreateGroupOpen: false,
    loading: false,
  },
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload || [];
    },
    addGroup: (state, action) => {
      if (action.payload) {
        state.groups = [
          action.payload,
          ...state.groups.filter((g) => g._id !== action.payload._id),
        ];
      }
    },
    setSelectedGroup: (state, action) => {
      state.selectedGroup = action.payload;
      if (action.payload?._id) {
        if (!state.groupUnreadCounts) state.groupUnreadCounts = {};
        state.groupUnreadCounts[action.payload._id] = 0;
      }
    },
    incrementGroupUnreadCount: (state, action) => {
      const groupId = action.payload;
      if (!groupId) return;
      if (!state.groupUnreadCounts) state.groupUnreadCounts = {};
      state.groupUnreadCounts[groupId] = (state.groupUnreadCounts[groupId] || 0) + 1;
    },
    clearGroupUnreadCount: (state, action) => {
      const groupId = action.payload;
      if (!groupId) return;
      if (!state.groupUnreadCounts) state.groupUnreadCounts = {};
      state.groupUnreadCounts[groupId] = 0;
    },
    setGroupMessages: (state, action) => {
      state.groupMessages = action.payload || [];
    },
    addGroupMessage: (state, action) => {
      const msg = action.payload;
      if (!msg) return;

      // If message belongs to currently open group, append to active messages
      if (
        state.selectedGroup &&
        (msg.groupId?._id || msg.groupId) === state.selectedGroup._id
      ) {
        // Prevent duplicate appending
        const exists = state.groupMessages.some((m) => m._id === msg._id);
        if (!exists) {
          state.groupMessages.push(msg);
        }
      }

      // Update lastMessage on group in groups list and move to top
      const targetGroupId = msg.groupId?._id || msg.groupId;
      const grpIndex = state.groups.findIndex((g) => g._id === targetGroupId);
      if (grpIndex !== -1) {
        const grp = { ...state.groups[grpIndex] };
        grp.lastMessage = {
          text:
            msg.message ||
            (msg.image
              ? "📷 Photo"
              : msg.file?.name
              ? `📄 ${msg.file.name}`
              : msg.poll?.question
              ? `📊 ${msg.poll.question}`
              : "🎤 Voice message"),
          senderName: msg.senderId?.fullName || "User",
          time: msg.createdAt || new Date(),
        };
        state.groups.splice(grpIndex, 1);
        state.groups.unshift(grp);
      }
    },
    updateGroupMessageReactions: (state, action) => {
      const { messageId, reactions } = action.payload || {};
      if (!messageId) return;
      const found = state.groupMessages.find((m) => String(m._id) === String(messageId));
      if (found) {
        found.reactions = reactions || [];
      }
    },
    updateGroupPoll: (state, action) => {
      const { messageId, poll } = action.payload || {};
      if (!messageId || !poll) return;
      const found = state.groupMessages.find((m) => String(m._id) === String(messageId));
      if (found) {
        found.poll = poll;
      }
    },
    updateGroupPinned: (state, action) => {
      const { groupId, pinnedMessage } = action.payload || {};
      if (!groupId) return;
      state.groups = state.groups.map((g) =>
        String(g._id) === String(groupId) ? { ...g, pinnedMessage } : g
      );
      if (state.selectedGroup && String(state.selectedGroup._id) === String(groupId)) {
        state.selectedGroup = { ...state.selectedGroup, pinnedMessage };
      }
    },
    setIsCreateGroupOpen: (state, action) => {
      state.isCreateGroupOpen = Boolean(action.payload);
    },
    updateGroup: (state, action) => {
      const updated = action.payload;
      if (!updated) return;
      state.groups = state.groups.map((g) =>
        g._id === updated._id ? { ...g, ...updated } : g
      );
      if (state.selectedGroup?._id === updated._id) {
        state.selectedGroup = { ...state.selectedGroup, ...updated };
      }
    },
  },
});

export const {
  setGroups,
  addGroup,
  setSelectedGroup,
  incrementGroupUnreadCount,
  clearGroupUnreadCount,
  setGroupMessages,
  addGroupMessage,
  updateGroupMessageReactions,
  updateGroupPoll,
  updateGroupPinned,
  setIsCreateGroupOpen,
  updateGroup,
} = groupSlice.actions;

export default groupSlice.reducer;
