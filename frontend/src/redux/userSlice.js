import { createSlice } from "@reduxjs/toolkit";

const getInitialAuthUser = () => {
  try {
    const item = typeof window !== "undefined" ? localStorage.getItem("chat-user") : null;
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    authUser: getInitialAuthUser(),
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
      try {
        if (action.payload) {
          localStorage.setItem("chat-user", JSON.stringify(action.payload));
          if (action.payload.token) {
            localStorage.setItem("token", action.payload.token);
          }
        } else {
          localStorage.removeItem("chat-user");
          localStorage.removeItem("token");
        }
      } catch (e) {
        console.error("Error updating localStorage for user:", e);
      }
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
    updateUserProfilePhoto: (state, action) => {
      const { userId, profilePhoto, fullName } = action.payload || {};
      if (!userId) return;

      const currentAuthId = state.authUser?._id || state.authUser?.id;
      if (currentAuthId && String(currentAuthId) === String(userId)) {
        state.authUser = {
          ...state.authUser,
          ...(profilePhoto ? { profilePhoto } : {}),
          ...(fullName ? { fullName } : {}),
        };
        try {
          localStorage.setItem("chat-user", JSON.stringify(state.authUser));
        } catch (e) {}
      }

      if (state.selectedUser) {
        const selId = state.selectedUser?._id || state.selectedUser?.id;
        if (selId && String(selId) === String(userId)) {
          state.selectedUser = {
            ...state.selectedUser,
            ...(profilePhoto ? { profilePhoto } : {}),
            ...(fullName ? { fullName } : {}),
          };
        }
      }

      if (Array.isArray(state.otherUsers)) {
        state.otherUsers = state.otherUsers.map((u) => {
          const uId = u._id || u.id;
          if (uId && String(uId) === String(userId)) {
            return {
              ...u,
              ...(profilePhoto ? { profilePhoto } : {}),
              ...(fullName ? { fullName } : {}),
            };
          }
          return u;
        });
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
  updateUserProfilePhoto,
} = userSlice.actions;

export default userSlice.reducer;