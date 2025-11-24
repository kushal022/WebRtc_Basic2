import Room from "./models/Room.js";
import jwt from "jsonwebtoken";
import user from "./models/User.js";

export default function attachSocket(io) {
  //^ authentication during handshake:
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("⚠️⚠️⚠️ Require Token during socket handshake!");
      return next(new Error("Authentication error: token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { userId: decoded.userId, username: decoded.username };
      next();
    } catch (err) {
      console.error("Socket auth error:", err);
      next(new Error("Authentication error: invalid token"));
    }
  });

  //^----------------------------------------------
  io.on("connection", (socket) => {
    console.log(
      "👤 Socket Connected: ",
      socket.id,
      "username: ",
      socket.user?.username
    );

    //^ join-room: add participant and notify others
    socket.on("room:join", async ({ roomId }) => {
      console.log(`---------- In join room : ${roomId} ----------`);
      if (!roomId) return;

      const participant = {
        userId: socket.user?.userId || null,
        socketId: socket.id,
        username: socket.user?.username || "anonymous",
      };
      console.log("participant for room join: ", participant);

      const room = await Room.findOne({ roomId });

      if (!room) {
        console.log(`Room ${roomId} not found, creating a new one`);

        await Room.create({
          roomId,
          participants: [participant],
        });

        console.log("New room created and user added:", roomId);
      } else {
        const userExist = room?.participants?.find(
          (p) => p.userId === socket.user?.userId
        );
        if (userExist) {
          await Room.updateOne(
            { roomId, "participants.userId": socket.user?.userId },
            { $set: { "participants.$.socketId": socket.id } }
          );
        } else {
          const room3 = await Room.findOneAndUpdate(
            { roomId },
            { $addToSet: { participants: participant } },
            { upsert: true, new: true }
          );
          console.log("New user join room: ", roomId);
        }
      }

      socket.join(roomId); // Self join
      // Notify self:
      io.to(socket.id).emit("you-joined-room", { ...participant, roomId });
      // Notify others
      io.to(roomId).emit("user:joined", { ...participant, roomId });

      // reply to joining socket with current participants (excluding self)
      // const others = (room?.participants || []).filter((p) => p.socketId !== socket.id);
      // if (others) io.to(roomId).emit("room:participants", others);
    });

    //^ --------- Make call- Incomming call
    socket.on("make:call", async ({ callTo, offer, roomId }) => {
      //----peter call to --> somlu 
      const room = await Room.findOne({ roomId });
      const callToUser = room?.participants?.find((p) => p.socketId === callTo);
      console.log(
        `---- Make call: ${socket?.user?.username}:( ${socket.id}) calling to ➡️  ${callToUser.username}: ${callTo} ----`
      );
      io.to(callTo).emit("incomming:call", {
        callFrom: { socketId: socket.id, username: socket?.user?.username },
        offer,
      });
    });

    //^ --------- Accepted call- Incomming call
    socket.on("call:accepted", async ({ to, ans, roomId }) => {
      console.log(
        "---- In call accept: call accepted by ",
        socket.user?.username,
        ":",
        socket.id
      );
      io.to(to).emit("call:accepted", {
        by: { username: socket.user?.username, socketId: socket.id },
        ans,
      });
    });

    socket.on('call:hangup', ({to})=>{
      console.log("---- Call HungUp by ----", socket.user?.username)
      io.to(to).emit('call:hangup',{from:socket.id})
    })

    //^---------- Nego

    socket.on("nego:needed:send", ({ to, offer }) => {
      const caller = {username:socket.user?.username ,socketId: socket.id}
      console.log(`---- nego:needed:send ---- from: ${socket.id} :- ${caller.username}`);
      io.to(to).emit("nego:needed:incomming", { from: caller , offer });
    });

    socket.on("nego:done", ({ to, ans }) => {
      console.log(`---- nego:done ----`);
      io.to(to.socketId).emit("nego:final", { from: socket.id, ans });
      console.log(`---- nego:final ----`);
    });

    

    //!-------------------------------------------
    // signaling events
    socket.on("offer", ({ to, offer }) => {
      if (!to || !offer) return;
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      if (!to || !answer) return;
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      if (!to || !candidate) return;
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // leave-room gracefully
    socket.on("leave-room", async ({ roomId }) => {
      socket.leave(roomId);
      await Room.findOneAndUpdate(
        { roomId },
        { $pull: { participants: { socketId: socket.id } } }
      );
      socket.to(roomId).emit("user-left", { socketId: socket.id });
    });

    // disconnect: remove participant from all rooms it was part of
    socket.on("disconnect", async (reason) => {
      console.log("❌ Disconnected:", socket.id, socket.user?.username);
      console.log("reason: ", reason);
      await Room.updateMany(
        {},
        { $pull: { participants: { socketId: socket.id } } }
      );
      // broadcast to rooms - socket.rooms is a Set that contains socket.id plus joined rooms
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("user-left", { socketId: socket.id });
        }
      });
    });
  });
}

// old code
const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

export function registerSocketEvents(io, socket) {
  console.log("Socket Connected: ", socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);
    // Join Room:
    socket.join(room);
    // Notify all Room members:
    io.to(room).emit("user:joined", { email, id: socket.id });
    // Notify self joined the room
    io.to(socket.id).emit("you-joined-room", data);
  });

  //Make call- Incomming call
  socket.on("make:call", ({ to, offer }) => {
    console.log("in make call and emit incomming call");
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    console.log("In call accept ");
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed:send", ({ from, to, offer }) => {
    console.log(`---- nego:needed:send ---- from: ${from}`);
    io.to(to).emit("peer:nego:needed:incomming", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log(`---- nego:needed:done ----`);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
}

//not in use
const so = () => {
  function registerSocketEvents(io, socket) {
    console.log("User connected:", socket.id);

    socket.on("join-room", async ({ roomId }) => {
      socket.join(roomId);

      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({ roomId, users: [socket.id] });
      } else {
        room.users.push(socket.id);
        await room.save();
      }

      socket.to(roomId).emit("user-joined", socket.id);
    });

    socket.on("offer", ({ offer, to }) => {
      io.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
      io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", async () => {
      await Room.updateMany({}, { $pull: { users: socket.id } });
      console.log("User disconnected:", socket.id);
    });
  }
};

// ----------- Client socket
// import { io } from "socket.io-client";
// const token = localStorage.getItem("token");

// const socket = io("http://localhost:8000", {
//   auth: { token }
// });

// // join a room
// socket.emit("join-room", { roomId: "abc123" });

// // listen for participants
// socket.on("room-participants", (participants) => {
//   // participants: [{ userId, socketId, username }]
// });
