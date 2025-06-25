import mongoose from "mongoose";
import Balance from "../models/balance.model.js";
import { GroupMembers } from "../models/groups.model.js";
import Settlement from "../models/settlements.model.js";
const createSettlement = async (req, res) => {
    try {
        const { groupId, paidTo, amount, note = "" } = req.body;
        const paidBy = req.user._id;

        if (!groupId || !paidTo || !amount) {
            return res.status(400).json({ message: "Group ID, PaidTo, and Amount are required." });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "Amount must be a positive number." });
        }

        if (paidBy.toString() === paidTo.toString()) {
            return res.status(400).json({ message: "You cannot settle with yourself." });
        }

        // Check group membership
        const [isPayer, isReceiver] = await Promise.all([
            GroupMembers.findOne({ groupId, userId: paidBy }),
            GroupMembers.findOne({ groupId, userId: paidTo }),
        ]);

        if (!isPayer || !isReceiver) {
            return res.status(403).json({ message: "Both users must be members of the group." });
        }

        // Check current balance
        const balanceDoc = await Balance.findOne({ groupId, from: paidBy, to: paidTo });
        console.log(balanceDoc)
        const currentBalance = balanceDoc?.amount || 0;
        console.log(currentBalance)
        if (numericAmount > currentBalance) {
            return res.status(400).json({
                message: `Settlement amount exceeds owed balance. Max allowed: ₹${currentBalance}`,
            });
        }

        // Record settlement
        const settlement = await Settlement.create({
            groupId,
            paidBy,
            paidTo,
            amount: numericAmount,
            status: "pending",
            note,
        });

        // Update balance
        await Balance.updateOne(
            { groupId, from: paidBy, to: paidTo },
            { $inc: { amount: -numericAmount } }
        );

        res.status(201).json({ message: "Settlement recorded", settlement });
    } catch (err) {
        console.error("❌ Error in createSettlement:", err);
        res.status(500).json({ message: "Error settling up", error: err.message });
    }
};



const getSettlements = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const settlements = await Settlement.find({ groupId }).populate("paidBy paidTo", "name email");
        res.status(200).json({ message: "Success", settlements });
    } catch (err) {
        res.status(500).json({ message: "Error fetching settlements", error: err.message });
    }
};

const getSuggestedSettlement = async (req, res) => {
    try {
        const groupId = new mongoose.Types.ObjectId(req.params.groupId);
        const paidTo = new mongoose.Types.ObjectId(req.params.paidTo);
        const paidBy = new mongoose.Types.ObjectId(req.user._id);

        const balanceDoc = await Balance.findOne({
            groupId,
            from: paidBy,
            to: paidTo
        });

        const balance = balanceDoc?.amount || 0;

        res.status(200).json({
            message: "Success",
            canSettleAmount: balance
        });

    } catch (err) {
        console.error("❌ Error in getSuggestedSettlement:", err);
        res.status(500).json({ message: "Error getting suggested settlement", error: err.message });
    }
};
export { createSettlement, getSettlements, getSuggestedSettlement };

