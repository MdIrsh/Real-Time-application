import { User } from "../models/userModel.js";
import { FriendRequest } from "../models/friendRequestModel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const sanitizeUser = (u) => {
  if (!u) return null;
  const userObj = u.toObject ? u.toObject() : { ...u };
  let photo = userObj.profilePhoto;
  if (!photo || photo.includes("avatar.iran.liara.run")) {
    const seed = encodeURIComponent(userObj.username || userObj.fullName || "User");
    photo =
      userObj.gender === "female"
        ? `https://api.dicebear.com/10.x/lorelei/svg?seed=${seed}`
        : `https://api.dicebear.com/10.x/personas/svg?seed=${seed}`;
  }
  userObj.profilePhoto = photo;
  delete userObj.password;
  return userObj;
};

export const register = async (req, res) => {
  try {
    const { fullName, username, password, confirmPassword, gender } = req.body;

    if (!fullName || !username || !password || !confirmPassword || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const user = await User.findOne({ username });
    if (user) {
      return res
        .status(400)
        .json({ message: "Username already exists, please try another" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const maleProfilePhoto = `https://api.dicebear.com/10.x/personas/svg?seed=${encodeURIComponent(
      username
    )}`;
    const femaleProfilePhoto = `https://api.dicebear.com/10.x/lorelei/svg?seed=${encodeURIComponent(
      username
    )}`;

    await User.create({
      fullName,
      username,
      password: hashedPassword,
      profilePhoto: gender === "male" ? maleProfilePhoto : femaleProfilePhoto,
      gender,
      friends: [],
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.log("Register error:", error);
    return res.status(500).json({
      message: error?.message || "Registration failed. Please try again.",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect username or password",
        success: false,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect username or password",
        success: false,
      });
    }
    const tokenData = {
      userId: user._id,
    };
    const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    let profilePhoto = user.profilePhoto;
    if (!profilePhoto || profilePhoto.includes("avatar.iran.liara.run")) {
      const seed = encodeURIComponent(user.username || user.fullName || "User");
      profilePhoto =
        user.gender === "female"
          ? `https://api.dicebear.com/10.x/lorelei/svg?seed=${seed}`
          : `https://api.dicebear.com/10.x/personas/svg?seed=${seed}`;
    }
    const isProduction = process.env.NODE_ENV === "production";
    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      })
      .json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePhoto: profilePhoto,
        gender: user.gender,
        token: token,
      });
  } catch (error) {
    console.log("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    return res
      .status(200)
      .cookie("token", "", {
        maxAge: 0,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
      })
      .json({
        message: "Logged out successfully.",
      });
  } catch (error) {
    console.log("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Returns ONLY accepted friends of the logged-in user
// If 0 friends accepted, returns empty array [] (clean inbox)
export const getOtherUsers = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const loggedInUser = await User.findById(loggedInUserId)
      .populate({
        path: "friends",
        select: "-password",
      })
      .lean();

    if (!loggedInUser || !loggedInUser.friends || loggedInUser.friends.length === 0) {
      return res.status(200).json([]);
    }

    const sanitizedFriends = loggedInUser.friends.map((friend) =>
      sanitizeUser(friend)
    );

    return res.status(200).json(sanitizedFriends);
  } catch (error) {
    console.log("getOtherUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Search users across the platform with relationship status (friend, sent, received, none)
export const searchUsers = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const query = req.query.query ? req.query.query.trim() : "";

    if (!query) {
      return res.status(200).json([]);
    }

    // Find current user to check friends list
    const currentUser = await User.findById(loggedInUserId).select("friends").lean();
    const currentFriendIds = (currentUser?.friends || []).map((id) =>
      id.toString()
    );

    // Search users by fullName or username excluding self
    const matchedUsers = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(20)
      .lean();

    if (matchedUsers.length === 0) {
      return res.status(200).json([]);
    }

    const userIds = matchedUsers.map((u) => u._id);

    // Check pending requests in both directions
    const [sentRequests, receivedRequests] = await Promise.all([
      FriendRequest.find({
        sender: loggedInUserId,
        receiver: { $in: userIds },
        status: "pending",
      }).lean(),
      FriendRequest.find({
        sender: { $in: userIds },
        receiver: loggedInUserId,
        status: "pending",
      }).lean(),
    ]);

    const sentMap = new Map();
    sentRequests.forEach((req) => {
      sentMap.set(req.receiver.toString(), req._id);
    });

    const receivedMap = new Map();
    receivedRequests.forEach((req) => {
      receivedMap.set(req.sender.toString(), req._id);
    });

    const results = matchedUsers.map((u) => {
      const uIdStr = u._id.toString();
      let status = "none";
      let requestId = null;

      if (currentFriendIds.includes(uIdStr)) {
        status = "friends";
      } else if (sentMap.has(uIdStr)) {
        status = "sent";
        requestId = sentMap.get(uIdStr);
      } else if (receivedMap.has(uIdStr)) {
        status = "received";
        requestId = receivedMap.get(uIdStr);
      }

      return {
        ...sanitizeUser(u),
        relationship: status,
        requestId,
      };
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error("searchUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself." });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if already friends
    const isFriend = sender.friends?.some(
      (fId) => fId.toString() === receiverId.toString()
    );
    if (isFriend) {
      return res.status(400).json({ message: "You are already friends." });
    }

    // Check if a request already exists between them
    const existingSent = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (existingSent) {
      return res
        .status(200)
        .json({ message: "Friend request already sent.", request: existingSent });
    }

    // If receiver already sent a request to sender, auto-accept it!
    const reversePending = await FriendRequest.findOne({
      sender: receiverId,
      receiver: senderId,
      status: "pending",
    });

    if (reversePending) {
      reversePending.status = "accepted";
      await reversePending.save();

      await Promise.all([
        User.findByIdAndUpdate(senderId, { $addToSet: { friends: receiverId } }),
        User.findByIdAndUpdate(receiverId, { $addToSet: { friends: senderId } }),
      ]);

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("friendRequestAccepted", {
          friend: sanitizeUser(sender),
        });
      }

      return res.status(200).json({
        message: "You are now friends!",
        status: "accepted",
        friend: sanitizeUser(receiver),
      });
    }

    // Create new friend request
    const newRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    // Real-time socket notification to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newFriendRequest", {
        _id: newRequest._id,
        sender: sanitizeUser(sender),
        createdAt: newRequest.createdAt,
      });
    }

    return res.status(201).json({
      message: "Friend request sent successfully!",
      request: newRequest,
    });
  } catch (error) {
    console.error("sendFriendRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOne({
      _id: requestId,
      receiver: loggedInUserId,
      status: "pending",
    }).populate("sender", "-password");

    if (!request) {
      return res
        .status(404)
        .json({ message: "Friend request not found or already processed." });
    }

    request.status = "accepted";
    await request.save();

    const senderId = request.sender._id;

    // Add both users to each other's friends array
    await Promise.all([
      User.findByIdAndUpdate(loggedInUserId, {
        $addToSet: { friends: senderId },
      }),
      User.findByIdAndUpdate(senderId, {
        $addToSet: { friends: loggedInUserId },
      }),
    ]);

    const loggedInUser = await User.findById(loggedInUserId).select("-password");

    // Real-time notification to the original sender that their request was accepted!
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("friendRequestAccepted", {
        friend: sanitizeUser(loggedInUser),
      });
    }

    return res.status(200).json({
      message: "Friend request accepted!",
      friend: sanitizeUser(request.sender),
    });
  } catch (error) {
    console.error("acceptFriendRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      receiver: loggedInUserId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    return res.status(200).json({ message: "Friend request declined." });
  } catch (error) {
    console.error("rejectFriendRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel an outgoing sent request
export const cancelFriendRequest = async (req, res) => {
  try {
    const loggedInUserId = req.id;
    const { requestId } = req.params;

    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      sender: loggedInUserId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    return res.status(200).json({ message: "Friend request cancelled." });
  } catch (error) {
    console.error("cancelFriendRequest error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all pending friend requests (received and sent)
export const getFriendRequests = async (req, res) => {
  try {
    const loggedInUserId = req.id;

    const [received, sent] = await Promise.all([
      FriendRequest.find({
        receiver: loggedInUserId,
        status: "pending",
      })
        .populate("sender", "fullName username profilePhoto gender")
        .sort({ createdAt: -1 })
        .lean(),
      FriendRequest.find({
        sender: loggedInUserId,
        status: "pending",
      })
        .populate("receiver", "fullName username profilePhoto gender")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const sanitizedReceived = received.map((item) => ({
      _id: item._id,
      createdAt: item.createdAt,
      sender: sanitizeUser(item.sender),
    }));

    const sanitizedSent = sent.map((item) => ({
      _id: item._id,
      createdAt: item.createdAt,
      receiver: sanitizeUser(item.receiver),
    }));

    return res.status(200).json({
      received: sanitizedReceived,
      sent: sanitizedSent,
    });
  } catch (error) {
    console.error("getFriendRequests error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
