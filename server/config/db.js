const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'chatpic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
let isDatabaseAvailable = false;

async function testConnection() {
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();
    console.log('New database connection established');
    
    // Execute a simple query to test
    const [results] = await connection.execute('SELECT 1');
    console.log('Successfully connected to the database.');
    isDatabaseAvailable = true;
    
    // Release the connection back to the pool
    connection.release();
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    isDatabaseAvailable = false;
    return false;
  }
}

// Test connection on startup
testConnection();

// Periodically test connection to keep status updated
setInterval(() => {
  testConnection();
}, 30000); // Test every 30 seconds

// Export the pool and availability flag
module.exports = {
  db: pool,
  get isDatabaseAvailable() {
    return isDatabaseAvailable;
  },
  testConnection: testConnection
};