const mysql = require('mysql2');

// Create a connection to the database
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatpic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    console.error('Please make sure MySQL is running and the database configuration is correct.');
    // We don't return here so the server can still start even without database connection
    return;
  }
  console.log('Successfully connected to the database.');
});

// Handle connection errors
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconnecting to database...');
    // Attempt to reconnect
    db.connect((err) => {
      if (err) {
        console.error('Error reconnecting to the database:', err);
      } else {
        console.log('Reconnected to the database.');
      }
    });
  }
});

module.exports = db;