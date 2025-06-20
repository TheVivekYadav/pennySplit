import Balance from "../models/balance.model.js";
import { GroupMembers } from "../models/groups.model.js";

const getGroupBalances = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const userId = req.user._id;

        const isMember = await GroupMembers.findOne({ groupId, userId });
        if (!isMember) {
            return res.status(403).json({ message: "You are not part of this group." });
        }

        const members = await GroupMembers.find({ groupId }).populate("userId", "name email");
        const memberMap = {};
        members.forEach(m => {
            memberMap[m.userId._id.toString()] = {
                name: m.userId.name,
                email: m.userId.email,
            };
        });

        const balances = await Balance.find({ groupId });

        const summary = [];

        for (const bal of balances) {
            if (bal.amount === 0) continue;

            const fromUser = memberMap[bal.from.toString()];
            const toUser = memberMap[bal.to.toString()];

            if (!fromUser || !toUser) continue;

            summary.push({
                from: fromUser.name,
                to: toUser.name,
                fromEmail: fromUser.email,
                toEmail: toUser.email,
                amount: bal.amount,
                status: `${fromUser.name} owes ${toUser.name} ₹${bal.amount}`,
            });
        }

        res.status(200).json({
            message: "Success",
            balances: summary,
        });
    } catch (err) {
        console.error("❌ Error in getGroupBalances:", err);
        res.status(500).json({ message: "Error fetching balances", error: err.message });
    }
};

export { getGroupBalances };
