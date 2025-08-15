const db = require('./config/db'); // 使用服务器根目录下的db.js配置文件

class Postcard {
  static create(senderId, imageUrl, feedbackText, postalCode, callback) {
    const query = 'INSERT INTO postcards (sender_id, image_url, feedback_text, postal_code, sent) VALUES (?, ?, ?, ?, ?)';
    db.query(
      query,
      [senderId, imageUrl, feedbackText, postalCode, false],
      (error, results) => {
        if (error) {
          return callback(error);
        }
        
        const insertId = results.insertId;
        this.findById(insertId, callback);
      }
    );
  }

  static findById(id, callback) {
    const query = 'SELECT * FROM postcards WHERE id = ?';
    db.query(query, [id], (error, results) => {
      if (error) return callback(error);
      callback(null, results[0]);
    });
  }

  static getRandomPending(currentUserId, callback) {
    const query = 'SELECT * FROM postcards WHERE sent = false AND sender_id != ? ORDER BY RAND() LIMIT 1';
    db.query(query, [currentUserId], (error, results) => {
      if (error) return callback(error);
      callback(null, results[0]);
    });
  }

  static markAsSent(id, callback) {
    const query = 'UPDATE postcards SET sent = true WHERE id = ?';
    db.query(query, [id], (error, results) => {
      if (error) return callback(error);
      callback(null);
    });
  }
}

module.exports = Postcard;
const mysql = require('mysql2');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatpic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory
// This assumes the React app is built into a 'build' directory
app.use(express.static('../build'));

// Routes
// POST /api/postcards/send - Send a postcard
app.post('/api/postcards/send', (req, res) => {
  console.log('POST /api/postcards/send endpoint hit');
  console.log('Request body:', req.body);
  
  const { senderId, imageUrl, feedbackText, postalCode } = req.body;

  // Validate required fields
  if (!senderId || !imageUrl || !feedbackText) {
    return res.status(400).json({ error: 'Missing required fields: senderId, imageUrl, and feedbackText are required' });
  }

  const { Postcard } = require('./models/Postcard');
  
  Postcard.create(senderId, imageUrl, feedbackText, postalCode, (err, postcard) => {
    if (err) {
      console.error('Error saving postcard:', err);
      return res.status(500).json({ error: 'Failed to send postcard' });
    }
    
    console.log('Postcard saved successfully:', postcard);
    res.status(200).json({ 
      success: true,
      message: 'Postcard sent successfully!',
      postcard: postcard
    });
  });
});

// GET /api/postcards/receive - Receive a random postcard
app.get('/api/postcards/receive', (req, res) => {
  console.log('GET /api/postcards/receive endpoint hit');
  console.log('Query parameters:', req.query);
  
  const { senderToken } = req.query;

  if (!senderToken) {
    return res.status(400).json({ error: 'Missing required query parameter: senderToken' });
  }

  const { Postcard } = require('./models/Postcard');
  
  Postcard.getRandomPending(senderToken, (err, postcard) => {
    if (err) {
      console.error('Error fetching postcard:', err);
      return res.status(500).json({ error: 'Failed to receive postcard' });
    }
    
    // If no postcard found, return appropriate message
    if (!postcard) {
      console.log('No postcards available for user with token:', senderToken);
      return res.status(404).json({ message: 'No postcards available at the moment' });
    }
    
    console.log('Postcard fetched successfully:', postcard);
    
    // If the postcard is not already assigned, mark it as sent and assign to the requester
    if (!postcard.receiver_token) {
      Postcard.markAsSent(postcard.postcard_id, senderToken, (err) => {
        if (err) {
          console.error('Error marking postcard as sent:', err);
          // We don't return an error here because the postcard was already fetched successfully
        }
      });
    }
    
    // Return the postcard
    res.status(200).json(postcard);
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = server;