import express from "express";
import {
    acceptFriendRequest, getContactList, getFriendRequests, rejectFriendRequest, removeContact, sendFriendRequest
} from "../controllers/contact.controller.js";
import { isLoggedIn } from "../middleware/auth.js";
const router = express.Router();

router.get("/", isLoggedIn, getContactList);
router.post("/friend-request", isLoggedIn, sendFriendRequest);
router.get("/friend-requests", isLoggedIn, getFriendRequests);
router.post("/accept-requests", isLoggedIn, acceptFriendRequest);
router.post("/reject-requests", isLoggedIn, rejectFriendRequest);
router.post("/remove-contact", isLoggedIn, removeContact);

export default router;
