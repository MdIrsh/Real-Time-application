import {createSlice} from "@reduxjs/toolkit";

const userSlice=createSlice({
  name:"user",
  initialState:{
     authUser:null,
     otherUsers:null,
     selectedUser:null,
     onlineUsers:null,
     typingUsers:{}, // { [userId]: boolean }
  },
  reducers:{
     setAuthUser:(state,action)=>{
       state.authUser=action.payload;
     },
     setOtherUsers:(state,action)=>{
      state.otherUsers=action.payload;
     },
     setSelectedUser:(state,action)=>{
       state.selectedUser= action.payload;
     },
    setOnlineUsers:(state,action)=>{
      state.onlineUsers=action.payload
     },
    setUserTyping:(state,action)=>{
      const { userId, isTyping } = action.payload;
      if (!state.typingUsers) state.typingUsers = {};
      if (isTyping) {
        state.typingUsers[userId] = true;
      } else {
        delete state.typingUsers[userId];
      }
    }
  }
});
export const {setAuthUser,setOtherUsers,setSelectedUser,setOnlineUsers,setUserTyping} = userSlice.actions;
export default userSlice.reducer;