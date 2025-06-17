import { GroupMembers, Groups } from "../models/groups.model.js";
import {
  createGroupSchema,
  updateGroupSchema,
} from "../validations/group.validation.js";

const listAllGroups = async (req, res) => {
  try {
    const userId = req.user._id; //will get userId from middleware
    if (!userId) {
      return res.status(401).json({ message: "Please login first." });
    }
    const allGroups = await GroupMembers.find({ userId }).populate("groupId");
    const result = allGroups.map((a) => a.groupId);
    res.status(200).json({ message: "success", groups: result });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const createGroup = async (req, res) => {
  try {
    const groupDetails = req.body;
    const parsed = createGroupSchema.safeParse(groupDetails);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }
    const userId = req.user._id; //will get userId from middleware
    if (!userId) {
      return res.status(401).json({ message: "Please login first." });
    }
    const newGrp = await Groups.create(parsed.data);
    const memGrp = await GroupMembers.create({
      groupId: newGrp._id,
      userId,
      isAdmin: true,
    });
    res.status(201).json({ message: "success", group: newGrp });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const getGroupbyId = async (req, res) => {
  try {
    const groupId = req.params.id;
    const groupDetails = await Groups.findById(groupId);
    if (!groupDetails) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json({ message: "success", group: groupDetails });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Please login first." });
    }
    const isMember = await GroupMembers.findOne({ userId, groupId });
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not part of this group." });
    }
    const resMembers = await GroupMembers.find({ groupId }).populate("userId");
    if (!resMembers || resMembers.length === 0) {
      return res
        .status(404)
        .json({ message: "No members found for this group" });
    }
    res.status(200).json({ message: "success", members: resMembers });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const updatedDetails = req.body;
    const userId = req.user._id;
    const parsed = updateGroupSchema.safeParse(updatedDetails);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }
    const isGroupMember = await GroupMembers.findOne({ userId, groupId });
    if (!isGroupMember) {
      return res
        .status(403)
        .json({ message: "You are not part of this group." });
    }

    if (!isGroupMember.isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can update the group." });
    }

    const updatedGrp = await Groups.findByIdAndUpdate(groupId, parsed.data, {
      new: true,
    });
    if (!updatedGrp) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({ message: "success", group: updatedGrp });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const addMember = async (req, res) => {
  try {
    const memberToAdd = req.body.userId;

    const groupId = req.params.id;
    const userId = req.user._id;

    const checkAdmin = await GroupMembers.findOne({ userId, groupId });
    if (!checkAdmin) {
      return res
        .status(403)
        .json({ message: "You are not part of this group." });
    }
    if (!checkAdmin.isAdmin) {
      return res.status(403).json({ message: "Only admins can add members." });
    }

    const alreadyExists = await GroupMembers.findOne({
      userId: memberToAdd,
      groupId,
    });
    if (alreadyExists) {
      return res
        .status(400)
        .json({ message: "User is already a member of this group." });
    }

    const newMember = await GroupMembers.create({
      groupId,
      userId: memberToAdd,
    });
    res.status(200).json({ message: "success", added: newMember });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const memberToRemove = req.params.userId;
    const groupId = req.params.id;
    const userId = req.user._id;

    const checkAdmin = await GroupMembers.findOne({ userId, groupId });
    if (!checkAdmin) {
      return res
        .status(403)
        .json({ message: "You are not part of this group." });
    }

    if (!checkAdmin.isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can remove members." });
    }

    const removedMem = await GroupMembers.deleteOne({
      groupId,
      userId: memberToRemove,
    });
    res.status(200).json({ message: "success", removed: removedMem });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

export {
  addMember,
  createGroup,
  getGroupbyId,
  listAllGroups,
  removeMember,
  updateGroup,
  getGroupMembers,
};

// write test cases for group controller
