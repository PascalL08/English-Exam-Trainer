import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Für __dirname (weil ES Module):
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Statische Dateien aus "public" bereitstellen:
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  console.log('Client verbunden:', socket.id);

  socket.on('send-message', ({ to, type, data }) => {
    io.to(to).emit(type, { ...data, sender: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
  });
});

// ❗ Wichtig: Render verlangt genau das hier:
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
