import express from "express";
import { getMessage, sendMessage, markAsSeen, reactToMessage, voteOnPoll } from "../controllers/messageController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
const router = express.Router();

router.route("/send/:id").post(isAuthenticated, sendMessage);
router.route("/:id").get(isAuthenticated, getMessage);
router.route("/mark-seen/:id").put(isAuthenticated, markAsSeen);
router.route("/react/:messageId").put(isAuthenticated, reactToMessage);
router.route("/poll/vote/:messageId").put(isAuthenticated, voteOnPoll);

export default router;