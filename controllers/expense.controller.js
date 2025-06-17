import { Expense, ExpenseSplit } from "../models/expense.model.js";
import isEqual from "lodash.isequal";
import { GroupMembers, Groups } from "../models/groups.model.js";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "../validations/expense.validation.js";

const createExpense = async (req, res) => {
  try {
    const input = req.body;
    const parsed = createExpenseSchema.safeParse(input);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }
    const expenseDetails = parsed.data;
    const { splitAmong } = expenseDetails;
    const userCreating = req.user._id;
    if (!userCreating) {
      return res.status(401).json({ message: "Please login first." });
    }

    const group = await Groups.findById(expenseDetails.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = await GroupMembers.findOne({
      userId: userCreating,
      groupId: expenseDetails.groupId,
    });
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not part of this group." });
    }

    const splitType = group.equal_type ? "equal" : "percentage";
    // if (splitType === 'percentage') {
    //   const total = splitAmong.reduce((sum, e) => sum + e.percentage, 0);
    //   if (total !== 100) {
    //     return res.status(400).json({ message: "Split percentages must add up to 100." });
    //   }
    // }
    // console.log({ ...expenseDetails, createdBy: userCreating, splitType });

    const newExpense = await Expense.create({
      ...expenseDetails,
      createdBy: userCreating,
      splitType,
    });

    const splits = [];
    if (splitType == "equal") {
      const splitAmnt = expenseDetails.amount / splitAmong.length;
      for (const entry of splitAmong) {
        const userId = typeof entry === "string" ? entry : entry.userId;
        splits.push({
          expenseId: newExpense._id,
          userId,
          amount: splitAmnt,
          isPaid: expenseDetails.paidBy === userId,
          isOwed: expenseDetails.paidBy !== userId,
        });
      }
    } else if (splitType === "percentage") {
      for (const entries of splitAmong) {
        const splitAmnt = (expenseDetails.amount * entries.percentage) / 100;
        splits.push({
          expenseId: newExpense._id,
          userId: entries.userId,
          amount: splitAmnt,
          isPaid: expenseDetails.paidBy === entries.userId,
          isOwed: expenseDetails.paidBy !== entries.userId,
        });
      }
    }
    await ExpenseSplit.insertMany(splits);
    res.status(201).json({ message: "success", expense: newExpense });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const getAllExpense = async (req, res) => {
  try {
    const groupId = req.params.groupId;
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
    const expenses = await Expense.find({ groupId }).populate({
      path: "paidBy",
      select: "name email avatarUrl",
    });
    res.status(200).json({ message: "success", expenses });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user._id;
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    const checkAdmin = await GroupMembers.findOne({
      userId,
      groupId: expense.groupId,
    });
    if (!checkAdmin) {
      return res
        .status(403)
        .json({ message: "You are not part of this group." });
    }
    if (!checkAdmin.isAdmin) {
      return res.status(403).json({ message: "Only admins can delete." });
    }
    await Expense.deleteOne({ _id: expenseId });
    await ExpenseSplit.deleteMany({ expenseId });
    res.status(200).json({ message: "success" });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};
const normalizeSplit = (arr) => {
  arr.map((entry) =>
    typeof entry === "string"
      ? { userId: entry }
      : { userId: entry.userId, percentage: entry.percentage ?? null },
  );
};
const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userUpdating = req.user._id;
    const input = req.body;
    const parsed = updateExpenseSchema.safeParse(input);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.errors });
    }
    const expenseDetails = parsed.data;
    const { splitAmong } = expenseDetails;
    if (!splitAmong || splitAmong.length === 0) {
      return res.status(400).json({ message: "splitAmong cannot be empty." });
    }
    const oldExpense = await Expense.findById(expenseId);
    if (oldExpense.createdBy.toString() !== userUpdating.toString()) {
      return res
        .status(403)
        .json({ message: "Only the person who created can update." });
    }
    const newNormalized = normalizeSplit(splitAmong);
    const oldNormalized = normalizeSplit(oldExpense.splitAmong);

    const BigChanges =
      !isEqual(newNormalized, oldNormalized) ||
      (expenseDetails.amount && expenseDetails.amount !== oldExpense.amount);
    let expenseRes;
    console.log(BigChanges);
    if (BigChanges) {
      expenseRes = await Expense.findByIdAndUpdate(expenseId, expenseDetails, {
        new: true,
      });
      await ExpenseSplit.deleteMany({ expenseId: expenseRes._id });
      const splits = [];
      if (expenseRes.splitType == "equal") {
        const splitAmnt = expenseRes.amount / splitAmong.length;
        for (const entry of splitAmong) {
          const userId = typeof entry === "string" ? entry : entry.userId;
          splits.push({
            expenseId: expenseRes._id,
            userId,
            amount: splitAmnt,
            isPaid: expenseRes.paidBy === userId,
            isOwed: expenseRes.paidBy !== userId,
          });
        }
      } else if (expenseRes.splitType === "percentage") {
        for (const entries of splitAmong) {
          const splitAmnt = (expenseRes.amount * entries.percentage) / 100;
          splits.push({
            expenseId: expenseRes._id,
            userId: entries.userId,
            amount: splitAmnt,
            isPaid: expenseRes.paidBy === entries.userId,
            isOwed: expenseRes.paidBy !== entries.userId,
          });
        }
      }
      await ExpenseSplit.insertMany(splits);
    } else {
      expenseRes = await Expense.findByIdAndUpdate(expenseId, expenseDetails, {
        new: true,
      });
    }
    res.status(200).json({ message: "success", expense: expenseRes });
  } catch (err) {
    res.status(500).json({ message: "backend error", error: err.message });
  }
};

export { createExpense, getAllExpense, deleteExpense, updateExpense };
