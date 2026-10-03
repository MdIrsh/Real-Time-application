import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: null,
    unreadCounts: {}, // { [userId]: number }
    lastMessages: {}, // { [userId]: { text: string, time: string, isMe?: boolean } }
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      if (!action.payload) return;
      if (!state.messages) {
        state.messages = [action.payload];
        return;
      }
      const newMsg = action.payload;
      const exists = state.messages.some(
        (m) => m._id && newMsg._id && String(m._id) === String(newMsg._id)
      );
      if (!exists) {
        state.messages.push(newMsg);
      }
    },
    incrementUnreadCount: (state, action) => {
      const userId = action.payload;
      if (!userId) return;
      const current = state.unreadCounts[userId] || 0;
      state.unreadCounts[userId] = current + 1;
    },
    clearUnreadCount: (state, action) => {
      const userId = action.payload;
      if (!userId) return;
      state.unreadCounts[userId] = 0;
    },
    setLastMessage: (state, action) => {
      const { userId, text, time, isMe } = action.payload || {};
      if (!userId) return;
      state.lastMessages[userId] = {
        text: text || "",
        time: time || new Date().toISOString(),
        isMe: !!isMe,
      };
    },
  },
});

export const {
  setMessages,
  addMessage,
  incrementUnreadCount,
  clearUnreadCount,
  setLastMessage,
} = messageSlice.actions;

export default messageSlice.reducer;