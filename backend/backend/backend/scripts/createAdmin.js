const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const [email, username, firstname, lastname, password] = process.argv.slice(2);
if (!email || !username || !firstname || !lastname || !password) {
  console.error('Missing arguments');
  process.exit(1);
}

const db = new sqlite3.Database('./dragonpanel.db');

(async () => {
  const hash = await bcrypt.hash(password, 10);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    firstname TEXT,
    lastname TEXT,
    password TEXT,
    is_admin INTEGER DEFAULT 0
  )`, () => {
    db.run(`INSERT INTO users (email, username, firstname, lastname, password, is_admin) VALUES (?, ?, ?, ?, ?, 1)`,
      [email, username, firstname, lastname, hash],
      function (err) {
        if (err) {
          console.error('Error inserting admin:', err.message);
          process.exit(1);
        }
        console.log('Admin user created with ID:', this.lastID);
        process.exit(0);
      });
  });
})();
