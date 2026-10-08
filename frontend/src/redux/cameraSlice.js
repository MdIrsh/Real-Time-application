import { createSlice } from "@reduxjs/toolkit";

const cameraSlice = createSlice({
  name: "camera",
  initialState: {
    isCameraOpen: false,
    cameraTarget: null, // "chat" | "status" | null
  },
  reducers: {
    setIsCameraOpen: (state, action) => {
      state.isCameraOpen = action.payload;
    },
    openCamera: (state, action) => {
      state.isCameraOpen = true;
      state.cameraTarget = action.payload || null;
    },
    closeCamera: (state) => {
      state.isCameraOpen = false;
      state.cameraTarget = null;
    },
  },
});

export const { setIsCameraOpen, openCamera, closeCamera } = cameraSlice.actions;
export default cameraSlice.reducer;
