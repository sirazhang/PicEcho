const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbPath = path.join(__dirname, '../database/chatpic.db');

// Create database instance
const db = new Database(dbPath);

// Create postcards table if it doesn't exist
try {
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

  db.prepare(createTableSQL).run();
  console.log('Postcards table ready.');
} catch (err) {
  console.error('Error creating postcards table:', err.message);
}

console.log('Connected to SQLite database.');

// Test database connection
function testConnection() {
  try {
    const result = db.prepare('SELECT 1').get();
    console.log('Successfully connected to the database.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Check if database is available
const isDatabaseAvailable = testConnection();

if (isDatabaseAvailable) {
  console.log('Database connection established on startup');
} else {
  console.log('Database connection failed on startup.');
}

module.exports = { db, isDatabaseAvailable, testConnection };