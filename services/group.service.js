import { GroupMembers, Groups } from "../models/groups.model.js";
import User from "../models/user.model.js";

export const createNewGroup = async (groupData, userId) => {
    if (!userId) {
        throw { status: 401, message: "Please login first." };
    }

    const newGroup = await Groups.create(groupData);

    await GroupMembers.create({
        groupId: newGroup._id,
        userId,
        isAdmin: true,
    });

    return newGroup;
};

export const getUserGroups = async (userId) => {

    if (!userId) {
        return res.status(401).json({ message: "Please login first." });
    }

    // Step 1: Get all group membership entries for the user
    const memberships = await GroupMembers.find({ userId }).populate("groupId", "_id name isAdmin");
    // Step 2: Extract the actual group objects
    const groups = memberships.map((m) => ({
        _id: m.groupId._id,
        name: m.groupId.name,
        isAdmin: m.isAdmin
    }));
    return groups;

};


export const getGroupDetailsById = async (groupId) => {
    const group = await Groups.findById(groupId);
    if (!group) {
        throw { status: 404, message: "Group not found" };
    }
    return group;
};

export const addGroupMember = async ({ adminId, groupId, memberId }) => {

    const admin = await GroupMembers.findOne({ userId: adminId, groupId });

    if (!admin) {
        throw { status: 403, message: "You are not part of this group." };
    }

    if (!admin.isAdmin) {
        throw { status: 403, message: "Only admins can add members." };
    }

    console.log(memberId)
    const alreadyExists = await GroupMembers.findOne({
        userId: memberId,
        groupId,
    });

    if (alreadyExists) {
        throw { status: 400, message: `${memberId} is already a member of this group ${groupId}.` };
    }

    const userExists = await User.findById(memberId);
    if (!userExists) {
        throw { status: 404, message: `${memberId} does not exist.` };
    }

    const newMember = await GroupMembers.create({
        groupId,
        userId: memberId,
    });

    return newMember;
};

export const removeGroupMember = async ({ adminId, groupId, memberToRemove }) => {
    const admin = await GroupMembers.findOne({ userId: adminId, groupId });

    if (!admin) {
        throw { status: 403, message: "You are not part of this group." };
    }

    if (!admin.isAdmin) {
        throw { status: 403, message: "Only admins can remove members." };
    }

    const removed = await GroupMembers.deleteOne({
        groupId,
        userId: memberToRemove,
    });

    return removed;
};

export const updateGroupDetails = async ({ userId, groupId, updatedDetails }) => {
    const member = await GroupMembers.findOne({ userId, groupId });
    if (!member) {
        throw { status: 403, message: "You are not part of this group." };
    }

    if (!member.isAdmin) {
        throw { status: 403, message: "Only admins can update the group." };
    }

    const updatedGroup = await Groups.findByIdAndUpdate(groupId, updatedDetails, {
        new: true,
    });

    if (!updatedGroup) {
        throw { status: 404, message: "Group not found" };
    }

    return updatedGroup;
};

export const fetchGroupMembers = async ({ groupId, userId }) => {
    const isMember = await GroupMembers.findOne({ userId, groupId });
    if (!isMember) {
        throw { status: 403, message: "You are not part of this group." };
    }

    const members = await GroupMembers.find({ groupId }).populate({
        path: "userId",
        select: "_id name avatarUrl",
    });

    if (!members || members.length === 0) {
        throw { status: 404, message: "No members found for this group" };
    }

    // Return only flattened user objects
    return members.map((m) => ({
        _id: m.userId._id,
        name: m.userId.name,
        avatarUrl: m.userId.avatarUrl,
    }));
};

