const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const dbError = require('../exceptions/dbError')
const error = require('../exceptions/common')
const {
  checkPassword,
  updatePassword,
} = require('../helpers/bcrypt')

const { generateTokens } = require('../helpers/jwt')

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return error(res, 400, 'Username and password are required');
  try {
    const { hash, salt } = updatePassword(password);
    db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', [username, hash, salt], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) return error(res, 409, 'Username already exists');
        return dbError(res);
      }
      res.status(201).json({ id: this.lastID, username });
    });
  } catch (err) {
    error(res, 500, 'Internal server error');
  }
});

router.get('/', auth, (req, res) => {
  db.all('SELECT id, username FROM users', [], (err, rows) => {
    if (err) return dbError(res);
    res.json(rows);
  });
});

router.get('/:id', auth, (req, res) => {
  db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return dbError(res);
    if (!row) return error(res, 404, 'User not found');
    res.json(row);
  });
});

router.put('/', auth, (req, res) => {
  const { password } = req.body;
  if (!password) return error(res, 400, 'Nothing to update');
  db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return dbError(res);
    if (!user) return error(res, 404, 'User not found');
    const { hash, salt } = updatePassword(password);
    db.run('UPDATE users SET password = ?, salt = ? WHERE id = ?', [hash, salt, req.user.id], function(err) {
      if (err) return dbError(res);
      res.json({ id: req.user.id, username: user.username });
    });
  });
});

router.delete('/me', auth, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.user.id], function(err) {
    if (err) return dbError(res);
    if (this.changes === 0) return error(res, 404, 'User not found');
    res.json({ success: true });
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return dbError(res);
    if (this.changes === 0) return error(res, 404, 'User not found');
    res.json({ success: true });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return error(res, 400, 'Username and password are required');
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return dbError(res);
    if (!checkPassword(user, password)) return error(res, 401, 'Invalid credentials');
    const tokens = generateTokens(user);
    db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id], (err) => {
      if (err) return dbError(res);
      db.run('INSERT INTO refresh_tokens (user_id, token) VALUES (?, ?)', [user.id, tokens.refreshToken], (err) => {
        if (err) return dbError(res);
        res.json(tokens);
      });
    });
  });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return error(res, 400, 'No refresh token provided');
  db.get('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken], (err, row) => {
    if (err) return dbError(res);
    if (!row) return error(res, 401, 'Invalid refresh token');
    jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
      if (err) return error(res, 401, 'Invalid refresh token');
      const tokens = generateTokens(user);
      db.run('UPDATE refresh_tokens SET token = ? WHERE id = ?', [tokens.refreshToken, row.id], (err) => {
        if (err) return dbError(res);
        res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      });
    });
  });
});

router.post('/logout', auth, (req, res) => {
  db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id], function(err) {
    if (err) return dbError(res);
    res.json({ success: true, message: 'Logged out' });
  });
});

module.exports = router; 