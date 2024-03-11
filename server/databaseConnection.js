const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: '34.93.70.133',
    user: 'static_user',
    password: 'St@t!cU53r2022',
    database: 'kapture_product_db',
    waitForConnections: true,
    connectionLimit: 100, // Adjust the connection limit as needed
    queueLimit: 0,
  });

  module.exports = connection;