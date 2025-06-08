import Expense from "../models/expense.model.js";
import { GroupMembers, Groups } from "../models/groups.model.js";

const createGroup = async (req, res) => {
  const input = req.body.group;
  const newGroup = new Groups(input);
  newGroup.save();

  res.status(200).json({ message: "success", newGroup });
};

const addUsersToGroup = async (req, res) => {
  const input = req.body.members;
  const newGroupMembers = new GroupMembers(input);
  newGroupMembers.save();
  res.status(200).json({ message: "success", newGroupMembers });
};

const createExpense = async (req, res) => {
  const input = req.body.expense;
  const newExpense = new Expense(input);
  newExpense.save();
  res.status(200).json({ message: "success", newExpense });
};

export { addUsersToGroup, createExpense, createGroup };
