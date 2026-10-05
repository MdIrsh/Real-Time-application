import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import store from "./redux/store";
import axios from "axios";

// Enable credentials by default for all requests
axios.defaults.withCredentials = true;

// Global Axios Request Interceptor:
// Automatically attach Authorization Bearer token header on every outgoing API call.
// This permanently fixes the iPhone / Safari ITP issue where cross-site cookies are blocked!
axios.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Safe fallback if localStorage is restricted
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster />
    </Provider>
  </React.StrictMode>
);
