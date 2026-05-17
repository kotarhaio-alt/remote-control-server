const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 10e6,
  pingTimeout: 60000,
  pingInterval: 25000
});

const PASSWORD = "your-secret-password";

app.use(express.static(path.join(__dirname, 'public')));

let connectedPhone = null;

io.on('connection', (socket) => {
  console.log('اتصل جهاز:', socket.id);

  socket.on('auth', (password) => {
    if (password === PASSWORD) {
      socket.authenticated = true;
      socket.emit('auth-result', { success: true });
    } else {
      socket.emit('auth-result', { success: false });
      socket.disconnect();
    }
  });

  socket.on('register', (type) => {
    if (!socket.authenticated) return;
    if (type === 'phone') {
      connectedPhone = socket.id;
      io.emit('status', { phone: true });
    }
    if (type === 'browser') {
      io.emit('status', { phone: connectedPhone !== null });
    }
  });

  socket.on('screen-frame', (frameData) => {
    if (!socket.authenticated) return;
    socket.broadcast.emit('screen-frame', frameData);
  });

  socket.on('touch-event', (data) => {
    if (!socket.authenticated) return;
    socket.broadcast.emit('touch-event', data);
  });

  socket.on('key-event', (data) => {
    if (!socket.authenticated) return;
    socket.broadcast.emit('key-event', data);
  });

  socket.on('disconnect', () => {
    if (socket.id === connectedPhone) {
      connectedPhone = null;
      io.emit('status', { phone: false });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log('السيرفر شغال على البورت ' + PORT);
});
