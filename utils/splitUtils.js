export const validateSplitAmongUsers = (splitAmong, memberIds) => {
    for (const entry of splitAmong) {
        const userId = typeof entry === "string" ? entry : entry.userId;
        if (!memberIds.includes(userId)) {
            return { valid: false, invalidUser: userId };
        }
    }
    return { valid: true };
};

export const calculateSplits = (groupId, splitType, splitAmong, amount, paidBy, expenseId) => {
    const splits = [];

    for (const entry of splitAmong) {
        const userId = entry.userId;
        const percentage = entry.percentage;
        const splitAmount = splitType === "equal"
            ? amount / splitAmong.length
            : (amount * percentage) / 100;

        splits.push({
            expenseId,
            groupId,
            userId,
            amount: splitAmount,
            isPaid: false,
            isOwed: true
        });
    }

    splits.push({
        expenseId,
        groupId,
        userId: paidBy,
        amount,
        isPaid: true,
        isOwed: false
    });

    return splits;
};


export const normalizeSplit = (arr) => {
    return arr.map((entry) =>
        typeof entry === "string"
            ? { userId: entry }
            : { userId: entry.userId, percentage: entry.percentage ?? null },
    );
};