import mongoose from "mongoose";

const balanceSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Groups",
        required: true,
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // The user who owes money
        required: true,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // The user who is owed money
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    }
}, { timestamps: true });

balanceSchema.index({ groupId: 1, from: 1, to: 1 }, { unique: true }); 

const Balance = mongoose.model("Balance", balanceSchema);

export default Balance;
