import { v4 as uuidv4 } from "uuid";
import Room from "../models/Room.js";

export const createRoomCtrl = async (req, res) => {
  try {
    const roomId = req.body.roomId || uuidv4().split("-")[0];
    let room = await Room.findOne({ roomId });
    if (room) console.log("Room Exists: ", roomId);
    if (!room) {
      room = await Room.create({ roomId });
      console.log("New Room Created: ", roomId);
    }
    res
      .status(200)
      .json({ success: true, ok: true, room: { roomId: room.roomId } });
  } catch (err) {
    console.error("Error in create room: ", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server Error When create Room!",
        ok: false,
      });
  }
};

// Get/List Rooms:
export const listRoomCtrl = async (req, res) => {
  const rooms = await Room.find().sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, rooms });
};
