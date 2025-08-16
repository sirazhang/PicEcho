const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory
// This assumes the React app is built into a 'build' directory
app.use(express.static('../build'));

// Serve static files from the 'static' directory
app.use('/static', express.static(path.join(__dirname, 'static')));

// Import Postcard model correctly
const { Postcard } = require('./models/Postcard');

// Add a root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Chatpic server is running!' });
});

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
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

module.exports = server;