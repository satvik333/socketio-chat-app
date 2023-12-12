const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');

// Enable CORS for all routes
router.use(cors());
router.use(express.json());

router.get('/users', async (req, res) => {
  try {
    const [results] = await connection.execute('SELECT * FROM users');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const [results] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length > 0) {
      res.status(200).json({ user: results[0] });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error while logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
