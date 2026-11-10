import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import {
  getAllStatuses,
  createStatus,
  viewStatus,
  reactToStatus,
  deleteStatus,
  searchSongs,
  streamAudio,
} from "../controllers/statusController.js";

const router = express.Router();

router.get("/all", isAuthenticated, getAllStatuses);
router.get("/search-songs", searchSongs); // Public so music search always works seamlessly
router.get("/stream-audio", streamAudio); // Public audio stream proxy (CORS & ad-blocker safe)
router.post("/create", isAuthenticated, createStatus);
router.put("/view/:statusId", isAuthenticated, viewStatus);
router.put("/react/:statusId", isAuthenticated, reactToStatus);
router.delete("/:statusId", isAuthenticated, deleteStatus);

export default router;
