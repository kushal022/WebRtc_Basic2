import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { loginCtrl, meCtrl, registerCtrl } from "../controllers/auth.js";

const router = express.Router();

// Register
router.post("/register", registerCtrl);

// Login
router.post("/login", loginCtrl);

// Get current user
router.get("/me", authMiddleware, meCtrl);

export default router;
