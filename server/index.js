const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Postcard = require('./models/Postcard');

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

// POST /postcards/send - Send a postcard
app.post('/postcards/send', (req, res) => {
  const { senderId, imageUrl, feedbackText, postalCode } = req.body;

  try {
    Postcard.create(senderId, imageUrl, feedbackText, postalCode, (err, postcard) => {
      if (err) {
        console.error('Error saving postcard:', err);
        return res.status(500).json({ error: 'Failed to send postcard' });
      }
      
      res.status(200).json({ 
        message: 'Postcard sent successfully!',
        postcard: postcard
      });
    });
  } catch (error) {
    console.error('Error sending postcard:', error);
    res.status(500).json({ error: 'Failed to send postcard' });
  }
});

// GET /postcards/receive - Receive a random postcard
app.get('/postcards/receive', (req, res) => {
  const currentUserId = req.query.userId;

  try {
    Postcard.getRandomPending(currentUserId, (err, postcard) => {
      if (err) {
        console.error('Error fetching postcard:', err);
        return res.status(500).json({ error: 'Failed to receive postcard' });
      }
      
      // If no postcard found, return appropriate message
      if (!postcard) {
        return res.status(404).json({ message: 'No postcards available at the moment' });
      }
      
      // For mock data, we need to handle the structure differently
      if (postcard.feedbackText && typeof postcard.feedbackText !== 'string') {
        // This is mock data, just return it
        return res.status(200).json(postcard);
      }
      
      // Mark the postcard as sent
      Postcard.markAsSent(postcard.id, (err) => {
        if (err) {
          console.error('Error marking postcard as sent:', err);
        }
        // We don't return an error here because the postcard was already fetched successfully
      });
      
      // Return the postcard
      res.status(200).json(postcard);
    });
  } catch (error) {
    console.error('Error receiving postcard:', error);
    res.status(500).json({ error: 'Failed to receive postcard' });
  }
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