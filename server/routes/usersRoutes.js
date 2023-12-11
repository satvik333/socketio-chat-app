const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');

// Enable CORS for all routes
router.use(cors());

router.get('/users', async (req, res) => {
  try {
    const [results] = await connection.execute('SELECT * FROM users');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
