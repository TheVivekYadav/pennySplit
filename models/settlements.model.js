import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Groups" },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //let create split req on behalf
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: Number,
    method: String, //mode of settlement
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    settledAt: { type: Date },
  },
  { timestamps: true },
);

const Settlement = mongoose.model("Settlement", settlementSchema);
export default Settlement;
