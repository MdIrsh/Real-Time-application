import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import {
  getAllStatuses,
  createStatus,
  viewStatus,
  deleteStatus,
} from "../controllers/statusController.js";

const router = express.Router();

router.get("/all", isAuthenticated, getAllStatuses);
router.post("/create", isAuthenticated, createStatus);
router.put("/view/:statusId", isAuthenticated, viewStatus);
router.delete("/:statusId", isAuthenticated, deleteStatus);

export default router;
