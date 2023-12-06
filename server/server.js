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
    } else {
      let groupId = message.groupName;

      // Join the group room
      socket.join(groupId);

      socket.group_ids = socket.group_ids || [];
      if (!socket.group_ids.includes(groupId)) socket.group_ids.push(groupId);
      userClientsMap[groupId] = userClientsMap[groupId] || { sockets: [], roomId: groupId };

      // Add the socket to the list of sockets for this group only if it doesn't exist
      if (!userClientsMap[groupId].sockets.some(s => s.id === socket.id)) {
        userClientsMap[groupId].sockets.push(socket);
      }

      io.to(groupId).emit('messageResponse', message);
    }

    console.log(userClientsMap, '11111111111111111111');
  });

  socket.on('disconnect', () => {
    closeConnections();
  });

  socket.on('close old connections', () => {
    closeConnections();
  });

  function closeConnections() {
    let socketIds = [...(socket?.user_ids || []), ...(socket?.group_ids || [])];
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach(socketId => {
        if (socketId && userClientsMap[socketId]) {
          socket.leave(userClientsMap[socketId].roomId);

          // If the socket is part of a group, remove it from the group's sockets array
          if (socket.group_ids && socket.group_ids.length > 0) {
            socket.group_ids.forEach(groupId => {
              let groupInfo = userClientsMap[groupId];
              if (groupInfo && groupInfo.sockets) {
                groupInfo.sockets = groupInfo.sockets.filter(s => s.id !== socket.id);

                // If no more sockets in the group, remove the group entry from the map
                if (groupInfo.sockets.length === 0) {
                  delete userClientsMap[groupId];
                }
              }
            });
          }

          // If the socket is part of an individual chat, remove it from the user's sockets array
          if (userClientsMap[socketId] && userClientsMap[socketId].sockets) {
            userClientsMap[socketId].sockets = userClientsMap[socketId].sockets.filter(s => s.id !== socket.id);

            // If no more sockets for the user, remove the user entry from the map
            if (userClientsMap[socketId].sockets.length === 0) {
              delete userClientsMap[socketId];
            }
          }
        }
      });
    }
    console.log(userClientsMap, '222222222222222222222222');
  }

  function emitMessageToIndividual(userId, roomId, message) {
    // Check if users are in the map, and add them if not
    socket.user_ids = socket.user_ids || [];
    socket.user_ids.push(userId);
    userClientsMap[userId] = userClientsMap[userId] || { sockets: [], roomId };

    // Add the socket to the list of sockets for this user only if it doesn't exist
    if (!userClientsMap[userId].sockets.some(s => s.id === socket.id)) {
      userClientsMap[userId].sockets.push(socket);
    }

    io.to(roomId).emit('messageResponse', message);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
