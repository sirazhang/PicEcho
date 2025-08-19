const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Ensure uploads directory exists
async function ensureUploadsDirectory() {
  const uploadDir = path.join(__dirname, 'static/uploads');
  try {
    await fs.access(uploadDir);
  } catch (error) {
    // If directory doesn't exist, create it
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'static/uploads');
    try {
      await ensureUploadsDirectory();
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'postcard-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// POST /postcards - Save a new postcard with image file upload
app.post('/postcards', upload.single('image'), async (req, res) => {
  console.log('POST /postcards endpoint hit');
  
  const { senderToken, feedbackText, postalCode } = req.body;
  const imageFile = req.file;

  // Validate required fields
  if (!senderToken || !imageFile || !feedbackText) {
    const missingFields = [];
    if (!senderToken) missingFields.push('senderToken');
    if (!imageFile) missingFields.push('image');
    if (!feedbackText) missingFields.push('feedbackText');
    
    console.log('Missing fields:', missingFields);
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields: missingFields
    });
  }
  
  try {
    // Ensure uploads directory exists
    await ensureUploadsDirectory();
    
    // Save postcard data to database
    const Postcard = require('./models/Postcard').Postcard;
    
    // Create postcard record with file path
    const imagePath = path.relative(path.join(__dirname, 'static'), imageFile.path);
    
    const postData = {
      image_path: imagePath,
      postcard_url: `/static/${imagePath}`,
      created_at: new Date(),
      status: 'sent',
      sender_token: senderToken,
      receiver_token: null,
      feedback_text: typeof feedbackText === 'object' ? JSON.stringify(feedbackText) : feedbackText,
      postal_code: postalCode
    };
    
    // Insert into database
    const db = require('./config/db').db;
    const insertSql = `
      INSERT INTO postcards 
      (image_path, postcard_url, status, sender_token, receiver_token, feedback_text, postal_code) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertValues = [
      postData.image_path,
      postData.postcard_url,
      postData.status,
      postData.sender_token,
      postData.receiver_token,
      postData.feedback_text,
      postData.postal_code
    ];
    
    db.run(insertSql, insertValues, function(err) {
      if (err) {
        console.error('Error inserting postcard:', err.message);
        return res.status(500).json({ error: 'Failed to save postcard', details: err.message });
      }
      
      postData.postcard_id = this.lastID;
      console.log('Postcard saved successfully:', postData);
      
      res.status(200).json({ 
        success: true,
        message: 'Postcard saved successfully!',
        id: postData.postcard_id,
        timestamp: postData.created_at
      });
    });
  } catch (error) {
    console.error('Error processing postcard:', error);
    return res.status(500).json({ error: 'Failed to process postcard', details: error.message });
  }
});

// GET /postcards/random - Get a random postcard
app.get('/postcards/random', (req, res) => {
  console.log('GET /postcards/random endpoint hit');
  console.log('Query parameters:', req.query);
  
  const { senderToken } = req.query;

  if (!senderToken) {
    return res.status(400).json({ error: 'Missing required query parameter: senderToken' });
  }
  
  const Postcard = require('./models/Postcard').Postcard;
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
        }
        // Regardless of whether we could mark it as sent, return the postcard
        res.status(200).json({ 
          success: true,
          postcard: postcard
        });
      });
    } else {
      // Already assigned, just return it
      res.status(200).json({ 
        success: true,
        postcard: postcard
      });
    }
  });
});

// Routes
// POST /api/postcards/send - Send a postcard
app.post('/api/postcards/send', (req, res) => {
  console.log('POST /api/postcards/send endpoint hit');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('imageUrl length:', req.body.imageUrl?.length);
  console.log('imageUrl starts with:', req.body.imageUrl?.substring(0, 50));
  
  const { senderId, imageUrl, feedbackText, postalCode } = req.body;

  // Validate required fields
  if (!senderId || !imageUrl || !feedbackText) {
    const missingFields = [];
    if (!senderId) missingFields.push('senderId');
    if (!imageUrl) missingFields.push('imageUrl');
    if (!feedbackText) missingFields.push('feedbackText');
    
    console.log('Missing fields:', missingFields);
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields: missingFields
    });
  }
  
  Postcard.create(senderId, imageUrl, feedbackText, postalCode, (err, postcard) => {
    if (err) {
      console.error('Error saving postcard:', err);
      return res.status(500).json({ error: 'Failed to send postcard', details: err.message });
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
        }
        // Regardless of whether we could mark it as sent, return the postcard
        res.status(200).json({ 
          success: true,
          postcard: postcard
        });
      });
    } else {
      // Already assigned, just return it
      res.status(200).json({ 
        success: true,
        postcard: postcard
      });
    }
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