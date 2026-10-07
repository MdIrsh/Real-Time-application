import { createSlice } from "@reduxjs/toolkit";

const reelSlice = createSlice({
  name: "reel",
  initialState: {
    reels: [],
    isReelsOpen: false,
    activeReelIndex: 0,
    targetReel: null,
    loading: false,
  },
  reducers: {
    setReels: (state, action) => {
      state.reels = action.payload;
    },
    setIsReelsOpen: (state, action) => {
      state.isReelsOpen = action.payload;
      if (!action.payload) {
        state.targetReel = null;
      }
    },
    openSpecificReel: (state, action) => {
      state.isReelsOpen = true;
      state.targetReel = action.payload;
      state.activeReelIndex = 0;
    },
    clearTargetReel: (state) => {
      state.targetReel = null;
    },
    setActiveReelIndex: (state, action) => {
      state.activeReelIndex = action.payload;
    },
    setReelsLoading: (state, action) => {
      state.loading = action.payload;
    },
    addReel: (state, action) => {
      state.reels.unshift(action.payload);
    },
    updateReelLikes: (state, action) => {
      const { reelId, likes } = action.payload;
      const index = state.reels.findIndex((r) => r._id === reelId);
      if (index !== -1) {
        state.reels[index].likes = likes;
      }
    },
    addReelComment: (state, action) => {
      const { reelId, comment } = action.payload;
      const index = state.reels.findIndex((r) => r._id === reelId);
      if (index !== -1) {
        if (!state.reels[index].comments) {
          state.reels[index].comments = [];
        }
        state.reels[index].comments.unshift(comment);
      }
    },
    incrementReelShares: (state, action) => {
      const { reelId } = action.payload;
      const index = state.reels.findIndex((r) => r._id === reelId);
      if (index !== -1) {
        state.reels[index].sharesCount = (state.reels[index].sharesCount || 0) + 1;
      }
    },
  },
});

export const {
  setReels,
  setIsReelsOpen,
  openSpecificReel,
  clearTargetReel,
  setActiveReelIndex,
  setReelsLoading,
  addReel,
  updateReelLikes,
  addReelComment,
  incrementReelShares,
} = reelSlice.actions;

export default reelSlice.reducer;
