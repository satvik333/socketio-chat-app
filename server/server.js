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
    Object.entries(userClientsMap).forEach(([userId, sockets]) => {
      if (sockets.length > 1) {
        sockets.pop();
      }
    });

    const targetUsers = Array.isArray(message.to) ? message.to : [message.to];
    const sourceUserId = message.from.id;
    const roomId = message.roomId;

    // Leave all existing rooms
    socket.rooms.forEach((room) => {
      socket.leave(room);
    });

    targetUsers.forEach((user) => {
      const userId = user.id;

      if (!userId) return;

      socket.user_id = userId;

      socket.join(roomId); // Use the unique room ID here

      if (userClientsMap[userId]) {
        delete userClientsMap[userId];
        userClientsMap[userId] = [{ socket, roomId }];
      } else {
        userClientsMap[userId] = [{ socket, roomId }];
      }
    });

    if (sourceUserId && userClientsMap[sourceUserId]) {
      userClientsMap[sourceUserId].forEach(({ socket: clientSocket }) => {
        clientSocket.emit('messageResponse', message);
      });
    }

    targetUsers.forEach((targetUser) => {
      const targetUserId = targetUser.id;
      if (targetUserId && userClientsMap[targetUserId]) {
        userClientsMap[targetUserId].forEach(({ socket: clientSocket, roomId: clientRoomId }) => {
          clientSocket.to(clientRoomId).emit('messageResponse', message);
          if (userClientsMap[targetUserId].length > 1) {
            userClientsMap[targetUserId].pop();
          }
        });
      }
    });
  });

  socket.on('disconnect', () => {
    const userId = socket.user_id;

    if (userId && userClientsMap[userId]) {
      userClientsMap[userId] = userClientsMap[userId].filter(({ socket: clientSocket }) => clientSocket !== socket);

      if (userClientsMap[userId].length === 0) {
        delete userClientsMap[userId];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
