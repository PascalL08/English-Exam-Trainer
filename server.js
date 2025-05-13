const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const partners = {}; // Speichert die Socket-IDs von Partner 1 und 2

// Statische Dateien aus "public" bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('Client verbunden:', socket.id);

  // Partner identifizieren (p1 oder p2)
  socket.on('join', ({ partner }) => {
    partners[partner] = socket.id;
    console.log(`Partner ${partner} verbunden mit Socket-ID ${socket.id}`);
  });

  // Weiterleiten von Nachrichten zwischen Partnern
  socket.on('send-message', ({ to, type, data }) => {
    const targetSocketId = partners[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('message', { type, data, sender: getPartnerKey(socket.id) });
    } else {
      console.log(`Kein Socket für ${to} gefunden`);
    }
  });

  // Partnerzuordnung löschen bei Disconnect
  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
    for (const key in partners) {
      if (partners[key] === socket.id) {
        delete partners[key];
        console.log(`Partner ${key} entfernt`);
      }
    }
  });

  function getPartnerKey(socketId) {
    for (const key in partners) {
      if (partners[key] === socketId) return key;
    }
    return null;
  }
});

// Render verlangt 0.0.0.0
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
