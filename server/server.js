const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://172.16.0.165:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Dictionary to store connected clients based on user_id
let userClientsMap = {};

io.on('connection', (socket) => {
  socket.on('chat message', (message) => {
    const targetUsers = Array.isArray(message.to) ? message.to : [message.to];
    const sourceUserId = message.from.id;

    // Handle the source user separately
    const sourceUser = targetUsers.find((user) => user.id === sourceUserId);
    if (sourceUser) {
      const sourceUserRoomId = [sourceUserId, sourceUserId].sort().join('_');
      socket.user_id = sourceUserId;
      socket.join(sourceUserRoomId);
      console.log(sourceUserRoomId,'1111111111111111')
      emitMessageToRoom(sourceUserId, sourceUserRoomId, message);
    }

    targetUsers.forEach((user) => {
      const userId = user.id;

      if (!userId || userId === sourceUserId) return;

      // Use a unique combination of user IDs as the room ID
      const roomId = [userId, sourceUserId].sort().join('_');

      socket.user_id = userId;

      // Join the room
      socket.join(roomId);
      console.log(roomId,'2222222222222222222222222222')
      emitMessageToRoom(userId, roomId, message);
    });
  });

  socket.on('disconnect', () => {
    const userId = socket.user_id;

    if (userId && userClientsMap[userId]) {
      socket.leave(userClientsMap[userId].roomId);
      delete userClientsMap[userId];
    }
  });

  function emitMessageToRoom(userId, roomId, message) {
    io.to(roomId).emit('messageResponse', message);
    userClientsMap[userId] = { socket, roomId };
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
