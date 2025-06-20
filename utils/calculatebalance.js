import Balance from "../models/balance.model.js";


export const updateBalance = async ({ groupId, from, to, amount }) => {
    if (from.toString() === to.toString()) return;

    const existing = await Balance.findOne({ groupId, from, to });

    if (existing) {
        existing.amount += amount;
        if (existing.amount <= 0) {
            await Balance.deleteOne({ _id: existing._id });
        } else {
            await existing.save();
        }
    } else if (amount > 0) {
        await Balance.create({ groupId, from, to, amount });
    }
};

export const getGroupBalances = async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const balances = await Balance.find({ groupId }).populate("from to", "name");

        const filtered = balances
            .filter(b => b.amount > 0)
            .map(b => ({
                from: b.from.name,
                to: b.to.name,
                amount: b.amount
            }));

        res.status(200).json({ message: "success", debts: filtered });
    } catch (err) {
        res.status(500).json({ message: "error", error: err.message });
    }
};