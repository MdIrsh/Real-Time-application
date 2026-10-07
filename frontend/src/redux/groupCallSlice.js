import { createSlice } from "@reduxjs/toolkit";

const groupCallSlice = createSlice({
  name: "groupCall",
  initialState: {
    isGroupCallOpen: false,
    activeRoomId: null,
    callType: "video", // "video" | "audio"
    roomTitle: "Group Call Room",
    incomingGroupInvite: null, // { roomId, fromUser, callType }
  },
  reducers: {
    openGroupCall: (state, action) => {
      const { roomId, callType, roomTitle } = action.payload || {};
      state.isGroupCallOpen = true;
      state.activeRoomId = roomId || `room-${Date.now().toString(36)}`;
      state.callType = callType || "video";
      state.roomTitle = roomTitle || "Group Video Room";
      state.incomingGroupInvite = null;
    },
    closeGroupCall: (state) => {
      state.isGroupCallOpen = false;
      state.activeRoomId = null;
    },
    setIncomingGroupInvite: (state, action) => {
      state.incomingGroupInvite = action.payload;
    },
    clearIncomingGroupInvite: (state) => {
      state.incomingGroupInvite = null;
    },
  },
});

export const {
  openGroupCall,
  closeGroupCall,
  setIncomingGroupInvite,
  clearIncomingGroupInvite,
} = groupCallSlice.actions;

export default groupCallSlice.reducer;
