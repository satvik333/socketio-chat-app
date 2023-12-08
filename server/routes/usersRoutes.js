const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');

// Enable CORS for all routes
router.use(cors());

router.get('/users', (req, res) => {
  const query = 'SELECT * FROM users';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

module.exports = router;
