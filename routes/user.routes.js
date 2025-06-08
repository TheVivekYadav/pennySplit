import express from "express";
import {
  login,
  refreshAccessToken,
  register,
  verify,
} from "../controllers/user.controller.js";
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
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-access", refreshAccessToken);
router.get("/verify", verify);
export default router;
