const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_FILE_NAME = process.env.DB_FILE_NAME;
const dbPath = path.resolve(__dirname, DB_FILE_NAME);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to database.');
  }
});

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS refresh_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, token TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

module.exports = db; 