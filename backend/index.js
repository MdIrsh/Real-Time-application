import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js"
import reelRoute from "./routes/reelRoute.js";
import statusRoute from "./routes/statusRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./socket/socket.js";
dotenv.config({}); 

const PORT = process.env.PORT || 5000;
// middleware
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:3000",
  "https://real-time-application-cyan.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOption = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token", "token"],
};

app.use(cors(corsOption));


// routes
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Real-Time Chat App Backend is alive and running!",
    status: "healthy",
  });
});

app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/reel", reelRoute);
app.use("/api/v1/status", statusRoute);


server.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server is running on port ${PORT}`);
});

