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
  // Handle user joining room
  socket.on('join room', (users) => {
    const joinedUsers = Array.isArray(users) ? users : [users];
    
    joinedUsers.forEach((user) => {
      const userId = user.id;

      // Ensure user_id is present
      if (!userId) return;

      // Assign user_id to the socket
      socket.user_id = userId;

      // Add the socket to the user's list of sockets
      if (userClientsMap[userId]) {
        userClientsMap[userId].push(socket);
      } else {
        userClientsMap[userId] = [socket];
      }
    });
  });

  // Handle chat messages
  socket.on('chat message', (message) => {
    console.log(message,'mmmmmmmmmmmmmmmmmmmmmmmmmmmmm')
    const targetUserIds = Array.isArray(message.to.id) ? message.to.id : [message.to.id];
    const sourceUserId = message.from.id;

    targetUserIds.forEach((targetUserId) => {
      // Emit the message to all sockets of the target user
      if (targetUserId && userClientsMap[targetUserId]) {
        userClientsMap[targetUserId].forEach((clientSocket) => {
          clientSocket.emit('messageResponse', message);
        });
      }
    });

    // Emit the message to all sockets of the source user
    if (sourceUserId && userClientsMap[sourceUserId]) {
      userClientsMap[sourceUserId].forEach((clientSocket) => {
        clientSocket.emit('messageResponse', message);
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
