const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool to the database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'chatpic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Get a promise-based connection from the pool
const db = pool.promise();

// Variable to track database availability
let isDatabaseAvailable = false;

// Test the connection
db.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database.');
    connection.release(); // Release the connection back to the pool
    isDatabaseAvailable = true;
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
    console.error('Please make sure MySQL is running and the database configuration is correct.');
    console.warn('The application will use mock data for development.');
    isDatabaseAvailable = false;
  });

module.exports = { 
  db, 
  get isDatabaseAvailable() {
    return isDatabaseAvailable;
  }
};