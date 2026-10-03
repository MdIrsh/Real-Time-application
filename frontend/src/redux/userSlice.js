import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    authUser: null,
    otherUsers: null, // Accepted friends list
    selectedUser: null,
    onlineUsers: null,
    typingUsers: {}, // { [userId]: boolean }
    friendRequests: {
      received: [],
      sent: [],
    },
  },
  reducers: {
    setAuthUser: (state, action) => {
      state.authUser = action.payload;
    },
    setOtherUsers: (state, action) => {
      state.otherUsers = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setUserTyping: (state, action) => {
      const { userId, isTyping } = action.payload;
      if (!state.typingUsers) state.typingUsers = {};
      if (isTyping) {
        state.typingUsers[userId] = true;
      } else {
        delete state.typingUsers[userId];
      }
    },
    setFriendRequests: (state, action) => {
      state.friendRequests = action.payload || { received: [], sent: [] };
    },
    addReceivedRequest: (state, action) => {
      if (!state.friendRequests) state.friendRequests = { received: [], sent: [] };
      const exists = state.friendRequests.received.some(
        (r) => r._id === action.payload._id
      );
      if (!exists) {
        state.friendRequests.received = [action.payload, ...state.friendRequests.received];
      }
    },
    removeReceivedRequest: (state, action) => {
      if (state.friendRequests?.received) {
        state.friendRequests.received = state.friendRequests.received.filter(
          (r) => r._id !== action.payload
        );
      }
    },
    addSentRequest: (state, action) => {
      if (!state.friendRequests) state.friendRequests = { received: [], sent: [] };
      const exists = state.friendRequests.sent.some(
        (r) => r._id === action.payload._id
      );
      if (!exists) {
        state.friendRequests.sent = [action.payload, ...state.friendRequests.sent];
      }
    },
    removeSentRequest: (state, action) => {
      if (state.friendRequests?.sent) {
        state.friendRequests.sent = state.friendRequests.sent.filter(
          (r) => r._id !== action.payload
        );
      }
    },
    addFriend: (state, action) => {
      const newFriend = action.payload;
      if (!newFriend || !newFriend._id) return;
      if (!state.otherUsers) state.otherUsers = [];
      const exists = state.otherUsers.some((u) => u._id === newFriend._id);
      if (!exists) {
        state.otherUsers = [newFriend, ...state.otherUsers];
      }
    },
  },
});

export const {
  setAuthUser,
  setOtherUsers,
  setSelectedUser,
  setOnlineUsers,
  setUserTyping,
  setFriendRequests,
  addReceivedRequest,
  removeReceivedRequest,
  addSentRequest,
  removeSentRequest,
  addFriend,
} = userSlice.actions;

export default userSlice.reducer;