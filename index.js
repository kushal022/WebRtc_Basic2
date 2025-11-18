const { Server } = require("socket.io");

const io = new Server(8000, {
    cors: {
    origin: ["http://localhost:5173", "https://phenomenal-meringue-084d5c.netlify.app/"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket)=> {
    console.log('Socket Connected: ' , socket.id);

    socket.on('room:join', (data) => {
        const { email, room } = data;
        emailToSocketIdMap.set(email, socket.id);
        socketIdToEmailMap.set(socket.id, email);
        // Join Room:
        socket.join(room);
        // Notify all Room members:
        io.to(room).emit("user:joined", { email, id: socket.id })
        // Notify self joined the room
        io.to(socket.id).emit("you-joined-room", data );
    });

    //Make call- Incomming call
    socket.on("user:call", ({to, offer}) => {
        console.log("in make call and emit incomming call")
        io.to(to).emit("incomming:call", { from: socket.id, offer })
    })

    socket.on("call:accepted", ({ to, ans }) => {
        console.log("In call accept ")
        io.to(to).emit("call:accepted", { from: socket.id, ans })
    })

    socket.on("peer:nego:needed", ({ to, offer })=>{
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer })
    })

    socket.on('peer:nego:done', ({ to, ans })=>{
        io.to(to).emit("peer:nego:final", { from: socket.id, ans});
    })
});