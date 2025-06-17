import { Contacts } from "../models/contact.model.js";
import { User } from "../models/user.model.js"

const addContact = async (req, res) => {
    try {
        const { contact } = req.body
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ message: "Please login first." });
        }
        const contactUser = await User.findOne({ email: contact }).select("-password");
        if (!contactUser) {
            return res.status(404).json({ message: "Invite user via email", sendInvite: true })
        }
        if (contactUser._id.toString() === userId.toString()) {
            return res.status(400).json({ message: "Can't add yourself as contact." });
        }
        await Contacts.updateOne({ userId }, { $addToSet: { contacts: contactUser._id } }, { upsert: true });
        res.status(200).json({ message: "success", contactUser });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
};

const getContactList = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ message: "Please login first." });
        }
        const contactsLs = await Contacts.findOne({ userId }).populate({
            path: "contacts",
            select: "name email avatar_url",
        });
        if (!contactsLs) {
            return res.status(200).json({ message: "No Contacts Found.", contacts: [] });
        }
        const contactList = contactsLs.contacts.map(c => ({
            name: c.name,
            email: c.email,
            avatar_url: c.avatar_url
        }));
        res.status(200).json({ message: "success", contacts: contactList });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
}

const sendInvite = async (req, res) => {
    try{
        //will use nodeMail to send Invites. Need email and SMTP password ?
    }catch(err){
        res.status(500).json({ message: "backend error", error: err.message });
    }
}

export { addContact, getContactList, sendInvite }