import {configureStore} from "@reduxjs/toolkit";
import  useReducer  from "./userSlice.js";
import messageReducer from "./messageSlice.js";
 import socketReducer from "./socketSlice.js"

const store = configureStore({
  reducer:{
    user:useReducer,
    message:messageReducer,
     socket:socketReducer
  }
});
export default store;