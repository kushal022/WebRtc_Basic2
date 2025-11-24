import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createRoomCtrl, listRoomCtrl } from "../controllers/room.js";

const router = express.Router();

// create room (protected)
router.post("/create", authMiddleware, createRoomCtrl );

// get list (for dev/debug)
router.get("/list", authMiddleware, listRoomCtrl );

export default router;
