const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { ExpressPeerServer } = require("peer");

app.use(express.static("public"));

const peerServer = ExpressPeerServer(http, { debug: true });
app.use("/peerjs", peerServer);

let rooms = {};

io.on("connection", (socket) => {

    socket.on("create-room", () => {
        const roomId = Math.random().toString(36).substring(2,8).toUpperCase();
        rooms[roomId] = { users: [] };
        socket.emit("room-created", roomId);
    });

    socket.on("join-room", ({ roomId, peerId }) => {
        socket.join(roomId);

        if (!rooms[roomId]) return;

        rooms[roomId].users.push(peerId);

        socket.to(roomId).emit("user-connected", peerId);
        io.to(roomId).emit("user-list", rooms[roomId].users);

        socket.on("disconnect", () => {
            rooms[roomId].users = rooms[roomId].users.filter(id => id !== peerId);
            socket.to(roomId).emit("user-disconnected", peerId);
            io.to(roomId).emit("user-list", rooms[roomId].users);
        });
    });

    socket.on("chat", (msg, roomId) => {
        io.to(roomId).emit("chat", msg);
    });

});

http.listen(3000, () => console.log("Server running on 3000"));
