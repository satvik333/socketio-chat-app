const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const connection = require('./databaseConnection');
const usersRoute = require('./routes/usersRoutes');
const configParams = require('./backendConfig');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: [`${configParams.appEnv}:3000`, `${configParams.appEnv}:3001`, 'http://172.16.0.165:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // reconnection options
  reconnection: true,
  reconnectionAttempts: 10, // Set the number of attempts
  reconnectionDelay: 1000, // Set the delay between attempts (in milliseconds)
});

app.use('/', usersRoute);

let userClientsMap = {};

io.on('connection', (socket) => {
  socket.group_ids = [];

  socket.on('typing', (message) => {
    let targetUsers = Array.isArray(message.to) ? message.to : [message.to];
    let sourceUserId = message.from.id;

    if (targetUsers.length === 1) {
      let userId = targetUsers[0]?.id;

      if (!userId || userId === sourceUserId) return;

      let roomId = [userId, sourceUserId].sort().join('_');

      socket.join(roomId);

      socket.user_ids = socket.user_ids || [];
      socket.user_ids.push(userId);
      userClientsMap[userId] = userClientsMap[userId] || { sockets: [], roomId };

      if (!userClientsMap[userId].sockets.some(s => s.id === socket.id)) {
        userClientsMap[userId].sockets.push(socket);
      }

      io.to(roomId).emit('typing', message);

    } else {
      let groupId = message.groupName;

      socket.join(groupId);

      if (!socket.group_ids.includes(groupId)) {
        socket.group_ids.push(groupId);
      }

      userClientsMap[groupId] = userClientsMap[groupId] || { sockets: [], roomId: groupId };

      if (!userClientsMap[groupId].sockets.some(s => s.id === socket.id)) {
        userClientsMap[groupId].sockets.push(socket);
      }

      io.to(groupId).emit('typing', message);
    }
  });

  socket.on('chat message', async (message) => {
    let targetUsers = Array.isArray(message.to) ? message.to : [message.to];
    let sourceUserId = message.from.id;

    if (targetUsers.length === 1) {
      let userId = targetUsers[0]?.id;

      if (!userId || userId === sourceUserId) return;

      let roomId = [userId, sourceUserId].sort().join('_');

      socket.join(roomId);

      emitMessageToIndividual(userId, roomId, message);

      if (message.message) {
        try {
          await storeMessageInDatabase(roomId, sourceUserId, userId, message.message);
        } catch (error) {
          console.error('Error storing message in the database:', error);
        }
      }
    } else {
      let groupId = message.groupName;

      socket.join(groupId);

      if (!socket.group_ids.includes(groupId)) {
        socket.group_ids.push(groupId);
      }

      userClientsMap[groupId] = userClientsMap[groupId] || { sockets: [], roomId: groupId };

      if (!userClientsMap[groupId].sockets.some(s => s.id === socket.id)) {
        userClientsMap[groupId].sockets.push(socket);
      }

      io.to(groupId).emit('messageResponse', [message]);

      if (message.message) {
        try {
          await storeMessageInDatabase(groupId, sourceUserId, null, message.message, message.groupName);
        } catch (error) {
          console.error('Error storing message in the database:', error);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    closeConnections();
  });

  socket.on('close old connections', () => {
    closeConnections();
  });

  socket.on('get user messages', async (chatInfo) => {
    try {
      await connection.query(
        'UPDATE chat_messages SET is_seen = 1 WHERE to_user_id = ?',
        [chatInfo.from.id]
      );

      const [results] = await connection.execute(
        'SELECT * FROM chat_messages WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)',
        [chatInfo.from.id, chatInfo.to.id, chatInfo.to.id, chatInfo.from.id]
      );
      socket.emit('messageResponse', results);
    } catch (error) {
      console.error('Error fetching user messages:', error);
    }
  });

  socket.on('get group messages', async (chatInfo) => {
    try {
      const [results] = await connection.execute(
        'SELECT cm.*, u.* FROM chat_messages cm JOIN users u ON cm.from_user_id = u.id WHERE cm.group_name = ?',
        [chatInfo.to]
      );
      socket.emit('messageResponse', results);
    } catch (error) {
      console.error('Error fetching user messages:', error);
    }
  });

  function closeConnections() {
    let socketIds = [...(socket?.user_ids || []), ...(socket?.group_ids || [])];
    if (socketIds && socketIds.length > 0) {
      socketIds.forEach(socketId => {
        if (socketId && userClientsMap[socketId]) {
          socket.leave(userClientsMap[socketId].roomId);

          if (socket.group_ids && socket.group_ids.length > 0) {
            socket.group_ids.forEach(groupId => {
              let groupInfo = userClientsMap[groupId];
              if (groupInfo && groupInfo.sockets) {
                groupInfo.sockets = groupInfo.sockets.filter(s => s.id !== socket.id);

                if (groupInfo.sockets.length === 0) {
                  delete userClientsMap[groupId];
                }
              }
            });
          }

          if (userClientsMap[socketId] && userClientsMap[socketId].sockets) {
            userClientsMap[socketId].sockets = userClientsMap[socketId].sockets.filter(s => s.id !== socket.id);

            if (userClientsMap[socketId].sockets.length === 0) {
              delete userClientsMap[socketId];
            }
          }
        }
      });
    }
  }

  function emitMessageToIndividual(userId, roomId, message) {
    socket.user_ids = socket.user_ids || [];
    socket.user_ids.push(userId);
    userClientsMap[userId] = userClientsMap[userId] || { sockets: [], roomId };

    if (!userClientsMap[userId].sockets.some(s => s.id === socket.id)) {
      userClientsMap[userId].sockets.push(socket);
    }

    io.to(roomId).emit('messageResponse', [message]);
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on ${configParams.appEnv}:${PORT}`);
});

async function storeMessageInDatabase(roomId, sourceUserId, targetUserId, message, groupName = null) {
  try {
    const [result] = await connection.query(
      'INSERT INTO chat_messages (from_user_id, to_user_id, group_name, message, room_id) VALUES (?, ?, ?, ?, ?)',
      [sourceUserId, targetUserId, groupName, message, roomId]
    );

    //console.log('Message stored in the database. Insert ID:', result.insertId);
  } catch (error) {
    console.error('Error storing message in the database:', error);
    throw error;
  }
}

function closeServer() {
  server.close(() => {
    console.log('Server is closed.');
    connection.end();
  });
}
