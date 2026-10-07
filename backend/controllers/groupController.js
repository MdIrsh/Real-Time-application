import { Group } from "../models/groupModel.js";
import { Message } from "../models/messageModel.js";
import { User } from "../models/userModel.js";
import { io, getReceiverSocketId } from "../socket/socket.js";

// 1. Create a new Group Chat
export const createGroup = async (req, res) => {
  try {
    const creatorId = req.id;
    const { name, description = "", participants = [], groupAvatar = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required", success: false });
    }

    // Ensure creator is in participants list
    const memberIds = Array.from(
      new Set([creatorId.toString(), ...participants.map((p) => p.toString())])
    );

    if (memberIds.length < 2) {
      return res.status(400).json({
        message: "Please select at least 1 friend to form a group",
        success: false,
      });
    }

    const defaultAvatar =
      groupAvatar ||
      `https://api.dicebear.com/10.x/identicon/svg?seed=${encodeURIComponent(
        name.trim()
      )}`;

    const newGroup = await Group.create({
      name: name.trim(),
      description: description.trim(),
      groupAvatar: defaultAvatar,
      admin: creatorId,
      participants: memberIds,
      messages: [],
      lastMessage: {
        text: "Group created 🎉",
        senderName: "System",
        time: new Date(),
      },
    });

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("participants", "fullName username profilePhoto gender")
      .populate("admin", "fullName username profilePhoto");

    // Notify all participants who are online via Socket.io
    memberIds.forEach((mId) => {
      const socketId = getReceiverSocketId(mId);
      if (socketId) {
        io.to(socketId).emit("newGroupCreated", populatedGroup);
      }
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully!",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("createGroup error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to create group",
      success: false,
    });
  }
};

// 2. Get all Groups the current user belongs to
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.id;
    const groups = await Group.find({ participants: userId })
      .populate("participants", "fullName username profilePhoto gender")
      .populate("admin", "fullName username profilePhoto")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      groups: groups || [],
    });
  } catch (error) {
    console.error("getMyGroups error:", error);
    return res.status(500).json({
      message: "Failed to fetch groups",
      success: false,
    });
  }
};

// 3. Get message history of a specific Group
export const getGroupMessages = async (req, res) => {
  try {
    const userId = req.id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.participants.some(
      (pId) => pId.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this group",
        success: false,
      });
    }

    const populatedGroup = await Group.findById(groupId).populate({
      path: "messages",
      populate: {
        path: "senderId",
        select: "fullName username profilePhoto gender",
      },
    });

    return res.status(200).json({
      success: true,
      messages: populatedGroup?.messages || [],
    });
  } catch (error) {
    console.error("getGroupMessages error:", error);
    return res.status(500).json({
      message: "Failed to fetch group messages",
      success: false,
    });
  }
};

// 4. Send a message to a Group
export const sendGroupMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const { groupId } = req.params;
    const { message, image, audio, audioDuration } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.participants.some(
      (pId) => pId.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this group",
        success: false,
      });
    }

    const sender = await User.findById(senderId).select("fullName username profilePhoto").lean();

    const newMessage = await Message.create({
      senderId,
      groupId,
      message: message || "",
      image: image || null,
      audio: audio || null,
      audioDuration: audioDuration || 0,
      delivered: true,
      seen: false,
    });

    // Populate sender details on message
    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "fullName username profilePhoto gender"
    );

    // Update group's message list & lastMessage
    let previewText = message || "";
    if (image) previewText = "📷 Photo";
    if (audio) previewText = "🎤 Voice message";

    group.messages.push(newMessage._id);
    group.lastMessage = {
      text: previewText,
      senderName: sender?.fullName || "User",
      senderId,
      time: new Date(),
    };
    await group.save();

    // Broadcast to all group participants via Socket.io
    group.participants.forEach((participantId) => {
      const socketId = getReceiverSocketId(participantId);
      if (socketId) {
        io.to(socketId).emit("newGroupMessage", {
          groupId,
          message: populatedMessage,
        });
      }
    });

    // Also emit to socket room if joined
    io.to(`group-chat-${groupId}`).emit("newGroupMessage", {
      groupId,
      message: populatedMessage,
    });

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("sendGroupMessage error:", error);
    return res.status(500).json({
      message: "Failed to send group message",
      success: false,
    });
  }
};

// 5. Add members to an existing group
export const addGroupMembers = async (req, res) => {
  try {
    const userId = req.id;
    const { groupId } = req.params;
    const { memberIds = [] } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.participants.some(
      (pId) => pId.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized", success: false });
    }

    const updatedMemberIds = Array.from(
      new Set([
        ...group.participants.map((p) => p.toString()),
        ...memberIds.map((m) => m.toString()),
      ])
    );

    group.participants = updatedMemberIds;
    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("participants", "fullName username profilePhoto gender")
      .populate("admin", "fullName username profilePhoto");

    return res.status(200).json({
      success: true,
      message: "Members added successfully!",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("addGroupMembers error:", error);
    return res.status(500).json({
      message: "Failed to add members",
      success: false,
    });
  }
};

// 6. Leave group
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.id;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    group.participants = group.participants.filter(
      (pId) => pId.toString() !== userId.toString()
    );

    if (group.participants.length === 0) {
      await Group.findByIdAndDelete(groupId);
    } else {
      // If admin left, assign admin to next participant
      if (group.admin.toString() === userId.toString()) {
        group.admin = group.participants[0];
      }
      await group.save();
    }

    return res.status(200).json({
      success: true,
      message: "Left group successfully",
    });
  } catch (error) {
    console.error("leaveGroup error:", error);
    return res.status(500).json({
      message: "Failed to leave group",
      success: false,
    });
  }
};

// 7. Update Group Avatar / DP
export const updateGroupAvatar = async (req, res) => {
  try {
    const userId = req.id;
    const { groupId } = req.params;
    const { groupAvatar } = req.body;

    if (!groupAvatar) {
      return res.status(400).json({
        message: "Group avatar image is required",
        success: false,
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found", success: false });
    }

    const isMember = group.participants.some(
      (pId) => (pId._id || pId).toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        message: "Only group members can update group DP",
        success: false,
      });
    }

    group.groupAvatar = groupAvatar;
    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate("participants", "fullName username profilePhoto gender")
      .populate("admin", "fullName username profilePhoto");

    // Broadcast to group room & participants
    io.to(`group-chat-${groupId}`).emit("groupAvatarUpdated", {
      groupId,
      groupAvatar,
      group: populatedGroup,
    });

    group.participants.forEach((mId) => {
      const socketId = getReceiverSocketId(mId);
      if (socketId) {
        io.to(socketId).emit("groupAvatarUpdated", {
          groupId,
          groupAvatar,
          group: populatedGroup,
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Group DP updated successfully! 📸",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("updateGroupAvatar error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to update group DP",
      success: false,
    });
  }
};

