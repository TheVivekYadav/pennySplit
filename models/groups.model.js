import mongoose, { Schema } from "mongoose";
import User from './user.model.js';

const groupsSchema = new mongoose.Schema({
    name: String,
}, { timestamps: true })

const Groups = mongoose.model('Groups', groupsSchema)

const groupMembers = new mongoose.Schema({
    userid: [{ type: Schema.Types.ObjectId, ref: User }],
    groupId: { type: Schema.Types.ObjectId, ref: Groups }
}, { timestamps: true })

const GroupMembers = mongoose.model('GroupMembers', groupMembers)

export { GroupMembers, Groups };
