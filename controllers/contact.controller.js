import { Contacts } from "../models/contact.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

// Friend request status: "pending", "accepted"
const addContact = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {fromUserId} = req.body;
        const toUserId = req.user._id;
        if (!toUserId) {
            return res.status(401).json({ message: "Please login first." });
        }
        if (fromUserId === toUserId.toString()) {
            return res.status(400).json({ message: "Can't add yourself as contact." });
        }

        // Check if contact already exists
        const recipient = await Contacts.findOne({ userId: toUserId}).session(session);

        if (recipient && recipient.contacts.includes(fromUserId)) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json({ message: "Friend request not found." });
        }


        // 1. Update recipient's contacts
        await Contacts.updateOne(
            { userId: toUserId },
            { $pull: { requests: fromUserId }, $addToSet: { contacts: fromUserId } },
            { session } // Pass the session to the query
        );
        // 2. Update sender: add to contacts
        await Contacts.updateOne(
            { userId: fromUserId },
            { $addToSet: { contacts: toUserId } },
            { upsert: true, session } // Also pass the session here
        );

        // If both operations succeed, commit the transaction
        await session.commitTransaction();
        await session.endSession();

        res.status(200).json({ message: "Friend request accepted", recipient  });
    } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        res.status(500).json({ message: "backend error", error: err.message });
    }
};

const sendFriendRequest = async (req, res) => {

    try {
        const { toUserId } = req.body;
        const fromUserId = req.user._id;
        if (!fromUserId) {
            return res.status(401).json({ message: "Please login first." });
        }
        if (toUserId === fromUserId.toString()) {
            return res.status(400).json({ message: "Can't send request to yourself." });
        }
        const toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Fetch both users' contact documents to check their status
        const fromUserContacts = await Contacts.findOne({ userId: fromUserId });
        const toUserContacts = await Contacts.findOne({ userId: toUserId });

        // Case 1: Already friends?
        if (fromUserContacts?.contacts.includes(toUserId)) {
            return res.status(409).json({ message: "You are already friends." }); // 409 Conflict is a good status code here
        }

        // Case 2: Request already sent and pending?
        if (toUserContacts?.requests.includes(fromUserId)) {
            return res.status(409).json({ message: "Friend request already pending." });
        }
        // Case 3: Already sent a request?

        // Store pending request in Contacts
        await Contacts.updateOne(
            { userId: toUserId },
            { $addToSet: { requests: fromUserId } },
            { upsert: true }
        );
        res.status(200).json({ message: "Friend request sent" });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
};

const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ message: "Please login first." });
        }
        const contacts = await Contacts.findOne({ userId }).populate({
            path: "requests",
            select: "name email avatarUrl",
        });
        if (!contacts) {
            return res.status(200).json({ message: "No Friend Requests Found.", requests: [] });
        }
        const friendRequests = contacts.requests.map(r => ({
            id: r._id,
            name: r.name,
            email: r.email,
            avatarUrl: r.avatarUrl
        }));
        res.status(200).json({ message: "success", requests: friendRequests });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
}

const acceptFriendRequest = async (req, res) => {
    try {
        const { fromUserId } = req.body;
        const toUserId = req.user._id;
        if (!toUserId) {
            return res.status(401).json({ message: "Please login first." });
        }
        // Remove from requests and add to contacts
        await Contacts.updateOne(
            { userId: toUserId },
            { $pull: { requests: fromUserId }, $addToSet: { contacts: fromUserId } }
        );
        // Also add reciprocal contact
        await Contacts.updateOne(
            { userId: fromUserId },
            { $addToSet: { contacts: toUserId } },
            { upsert: true }
        );
        res.status(200).json({ message: "Friend request accepted" });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
};

const getContactList = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ message: "Please login first." });
        }
        const contactsLs = await Contacts.findOne({ userId }).populate({
            path: "contacts",
            select: "name email avatarUrl",
        });
        if (!contactsLs) {
            return res.status(200).json({ message: "No Contacts Found.", contacts: [] });
        }
        const contactList = contactsLs.contacts.map(c => ({
            id: c._id,
            name: c.name,
            email: c.email,
            avatarUrl: c.avatarUrl
        }));
        // Also show pending requests
        const pendingRequests = contactsLs.requests || [];
        res.status(200).json({ message: "success", contacts: contactList, pendingRequests });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
}

// Controller to REJECT a friend request
const rejectFriendRequest = async (req, res) => {
    try {
        const { fromUserId } = req.body; // The user whose request is being rejected
        const toUserId = req.user._id;   // The user doing the rejecting

        if (!toUserId) { /* ... handle auth ... */ }

        const result = await Contacts.updateOne(
            { userId: toUserId },
            { $pull: { requests: fromUserId } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Friend request not found." });
        }

        res.status(200).json({ message: "Friend request rejected" });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
};

// Controller to REMOVE a contact (unfriend)
const removeContact = async (req, res) => {
    // This action should also use a transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { contactIdToRemove } = req.body;
        const userId = req.user._id;

        // 1. Remove from the initiator's contact list
        await Contacts.updateOne(
            { userId },
            { $pull: { contacts: contactIdToRemove } },
            { session }
        );

        // 2. Remove from the other user's contact list
        await Contacts.updateOne(
            { userId: contactIdToRemove },
            { $pull: { contacts: userId } },
            { session }
        );

        await session.commitTransaction();
        await session.endSession();

        res.status(200).json({ message: "Contact removed successfully" });
    } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        res.status(500).json({ message: "backend error", error: err.message });
    }
};

export {
    acceptFriendRequest,
    addContact,
    getContactList,
    getFriendRequests,
    sendFriendRequest,
    rejectFriendRequest,
    removeContact
};
