import express from "express";
import {
  getAllReels,
  createReel,
  toggleLikeReel,
  addComment,
  shareReel,
} from "../controllers/reelController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route("/all").get(getAllReels);
router.route("/create").post(isAuthenticated, createReel);
router.route("/like/:reelId").put(isAuthenticated, toggleLikeReel);
router.route("/comment/:reelId").post(isAuthenticated, addComment);
router.route("/share/:reelId").put(isAuthenticated, shareReel);

export default router;
