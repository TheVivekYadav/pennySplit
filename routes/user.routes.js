import express from "express";
import { googleAuthCallback, googleAuthRedirect } from "../controllers/googleAuth.controller.js";
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

router.post("/register", register)
router.post("/login", login);
router.post("/refresh-access", refreshAccessToken);

router.get("/verify", isLoggedIn, verify);
router.get("/logout", logout);
router.post("/reset-password", isLoggedIn, resetPassword);

// Admin level
router.get('/get-all-users', isLoggedIn, isAdmin, getAllUsers);
router.post('/:id/update-role/:role', isLoggedIn, isAdmin, updateRole);
router.post('/:id/delete-user', isLoggedIn, isAdmin, deleteUserById);
router.post('/:token/email-verify', emailVerification);

// googleAuth routes
router.get("/google", googleAuthRedirect);
router.get("/google/callback", googleAuthCallback);

export default router;
