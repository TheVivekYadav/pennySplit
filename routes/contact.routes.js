import express from "express";
import {
 addContact
} from "../controllers/contact.controller.js";
import { isLoggedIn } from "../middleware/auth.js";
const router = express.Router();

router.post("/add", isLoggedIn, addContact);
router.get("/", isLoggedIn, getContactList);
router.post("/invite", isLoggedIn, sendInvite );

export default router;
