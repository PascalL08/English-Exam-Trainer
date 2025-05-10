const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const clients = {};

io.on("connection", (socket) => {
  socket.on("join", ({ partner }) => {
    socket.partner = partner;
    clients[partner] = socket;

    console.log(`Partner ${partner} connected`);
  });

  socket.on("message", ({ to, type, data }) => {
    if (clients[to]) {
      clients[to].emit("message", { type, data, sender: socket.partner });
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      delete clients[socket.partner];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
