import express from "express";
import { createSettlement, getSuggestedSettlement } from "../controllers/settlements.controller.js";
import { isLoggedIn } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", isLoggedIn, createSettlement);
// router.get("/:groupId", isLoggedIn, getSettlements);
router.get("/suggest/:groupId/:paidTo", isLoggedIn, getSuggestedSettlement)

export default router;
