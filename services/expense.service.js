import { Expense, ExpenseSplit } from "../models/expense.model.js";
import { GroupMembers, Groups } from "../models/groups.model.js";
import { updateBalance } from "../utils/calculatebalance.js";
import { calculateSplits, validateSplitAmongUsers } from "../utils/splitUtils.js";

export const handleCreateExpense = async (userCreating, expenseDetails) => {
    const { splitAmong, groupId, amount, paidBy } = expenseDetails;

    const group = await Groups.findById(groupId);
    if (!group) throw { status: 404, message: "Group does not exist" };

    const groupMembers = await GroupMembers.find({ groupId });
    const memberIds = groupMembers.map(m => m.userId.toString());

    if (!memberIds.includes(userCreating.toString())) {
        throw { status: 403, message: "You are not part of this group." };
    }

    const { valid, invalidUser } = validateSplitAmongUsers(splitAmong, memberIds);
    if (!valid) {
        throw { status: 400, message: `User ${invalidUser} is not part of the group.` };
    }

    const splitType = group.equal_type ? "equal" : "percentage";

    // if (splitType === "percentage") {
    //     const total = splitAmong.reduce((sum, e) => sum + e.percentage, 0);
    //     if (total !== 100) {
    //         throw { status: 400, message: "Split percentages must add up to 100." };
    //     }
    // }

    const newExpense = await Expense.create({
        ...expenseDetails,
        createdBy: userCreating,
        splitType,
    });

    const splits = calculateSplits(groupId, splitType, splitAmong, amount, paidBy, newExpense._id);
    console.log(splits);
    await ExpenseSplit.insertMany(splits);

    for (const entry of splits) {
        if (entry.userId !== paidBy) {
            await updateBalance({
                groupId,
                from: entry.userId,
                to: paidBy,
                amount: entry.amount,
            });
        }
    }


    return newExpense;
};

export const getGroupExpenses = async (userId, groupId) => {
    if (!userId) {
        throw { status: 401, message: "Please login first." };
    }

    const isMember = await GroupMembers.findOne({ userId, groupId });
    if (!isMember) {
        throw { status: 403, message: "You are not part of this group." };
    }

    const expenses = await Expense.find({ groupId }).populate({
        path: "paidBy",
        select: "name email avatarUrl",
    });

    return expenses;
};

export const deleteGroupExpense = async (expenseId, userId) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
        throw { status: 404, message: "Expense not found" };
    }

    const member = await GroupMembers.findOne({
        userId,
        groupId: expense.groupId,
    });

    if (!member) {
        throw { status: 403, message: "You are not part of this group." };
    }

    if (!member.isAdmin) {
        throw { status: 403, message: "Only admins can delete." };
    }

    await Expense.deleteOne({ _id: expenseId });
    await ExpenseSplit.deleteMany({ expenseId });

    return { message: "success" };
};

export const updateGroupExpense = async (expenseId, userUpdating, expenseDetails) => {
    const { splitAmong, amount } = expenseDetails;

    if (!splitAmong || splitAmong.length === 0) {
        throw { status: 400, message: "splitAmong cannot be empty." };
    }

    const oldExpense = await Expense.findById(expenseId);
    if (!oldExpense) throw { status: 404, message: "Expense not found" };

    if (oldExpense.createdBy.toString() !== userUpdating.toString()) {
        throw { status: 403, message: "Only the person who created can update." };
    }

    const oldNormalized = normalizeSplit(oldExpense.splitAmong);
    const newNormalized = normalizeSplit(splitAmong);

    const bigChange =
        !isEqual(newNormalized, oldNormalized) ||
        (amount && amount !== oldExpense.amount);

    let expenseRes;

    if (bigChange) {
        // Validate percentage total if required
        if (oldExpense.splitType === "percentage") {
            const total = splitAmong.reduce((sum, e) => sum + e.percentage, 0);
            if (total !== 100) {
                throw { status: 400, message: "Split percentages must add up to 100." };
            }
        }

        expenseRes = await Expense.findByIdAndUpdate(expenseId, expenseDetails, {
            new: true,
        });

        await ExpenseSplit.deleteMany({ expenseId });

        const newSplits = calculateSplits(
            expenseRes.splitType,
            splitAmong,
            expenseRes.amount,
            expenseRes.paidBy,
            expenseId
        );

        await ExpenseSplit.insertMany(newSplits);
    } else {
        expenseRes = await Expense.findByIdAndUpdate(expenseId, expenseDetails, {
            new: true,
        });
    }

    return expenseRes;
};