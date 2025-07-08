import Balance from "../models/balance.model.js";
import { GroupMembers } from "../models/groups.model.js";
import { addGroupMember, createNewGroup, fetchGroupMembers, getGroupDetailsById, getUserGroups, removeGroupMember, updateGroupDetails } from "../services/group.service.js";
import {
  createGroupSchema,
  updateGroupSchema,
} from "../validations/group.validation.js";

const listAllGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await getUserGroups(userId);
    res.status(200).json({ message: "success", groups });

  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const createGroup = async (req, res) => {
  try {

    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }

    const userId = req.user._id;

    const group = await createNewGroup(parsed.data, userId);
    res.status(201).json({ message: "success", group: group });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const getGroupbyId = async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await getGroupDetailsById(groupId);
    res.status(200).json({ message: "success", group });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
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
    const resMembers = await GroupMembers.find({ groupId }).populate({ path: "userId", select: "name email avatarUrl isAdmin", });
    if (!resMembers || resMembers.length === 0) {
      return res
        .status(404)
        .json({ message: "No members found for this group" });
    }
    res.status(200).json({ message: "success", members: resMembers });

    const members = await fetchGroupMembers({ groupId, userId });

    res.status(200).json({ message: "success", members });
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

    const updatedGroup = await updateGroupDetails({ userId, groupId, updatedDetails });
    res.status(200).json({ message: "success", group: updatedGrp });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const addMember = async (req, res) => {
  try {
    const memberToAdd = req.body.userIds;
    console.log(memberToAdd);

    const groupId = req.params.id;
    const adminId = req.user._id;

    const addedMembers = [];

    for (const memberId of memberToAdd) {
      const newMember = await addGroupMember({ adminId, groupId, memberId });
      addedMembers.push(newMember);
    }

    res.status(200).json({ message: "success", added: addedMembers });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const memberToRemove = req.params.userId;
    const groupId = req.params.id;
    const adminId = req.user._id;

    const result = await removeGroupMember({ adminId, groupId, memberToRemove });
    res.status(200).json({ message: "success", removed: result });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const getGroupDebts = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user._id;

    const isMember = await GroupMembers.findOne({ groupId, userId });
    if (!isMember) {
      return res.status(403).json({ message: "You are not part of this group" });
    }

    const members = await GroupMembers.find({ groupId }).populate("userId", "name email");
    const memberInfo = {};
    members.forEach(m => {
      const id = m.userId._id.toString();
      memberInfo[id] = {
        name: m.userId.name,
        email: m.userId.email
      };
    });

    const balances = await Balance.find({ groupId }).populate("from to", "name email");

    const debts = balances
      .filter(b => b.amount > 0)
      .map(b => ({
        from: b.from.name,
        to: b.to.name,
        amount: b.amount
      }));


    res.status(200).json({ message: "success", debts });
  } catch (err) {
    res.status(500).json({ message: "error", error: err.message });
  }
};



export {
  addMember,
  createGroup,
  getGroupbyId, getGroupDebts, getGroupMembers, listAllGroups,
  removeMember,
  updateGroup
};

