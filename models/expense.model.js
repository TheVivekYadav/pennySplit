import mongoose from "mongoose";
import { Groups } from "./groups.model.js";
import User from "./user.model.js";

const expense = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: Groups },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: User },
    description: String,
    amount: Number
}, { timestamps: true })

const Expense = mongoose.model("Expense", expense);

export default Expense;
