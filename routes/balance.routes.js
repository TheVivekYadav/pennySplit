import express from "express";
import { getGroupBalances } from "../controllers/balance.controller.js";
import { isLoggedIn } from "../middleware/auth.js";

const router = express.Router();

router.post('/:groupId', isLoggedIn, getGroupBalances);

export default router;
