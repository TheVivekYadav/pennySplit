import express from "express";
import {createExpense, getAllExpense, deleteExpense,updateExpense} from "../controllers/expense.controller.js";
import { isLoggedIn } from "../middleware/auth.js";
const router = express.Router();

/**
 * @swagger
 * /api/groups/create:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               group:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Trip to Goa"
 *     responses:
 *       200:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newGroup:
 *                   $ref: '#/components/schemas/Group'
 */
router.post("/create", isLoggedIn,createExpense);
router.get("/:groupId",isLoggedIn,getAllExpense)
router.put("/:id",isLoggedIn,updateExpense)
router.delete("/:id",isLoggedIn,deleteExpense)
export default router;
