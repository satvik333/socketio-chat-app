const mysql = require('mysql2/promise');

// Connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Micropass@12',
  database: 'kapture_chat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

module.exports = pool;
