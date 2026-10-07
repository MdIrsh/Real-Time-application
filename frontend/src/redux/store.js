import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";
import messageReducer from "./messageSlice.js";
import socketReducer from "./socketSlice.js";
import reelReducer from "./reelSlice.js";
import statusReducer from "./statusSlice.js";
import groupCallReducer from "./groupCallSlice.js";
import groupReducer from "./groupSlice.js";

const store = configureStore({
  reducer: {
    user: userReducer,
    message: messageReducer,
    socket: socketReducer,
    reel: reelReducer,
    status: statusReducer,
    groupCall: groupCallReducer,
    group: groupReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;