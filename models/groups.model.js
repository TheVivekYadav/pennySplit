import mongoose, { Schema } from "mongoose";

const groupsSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    avatarUrl: String,
    equal_type: { type: Boolean, default: true }, //true when dividing equal contri
  },
  { timestamps: true },
);

const groupMembers = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Groups" },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Groups = mongoose.model("Groups", groupsSchema);
const GroupMembers = mongoose.model("GroupMembers", groupMembers);

export { GroupMembers, Groups };
