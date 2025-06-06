import express from 'express';
import { register } from '../controllers/user.controller.js';
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: register user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Used to register user
 */
router.post('/', register)

export default router;