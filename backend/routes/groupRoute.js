import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  addGroupMembers,
  leaveGroup,
  updateGroupAvatar,
} from "../controllers/groupController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createGroup);
router.get("/all", isAuthenticated, getMyGroups);
router.get("/messages/:groupId", isAuthenticated, getGroupMessages);
router.post("/send/:groupId", isAuthenticated, sendGroupMessage);
router.post("/add-members/:groupId", isAuthenticated, addGroupMembers);
router.post("/leave/:groupId", isAuthenticated, leaveGroup);
router.post("/update-avatar/:groupId", isAuthenticated, updateGroupAvatar);

export default router;
