const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "dragonpanelsecret";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./dragonpanel.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    firstname TEXT,
    lastname TEXT,
    password TEXT,
    is_admin INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    location TEXT,
    fqdn TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )`);
});

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username, is_admin: user.is_admin }, SECRET_KEY, { expiresIn: '7d' });
}

function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token.replace('Bearer ', ''), SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}

app.post('/api/register-admin', async (req, res) => {
  const { email, username, firstname, lastname, password } = req.body;
  if (!email || !username || !firstname || !lastname || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const hash = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (email, username, firstname, lastname, password, is_admin) VALUES (?, ?, ?, ?, ?, 1)`,
    [email, username, firstname, lastname, hash],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'User exists or DB error' });
      }
      res.json({ success: true, id: this.lastID });
    });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    const token = generateToken(user);
    res.json({ token, username: user.username, is_admin: user.is_admin });
  });
});

app.get('/api/me', authenticate, (req, res) => {
  db.get(`SELECT id, email, username, firstname, lastname, is_admin FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });
    res.json(user);
  });
});

app.get('/api/nodes', authenticate, (req, res) => {
  db.all(`SELECT * FROM nodes`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/nodes', authenticate, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Only admin can add nodes' });
  const { name, location, fqdn } = req.body;
  if (!name || !location || !fqdn) return res.status(400).json({ error: 'Missing fields' });

  db.run(`INSERT INTO nodes (name, location, fqdn) VALUES (?, ?, ?)`, [name, location, fqdn], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ id: this.lastID, name, location, fqdn });
  });
});

app.get('/api/locations', authenticate, (req, res) => {
  db.all(`SELECT * FROM locations`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

app.post('/api/locations', authenticate, (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Only admin can add locations' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });

  db.run(`INSERT INTO locations (name) VALUES (?)`, [name], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ id: this.lastID, name });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Dragon Panel backend listening on port ${PORT}`);
});
