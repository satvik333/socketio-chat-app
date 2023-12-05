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
    let targetUsers = Array.isArray(message.to) ? message.to : [message.to];
    let sourceUserId = message.from.id;

    if (targetUsers.length === 1) {
      let userId = targetUsers[0].id;

      if (!userId || userId === sourceUserId) return;

      // Use a unique combination of user IDs as the room ID
      let roomId = [userId, sourceUserId].sort().join('_');

      // Join the room
      socket.join(roomId);
      emitMessageToIndividual(userId, roomId, message);
    }
    else {
      let roomId;
      targetUsers.forEach((user) => {
        let userId = user.id;

        if (!userId || userId === sourceUserId) return;

        // Use a unique combination of user IDs as the room ID
        roomId = message.groupName;

        // Join the room
        socket.join(roomId);

        socket.user_ids = socket.user_ids || [];
        socket.user_ids.push(userId);
        userClientsMap[roomId] = userClientsMap[roomId] || { socket, roomId };
      });
      console.log(roomId,'rrrrrrrrrrrrrrr', userClientsMap)

      io.to(roomId).emit('messageResponse', message);
    }
  });

  socket.on('disconnect', () => {
    closeConnections();
  });

  socket.on('close old connections', () => {
    closeConnections();
  });

  function closeConnections() {
    let userIds = socket.user_ids;

    if (userIds && userIds.length > 0) {
      userIds.forEach(userId => {
        if (userId && userClientsMap[userId]) {
          socket.leave(userClientsMap[userId].roomId);
          delete userClientsMap[userId];
        }
      });
    }
  }

  function emitMessageToIndividual(userId, roomId, message) {
    // Check if users are in the map, and add them if not
    socket.user_ids = socket.user_ids || [];
    socket.user_ids.push(userId);
    userClientsMap[userId] = userClientsMap[userId] || { socket, roomId };

    // Check if source user is in the map, and add if not
    if (!userClientsMap.hasOwnProperty(message.from.id)) {
      socket.user_ids.push(message.from.id);
      userClientsMap[message.from.id] = { socket, roomId };
    }

    console.log(roomId,'rrrrrrrrrrrrrrr', userClientsMap)

    io.to(roomId).emit('messageResponse', message);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
