import { deleteGroupExpense, getGroupExpenses, handleCreateExpense, updateGroupExpense } from "../services/expense.service.js";
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

    const userCreating = req.user._id;

    if (!userCreating) {
      return res.status(401).json({ message: "Please login first." });
    }

    const newExpense = await handleCreateExpense(userCreating, parsed.data);
    
    res.status(201).json({ message: "success", expense: newExpense });

  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const getAllExpense = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user._id;

    const expenses = await getGroupExpenses(userId, groupId);
    res.status(200).json({ message: "success", expenses });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user._id;

    const result = await deleteGroupExpense(expenseId, userId);
    res.status(200).json(result);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};



const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userUpdating = req.user._id;


    const parsed = updateExpenseSchema.safeParse(req.body);
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
      (typeof expenseDetails.amount === 'number' && expenseDetails.amount !== oldExpense.amount) ||
      (expenseDetails.paidBy && expenseDetails.paidBy.toString() !== oldExpense.paidBy.toString());
    let expenseRes;
    // console.log(BigChanges);
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
    const updated = await updateGroupExpense(
      expenseId,
      userUpdating,
      parsed.data
    );

    res.status(200).json({ message: "success", expense: updated });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: "backend error", error: err.message });
  }
};

export { createExpense, deleteExpense, getAllExpense, updateExpense };

