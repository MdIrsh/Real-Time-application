import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";
import messageReducer from "./messageSlice.js";
import socketReducer from "./socketSlice.js";
import reelReducer from "./reelSlice.js";
import statusReducer from "./statusSlice.js";

const store = configureStore({
  reducer: {
    user: userReducer,
    message: messageReducer,
    socket: socketReducer,
    reel: reelReducer,
    status: statusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;