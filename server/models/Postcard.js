const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Import database connection and availability checker
const { db, isDatabaseAvailable, testConnection } = require('../config/db');

// 确保目录存在
async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory);
  } catch (error) {
    // 如果目录不存在，则创建它
    await fs.mkdir(directory, { recursive: true });
  }
}

class Postcard {
  // Create a new postcard
  static async create(senderId, imageUrl, feedbackText, postalCode, callback) {
    console.log('Postcard.create called with:', { senderId, imageUrl, feedbackText, postalCode });
    
    // Generate a UUID for the sender
    const senderToken = uuidv4();
    
    // If database is not available, return mock data
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available. Postcard will not be saved.');
      // Return a mock success for development without database
      return callback(null, { 
        postcard_id: Math.floor(Math.random() * 10000),
        image_path: 'uploads/mock-postcard.png',
        postcard_url: imageUrl,
        created_at: new Date(),
        status: 'pending',
        sender_token: senderToken,
        receiver_token: null,
        feedback_text: feedbackText,
        postal_code: postalCode
      });
    }
    
    try {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(__dirname, '../static/uploads');
      await ensureDirectoryExists(uploadDir);
      
      // Generate unique filename
      const filename = `postcard_${Date.now()}_${Math.floor(Math.random() * 10000)}.png`;
      const imagePath = path.join(uploadDir, filename);
      const relativePath = `uploads/${filename}`;
      
      // Check if imageUrl is a base64 data URL or regular URL
      if (imageUrl.startsWith('data:image')) {
        // Handle base64 image data
        console.log('Processing base64 image data');
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Save image to local file system
        await fs.writeFile(imagePath, imageBuffer);
        console.log('Base64 image saved to:', imagePath);
      } else {
        // Handle regular URL - download image data
        console.log('Downloading image from URL:', imageUrl);
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageData = response.data;
        
        // Save image to local file system
        await fs.writeFile(imagePath, imageData);
        console.log('Image saved to:', imagePath);
      }
      
      // Insert record into database with relative path
      const insertSql = `
        INSERT INTO postcards 
        (image_path, postcard_url, status, sender_token, receiver_token, feedback_text, postal_code) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertValues = [
        relativePath,
        imageUrl,
        'sent',
        senderToken,
        null,
        typeof feedbackText === 'object' ? JSON.stringify(feedbackText) : feedbackText,
        postalCode
      ];
      
      console.log('Inserting postcard into database...');
      db.run(insertSql, insertValues, function(err) {
        if (err) {
          console.error('Error inserting postcard:', err.message);
          return callback(err, null);
        }
        
        const insertedPostcardId = this.lastID;
      
        const postcard = {
          postcard_id: insertedPostcardId,
          image_path: relativePath,
          postcard_url: imageUrl,
          created_at: new Date(),
          status: 'sent',
          sender_token: senderToken,
          receiver_token: null,
          feedback_text: feedbackText,
          postal_code: postalCode
        };
        
        console.log('Postcard saved successfully with ID:', insertedPostcardId);
        callback(null, postcard);
      });
    } catch (error) {
      console.error('Error in Postcard.create:', error);
      callback(error, null);
    }
  }
  
  // Get a random pending postcard (for receiving)
  static async getRandomPending(currentSenderToken, callback) {
    console.log('Postcard.getRandomPending called with sender token:', currentSenderToken);
    
    // If database is not available, return mock data
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available. Returning mock postcard.');
      // Return a mock postcard for development without database
      return callback(null, {
        postcard_id: Math.floor(Math.random() * 10000),
        postcard_url: 'https://example.com/mock-postcard.jpg',
        created_at: new Date().toISOString(),
        status: 'sent',
        sender_token: 'mock-sender-token',
        receiver_token: currentSenderToken,
        feedback_text: JSON.stringify({
          encouragingRemarks: "Great job! You're doing well with your English practice.",
          errorSummary: "Minor grammar issues with article usage.",
          suggestions: "Try to practice using articles (a, an, the) in your sentences."
        }),
        postal_code: 'A1B 2C3'
      });
    }
    
    try {
      // First check if the user already has a postcard assigned to them
      let sql = `
        SELECT * FROM postcards 
        WHERE receiver_token = ? AND status = 'sent'
        LIMIT 1
      `;
      
      db.get(sql, [currentSenderToken], (err, row) => {
        if (err) {
          console.error('Database query error:', err.message);
          return callback(err, null);
        }
        
        // If user already has a postcard assigned, return it
        if (row) {
          console.log('Found assigned postcard for user:', row);
          return callback(null, row);
        }
      
      // If user already has a postcard assigned, return it
      if (results.length > 0) {
        console.log('Found assigned postcard for user:', results[0]);
        callback(null, results[0]);
        return;
      }
      
        // Otherwise, look for a random pending postcard (excluding those sent by the current user)
        sql = `
          SELECT * FROM postcards 
          WHERE sender_token != ? AND status = 'pending' 
          ORDER BY created_at ASC 
          LIMIT 1
        `;
        
        db.get(sql, [currentSenderToken], (err, row) => {
          if (err) {
            console.error('Database query error:', err.message);
            return callback(err, null);
          }
          
          if (!row) {
            console.log('No pending postcards found for users other than sender with token:', currentSenderToken);
            return callback(null, null);
          }
          
          console.log('Found pending postcard:', row);
          callback(null, row);
        });
      });
    } catch (error) {
      console.error('Database query error in Postcard.getRandomPending:', error.message);
      console.error('Full error details:', error);
      callback(error, null);
    }
  }
  
  // Update postcard status to 'sent' and assign it to a receiver
  static async markAsSent(postcardId, receiverToken, callback) {
    console.log('Postcard.markAsSent called with postcardId:', postcardId, 'and receiverToken:', receiverToken);
    
    try {
      // If database is not available, return mock success
      if (!isDatabaseAvailable()) {
        console.warn('Database connection not available. Skipping postcard status update.');
        // Return a mock success for development without database
        return callback(null, { changes: 1 });
      }
      
      const sql = `
        UPDATE postcards 
        SET status = 'sent', receiver_token = ?
        WHERE postcard_id = ?
      `;
      
      db.run(sql, [receiverToken, postcardId], function(err) {
        if (err) {
          console.error('Database query error:', err.message);
          return callback(err, null);
        }
        
        console.log('Postcard marked as sent. Rows affected:', this.changes);
        callback(null, { changes: this.changes });
      });
    } catch (error) {
      console.error('Database query error in Postcard.markAsSent:', error.message);
      console.error('Full error details:', error);
      callback(error, null);
    }
  }
  
  // Assign a postcard to a receiver after 2 minutes
  static async assignPostcardAfterDelay() {
    // Re-check database availability
    await testConnection();
    
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available. Skipping postcard assignment.');
      return;
    }
    
    try {
      // Find pending postcards that are older than 2 minutes
      const sql = `
        SELECT * FROM postcards 
        WHERE status = 'pending' AND created_at < datetime('now', '-2 minutes')
        ORDER BY created_at ASC
      `;
      
      db.all(sql, async (err, rows) => {
        if (err) {
          console.error('Database query error:', err.message);
          return;
        }
        
        for (const postcard of rows) {
          // Find a random receiver (a user who has sent a postcard but hasn't received one yet)
          const receiverSql = `
            SELECT sender_token FROM postcards 
            WHERE sender_token NOT IN (
              SELECT COALESCE(receiver_token, '') FROM postcards WHERE receiver_token IS NOT NULL
            )
            AND sender_token != ?
            LIMIT 1
          `;
          
          db.get(receiverSql, [postcard.sender_token], async (err, row) => {
            if (err) {
              console.error('Database query error:', err.message);
              return;
            }
            
            if (row) {
              const receiverToken = row.sender_token;
              // Assign the postcard to this receiver
              await this.markAsSent(postcard.postcard_id, receiverToken, () => {});
              console.log(`Assigned postcard ${postcard.postcard_id} to receiver ${receiverToken}`);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error in assignPostcardAfterDelay:', error.message);
      console.error('Full error details:', error);
    }
  }
}

// Run the assignment function every minute
setInterval(() => {
  Postcard.assignPostcardAfterDelay();
}, 60000); // Run every minute

module.exports = { Postcard };