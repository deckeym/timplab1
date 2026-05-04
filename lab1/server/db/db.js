const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'app.db');
const schemaPath = path.join(__dirname, 'schema.sql');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const runAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(err) {
    if (err) {
      reject(err);
      return;
    }
    resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const getAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(row);
  });
});

const allAsync = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) {
      reject(err);
      return;
    }
    resolve(rows);
  });
});

const initDatabase = async () => {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync,
  initDatabase
};
