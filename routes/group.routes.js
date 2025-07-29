import express from "express";
import {
  addMember,
  createGroup,
  getGroupbyId,
  getGroupDebts,
  getGroupMembers,
  listAllGroups,
  removeMember,
  updateGroup,
} from "../controllers/group.controller.js";
import { isLoggedIn } from "../middleware/auth.js";

const router = express.Router();

router.get("/", isLoggedIn, listAllGroups);
router.post("/create", isLoggedIn, createGroup);
router.get("/:id", isLoggedIn, getGroupbyId);
router.put("/:id", isLoggedIn, updateGroup);
router.get("/:id/members", isLoggedIn, getGroupMembers);

router.post("/:id/add-member", isLoggedIn, addMember);
router.delete("/:id/remove-member/:userId", isLoggedIn, removeMember);

router.get('/:groupId/debts', isLoggedIn, getGroupDebts);
export default router;
