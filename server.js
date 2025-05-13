const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

const partners = {}; // socketId => 'p1' oder 'p2'
const readyStatus = { p1: false, p2: false };

io.on('connection', socket => {
  console.log('Client verbunden:', socket.id);

  socket.on('join', ({ partner }) => {
    partners[socket.id] = partner;
  });

  socket.on('send-message', ({ to, type, data }) => {
    // Nachricht an bestimmten Partner weiterleiten
    const targetSocketId = Object.entries(partners).find(([, p]) => p === to)?.[0];
    if (targetSocketId) {
      io.to(targetSocketId).emit('message', { type, data, sender: partners[socket.id] });
    }
  });

  socket.on('partner-ready', () => {
    const partner = partners[socket.id];
    if (!partner) return;

    readyStatus[partner] = true;
    console.log('Bereit:', readyStatus);

    if (readyStatus.p1 && readyStatus.p2) {
      // Zurücksetzen für nächste Runde
      readyStatus.p1 = false;
      readyStatus.p2 = false;

      // An beide Partner senden
      Object.entries(partners).forEach(([sockId]) => {
        io.to(sockId).emit('message', { type: 'start-dialogue', data: {} });
      });
    }
  });

  socket.on('disconnect', () => {
    const partner = partners[socket.id];
    console.log('Client getrennt:', socket.id, partner);
    delete partners[socket.id];
    readyStatus.p1 = false;
    readyStatus.p2 = false;
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
