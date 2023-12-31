const express = require('express');
const router = express.Router();
const connection = require('../databaseConnection');
const cors = require('cors');

router.use(cors());
router.use(express.json());

router.get('/users', async (req, res) => {
  try {
    const [results] = await connection.execute('SELECT * FROM socket_users');
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    const [results] = await connection.execute('SELECT * FROM socket_users WHERE email = ?', [email]);

    if (results.length > 0) {
      res.status(200).json({ user: results[0] });
      await connection.query(
        'UPDATE socket_users SET is_active = 1 WHERE id = ?',
        [results[0].id]
      );
      await connection.query(
        'UPDATE chat_messages SET is_delivered = 1 WHERE to_user_id = ?',
        [results[0].id]
      );
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error while logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    await connection.query(
      'UPDATE socket_users SET is_active = 0 WHERE id = ?',
      [req.body.id]
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
