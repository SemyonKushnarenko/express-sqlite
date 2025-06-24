const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DB_FILE_NAME = process.env.DB_FILE_NAME;
const dbPath = path.resolve(__dirname, DB_FILE_NAME);
const db = new sqlite3.Database(dbPath);

const migrationsDir = path.resolve(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
const migrations = migrationFiles.map(f => require(path.join(migrationsDir, f)));

const direction = process.argv[2] || 'up';

db.serialize(() => {
  if (direction === 'up') {
    migrations.forEach(m => m.up(db));
    console.log('Migrations applied (up).');
  } else if (direction === 'down') {
    migrations.slice().reverse().forEach(m => m.down(db));
    console.log('Migrations reverted (down).');
  } else {
    console.log('Unknown command. Use "up" or "down".');
  }
});

db.close(); 