import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Groups" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //let create split req on behalf
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    description: String,
    date: { type: Date, default: Date.now },
    splitType: {
      type: String,
      enum: ["equal", "percentage"],
      default: "equal",
    },
    splitAmong: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        percentage: Number,
      },
    ],
  },
  { timestamps: true },
);

const expenseSplitSchema = new mongoose.Schema({
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Groups" },
  amount: Number,
  isPaid: Boolean, //when person has to pay split
  isOwed: Boolean, //when person owns split
});

const Expense = mongoose.model("Expense", expenseSchema);
const ExpenseSplit = mongoose.model("ExpenseSplit", expenseSplitSchema);
export { Expense, ExpenseSplit };
