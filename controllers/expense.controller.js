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

