const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kapture_chat',
    waitForConnections: true,
    connectionLimit: 100, // Adjust the connection limit as needed
    queueLimit: 0,
  });

  module.exports = connection;