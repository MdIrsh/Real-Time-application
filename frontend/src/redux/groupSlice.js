import { createSlice } from "@reduxjs/toolkit";

const groupSlice = createSlice({
  name: "group",
  initialState: {
    groups: [],
    selectedGroup: null,
    groupMessages: [],
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
          text: msg.message || (msg.image ? "📷 Photo" : "🎤 Voice message"),
          senderName: msg.senderId?.fullName || "User",
          time: msg.createdAt || new Date(),
        };
        state.groups.splice(grpIndex, 1);
        state.groups.unshift(grp);
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
  setGroupMessages,
  addGroupMessage,
  setIsCreateGroupOpen,
  updateGroup,
} = groupSlice.actions;

export default groupSlice.reducer;
