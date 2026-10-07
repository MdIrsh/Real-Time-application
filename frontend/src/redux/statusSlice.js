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
      const { statusId, viewer } = action.payload;
      const updateViewer = (item) => {
        if (!item) return;
        if (!item.viewers) item.viewers = [];
        const viewerId = viewer?.user?._id || viewer?.user || viewer;
        const exists = item.viewers.some(
          (v) => String(v.user?._id || v.user) === String(viewerId)
        );
        if (!exists) {
          item.viewers.push(
            typeof viewer === "object"
              ? viewer
              : { user: viewer, viewedAt: new Date().toISOString() }
          );
        }
      };

      const foundAll = state.allStatuses.find((s) => String(s._id) === String(statusId));
      updateViewer(foundAll);
      const foundMy = state.myStatuses.find((s) => String(s._id) === String(statusId));
      updateViewer(foundMy);
      const foundOther = state.otherStatuses.find((s) => String(s._id) === String(statusId));
      updateViewer(foundOther);
      if (state.selectedStatus && String(state.selectedStatus._id) === String(statusId)) {
        updateViewer(state.selectedStatus);
      }
    },
    removeStatus: (state, action) => {
      const statusId = action.payload;
      state.myStatuses = state.myStatuses.filter((s) => String(s._id) !== String(statusId));
      state.allStatuses = state.allStatuses.filter((s) => String(s._id) !== String(statusId));
      state.otherStatuses = state.otherStatuses.filter((s) => String(s._id) !== String(statusId));
      if (state.selectedStatus && String(state.selectedStatus._id) === String(statusId)) {
        state.selectedStatus = null;
        state.isViewerOpen = false;
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
  removeStatus,
} = statusSlice.actions;

export default statusSlice.reducer;
