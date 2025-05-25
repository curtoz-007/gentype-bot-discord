const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./vouchCounts.db', err => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the database.');
  }
});

module.exports = db;