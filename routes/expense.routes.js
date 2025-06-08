import express from "express";
import {
  addUsersToGroup,
  createExpense,
  createGroup,
} from "../controllers/expense.controller.js";
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
router.post("/create", createGroup);
router.post("/add", addUsersToGroup);
router.post("/expense", createExpense);
export default router;
