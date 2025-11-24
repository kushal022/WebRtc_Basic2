import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: { type: String },      // DB user id (optional for anonymous usage)
  socketId: { type: String },    // socket id
  username: { type: String }     // username for display
}, { _id: false });

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    participants: { type: [participantSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
