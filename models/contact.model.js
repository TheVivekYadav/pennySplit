import mongoose from "mongoose";

const contactListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // pending friend requests
});

const Contacts = mongoose.model("Contacts", contactListSchema);
export { Contacts };
