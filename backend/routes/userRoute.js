import express from "express";
import {
  getOtherUsers,
  register,
  login,
  logout,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  updateProfilePhoto,
  resetProfilePhoto,
} from "../controllers/userController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/").get(isAuthenticated, getOtherUsers);

// Profile photo management routes
router.route("/profile/update-photo").put(isAuthenticated, updateProfilePhoto);
router.route("/profile/reset-photo").put(isAuthenticated, resetProfilePhoto);

// Friend Request System Routes
router.route("/search").get(isAuthenticated, searchUsers);
router.route("/requests").get(isAuthenticated, getFriendRequests);
router.route("/request/send/:id").post(isAuthenticated, sendFriendRequest);
router.route("/request/accept/:requestId").post(isAuthenticated, acceptFriendRequest);
router.route("/request/reject/:requestId").post(isAuthenticated, rejectFriendRequest);
router.route("/request/cancel/:requestId").post(isAuthenticated, cancelFriendRequest);

export default router;