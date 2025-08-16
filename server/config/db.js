const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create SQLite database connection
const db = new sqlite3.Database(path.join(__dirname, '../database/chatpic.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    // Create postcards table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS postcards (
        postcard_id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_path TEXT NOT NULL,
        postcard_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        upload_status TEXT DEFAULT 'success',
        sender_token TEXT NOT NULL,
        receiver_token TEXT,
        feedback_text TEXT,
        postal_code TEXT
      )
    `;
    
    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating postcards table:', err.message);
      } else {
        console.log('Postcards table ready.');
      }
    });
  }
});

// Test the connection
let isDatabaseAvailable = true;

async function testConnection() {
  return new Promise((resolve) => {
    db.get('SELECT 1', (err) => {
      if (err) {
        console.error('Database connection failed:', err.message);
        isDatabaseAvailable = false;
        resolve(false);
      } else {
        console.log('Successfully connected to the database.');
        isDatabaseAvailable = true;
        resolve(true);
      }
    });
  });
}

// Test connection on startup
testConnection().then(connected => {
  if (connected) {
    console.log('Database connection established on startup');
  } else {
    console.log('Database connection failed on startup.');
  }
});

module.exports = { db, isDatabaseAvailable, testConnection };