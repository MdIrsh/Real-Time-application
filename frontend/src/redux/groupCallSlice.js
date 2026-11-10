import { createSlice } from "@reduxjs/toolkit";

const groupCallSlice = createSlice({
  name: "groupCall",
  initialState: {
    isGroupCallOpen: false,
    activeRoomId: null,
    activeGroupId: null,
    callType: "video", // "video" | "audio"
    roomTitle: "Group Call Room",
    invitedMembers: [],
    openDrawerOnStart: false,
    incomingGroupInvite: null, // { roomId, fromUser, callType, roomTitle, groupId }
  },
  reducers: {
    openGroupCall: (state, action) => {
      const {
        roomId,
        callType,
        roomTitle,
        groupId = null,
        invitedMembers = [],
        openDrawerOnStart = false,
      } = action.payload || {};
      state.isGroupCallOpen = true;
      state.activeRoomId = roomId || `room-${Date.now().toString(36)}`;
      state.activeGroupId = groupId || null;
      state.callType = callType || "video";
      state.roomTitle = roomTitle || "Group Video Room";
      state.invitedMembers = Array.isArray(invitedMembers) ? invitedMembers : [];
      state.openDrawerOnStart = Boolean(openDrawerOnStart);
      state.incomingGroupInvite = null;
    },
    closeGroupCall: (state) => {
      state.isGroupCallOpen = false;
      state.activeRoomId = null;
      state.activeGroupId = null;
      state.invitedMembers = [];
      state.openDrawerOnStart = false;
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
