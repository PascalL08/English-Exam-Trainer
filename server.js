const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Statische Dateien aus "public" bereitstellen:
app.use(express.static(path.join(__dirname, 'public')));

// Verbundene Clients nach Partner speichern
const partners = {};

io.on('connection', socket => {
  console.log('Client verbunden:', socket.id);

  socket.on('join', ({ partner }) => {
    partners[partner] = socket.id;
    console.log(`Partner ${partner} registriert:`, socket.id);
  });

  socket.on('message', ({ to, type, data }) => {
    const targetId = partners[to];
    if (targetId) {
      io.to(targetId).emit('message', { type, data, sender: socket.id });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
    // Partner entfernen
    for (const key in partners) {
      if (partners[key] === socket.id) {
        delete partners[key];
        console.log(`Partner ${key} entfernt`);
      }
    }
  });
});

// ❗ Wichtig: Render verlangt genau das hier:
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
