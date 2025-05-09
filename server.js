import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('Verbunden:', socket.id);

  socket.on('send', ({ to, type, data }) => {
    io.to(to).emit(type, { ...data, sender: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Getrennt:', socket.id);
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log('Server läuft auf Port', process.env.PORT || 3000);
});
