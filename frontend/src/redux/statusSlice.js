import { createSlice } from "@reduxjs/toolkit";

const statusSlice = createSlice({
  name: "status",
  initialState: {
    myStatuses: [],
    otherStatuses: [],
    allStatuses: [],
    selectedStatus: null,
    isViewerOpen: false,
    isUploadOpen: false,
    loading: false,
  },
  reducers: {
    setStatuses: (state, action) => {
      state.myStatuses = action.payload.myStatuses || [];
      state.otherStatuses = action.payload.otherStatuses || [];
      state.allStatuses = action.payload.allStatuses || [];
    },
    addMyStatus: (state, action) => {
      state.myStatuses.unshift(action.payload);
      state.allStatuses.unshift(action.payload);
    },
    addOtherStatus: (state, action) => {
      const incoming = action.payload;
      if (!state.otherStatuses.some((s) => s._id === incoming._id)) {
        state.otherStatuses.unshift(incoming);
      }
      if (!state.allStatuses.some((s) => s._id === incoming._id)) {
        state.allStatuses.unshift(incoming);
      }
    },
    setSelectedStatus: (state, action) => {
      state.selectedStatus = action.payload;
    },
    setIsViewerOpen: (state, action) => {
      state.isViewerOpen = action.payload;
    },
    setIsUploadOpen: (state, action) => {
      state.isUploadOpen = action.payload;
    },
    setStatusLoading: (state, action) => {
      state.loading = action.payload;
    },
    viewStatusLocally: (state, action) => {
      const { statusId, userId } = action.payload;
      const found = state.allStatuses.find((s) => s._id === statusId);
      if (found && !found.viewers?.some((v) => v.user?._id === userId || v.user === userId)) {
        found.viewers.push({ user: userId, viewedAt: new Date().toISOString() });
      }
    },
  },
});

export const {
  setStatuses,
  addMyStatus,
  addOtherStatus,
  setSelectedStatus,
  setIsViewerOpen,
  setIsUploadOpen,
  setStatusLoading,
  viewStatusLocally,
} = statusSlice.actions;

export default statusSlice.reducer;
