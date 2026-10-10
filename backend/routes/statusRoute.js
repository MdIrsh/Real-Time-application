import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import {
  getAllStatuses,
  createStatus,
  viewStatus,
  deleteStatus,
  searchSongs,
} from "../controllers/statusController.js";

const router = express.Router();

router.get("/all", isAuthenticated, getAllStatuses);
router.get("/search-songs", isAuthenticated, searchSongs);
router.post("/create", isAuthenticated, createStatus);
router.put("/view/:statusId", isAuthenticated, viewStatus);
router.delete("/:statusId", isAuthenticated, deleteStatus);

export default router;
