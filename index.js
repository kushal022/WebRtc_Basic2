import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import healthRoutes from "./routes/health.js";
import registerSocketEvents from "./socket.js";
import attachSocket from "./socket.js";

dotenv.config();
const PORT = process.env.PORT || 8000;
const CLIENT_URL_HOSTINGER = process.env.CLIENT_URL_HOSTINGER;
const CLIENT_URL_HOSTINGER_NEW = process.env.CLIENT_URL_HOSTINGER_NEW;
const CLIENT_URL_NETLIFY = process.env.CLIENT_URL_NETLIFY;
const CLIENT_URL_LOCAL = process.env.CLIENT_URL_LOCAL;

const app = express();
const server = http.createServer(app);

// Connect DB
connectDB();

app.use(
  cors({
    origin: [CLIENT_URL_LOCAL, CLIENT_URL_HOSTINGER, CLIENT_URL_NETLIFY, CLIENT_URL_HOSTINGER_NEW],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/health", healthRoutes);

// Socket:
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL_LOCAL, CLIENT_URL_HOSTINGER, CLIENT_URL_NETLIFY, CLIENT_URL_HOSTINGER_NEW],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  },
});

//------------------------------
attachSocket(io);
//------------------------------

// io.on("connection", (socket) => registerSocketEvents(io, socket));

//------------------------------
// const emailToSocketIdMap = new Map();
// const socketIdToEmailMap = new Map();

// io.on("connection", (socket)=> {
//     console.log('Socket Connected: ' , socket.id);

//     socket.on('room:join', (data) => {
//         const { email, room } = data;
//         emailToSocketIdMap.set(email, socket.id);
//         socketIdToEmailMap.set(socket.id, email);
//         // Join Room:
//         socket.join(room);
//         // Notify all Room members:
//         io.to(room).emit("user:joined", { email, id: socket.id })
//         // Notify self joined the room
//         io.to(socket.id).emit("you-joined-room", data );
//     });

//     //Make call- Incomming call
//     socket.on("user:call", ({to, offer}) => {
//         console.log("in make call and emit incomming call")
//         io.to(to).emit("incomming:call", { from: socket.id, offer })
//     })

//     socket.on("call:accepted", ({ to, ans }) => {
//         console.log("In call accept ")
//         io.to(to).emit("call:accepted", { from: socket.id, ans })
//     })

//     socket.on("peer:nego:needed", ({ to, offer })=>{
//         io.to(to).emit("peer:nego:needed", { from: socket.id, offer })
//     })

//     socket.on('peer:nego:done', ({ to, ans })=>{
//         io.to(to).emit("peer:nego:final", { from: socket.id, ans});
//     })
// });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
