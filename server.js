const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const partners = {};     // { p1: socket.id, p2: socket.id }
const readyStatus = {};  // { p1: false, p2: false }

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('Client verbunden:', socket.id);

  socket.on('join', ({ partner }) => {
    partners[partner] = socket.id;
    readyStatus[partner] = false;
    console.log(`Partner ${partner} hat sich verbunden`);
  });

  socket.on('send-message', ({ to, type, data }) => {
    const targetId = partners[to];
    if (targetId) {
      io.to(targetId).emit('message', { type, data, sender: getPartnerKey(socket.id) });
    }
  });

  socket.on('ready', () => {
    const partner = getPartnerKey(socket.id);
    if (!partner) return;
    readyStatus[partner] = true;
    console.log(`${partner} ist bereit`);

    if (readyStatus.p1 && readyStatus.p2) {
      // Beide sind bereit – sende an beide das Startsignal
      io.to(partners.p1).emit('message', { type: 'start-dialogue', data: {} });
      io.to(partners.p2).emit('message', { type: 'start-dialogue', data: {} });

      // Reset für den nächsten Durchlauf (optional)
      readyStatus.p1 = false;
      readyStatus.p2 = false;
    }
  });

  socket.on('disconnect', () => {
    const partner = getPartnerKey(socket.id);
    if (partner) {
      delete partners[partner];
      delete readyStatus[partner];
      console.log(`${partner} hat die Verbindung getrennt`);
    }
  });

  function getPartnerKey(socketId) {
    return Object.keys(partners).find(key => partners[key] === socketId);
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
