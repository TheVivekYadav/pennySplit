import express from "express";
import {
  deleteUserById,
  emailVerification,
  getAllUsers,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
  updateRole,
  verify
} from "../controllers/user.controller.js";
import { isAdmin, isLoggedIn } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 *                   avatarUrl:
 *                     type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 *       500:
 *         description: Server error
 */
router.post("/register", register);
/**
 * @swagger
 * /api/auth/users/login:
 *   post:
 *     summary: Login a user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 *     responses:
 *       200:
 *         description: Login success
 *       404:
 *         description: Invalid credentials or user not found
 *       500:
 *         description: Server error
 */
router.post("/login", login);
/**
 * @swagger
 * /api/auth/users/refresh-access:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Refresh token missing
 *       403:
 *         description: Invalid or expired refresh token
 *       404:
 *         description: User not found
 */
router.post("/refresh-access", isLoggedIn, refreshAccessToken);
/**
 * @swagger
 * /api/auth/users/verify:
 *   get:
 *     summary: Verify if the user is authenticated
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User is authenticated
 */
router.get("/verify", isLoggedIn, verify);
router.get("/logout", isLoggedIn, logout);
router.post("/reset-password", isLoggedIn, resetPassword);

// Admin level
router.get('/get-all-users', isLoggedIn, isAdmin, getAllUsers);
router.post('/:id/update-role/:role', isLoggedIn, isAdmin, updateRole);
router.post('/:id/delete-user', isLoggedIn, isAdmin, deleteUserById);
router.post('/:token/email-verify', emailVerification);

export default router;
