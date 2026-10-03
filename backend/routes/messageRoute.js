import express from "express";
import { getMessage, sendMessage, markAsSeen } from "../controllers/messageController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
const router = express.Router();

router.route("/send/:id").post(isAuthenticated, sendMessage);
router.route("/:id").get(isAuthenticated, getMessage);
router.route("/mark-seen/:id").put(isAuthenticated, markAsSeen);

export default router;