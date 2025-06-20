import { Contacts } from "../models/contact.model.js";
import User from "../models/user.model.js"
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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
            select: "name email avatarUrl",
        });
        if (!contactsLs) {
            return res.status(200).json({ message: "No Contacts Found.", contacts: [] });
        }
        const contactList = contactsLs.contacts.map(c => ({
            name: c.name,
            email: c.email,
            avatarUrl: c.avatarUrl
        }));
        res.status(200).json({ message: "success", contacts: contactList });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
}

const sendInvite = async (req, res) => {
    try {
        const { contact } = req.body;
        const userId = req.user._id;
        if (!userId) {
            return res.status(401).json({ message: "Please login first." });
        }
        const transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const invitedBy = await User.findById(userId).select("-password");
        const info = await transporter.sendMail({
            from: `"PennySplit Team" <${process.env.EMAIL_USER}>`,
            to: `${contact}`,
            subject: "Invite to Join PennySplit",
            text: `Hi there,

${invitedBy.name} has invited you to join PennySplit — a simple way to track shared expenses and settle up with ease.

Get started now: https://pennySplit.com

See you inside,
The PennySplit Team`,
            html: `
  <p>Hi there,</p>
  <p><strong>${invitedBy.name}</strong> has invited you to join <strong>PennySplit</strong> — a simple way to track shared expenses and settle up with ease.</p>
  <p><a href="https://pennySplit.in">Click here to join PennySplit</a></p>
  <p>See you inside,<br/>The PennySplit Team</p>
`,

        });

        console.log("Message sent:", info.messageId);
        res.status(200).json({ message: "Invite sent successfully" });
    } catch (err) {
        res.status(500).json({ message: "backend error", error: err.message });
    }
}

export { addContact, getContactList, sendInvite }