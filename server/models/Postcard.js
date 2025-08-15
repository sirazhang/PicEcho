const { db, isDatabaseAvailable, testConnection } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

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
      // Step 1: Save image to local directory
      const saveDirectory = '/Users/sirazhang/data/chatpic/postcard';
      await ensureDirectoryExists(saveDirectory);
      
      // Generate a unique filename
      const postcardId = Date.now(); // 临时ID用于文件名
      const fileName = `postcard_${postcardId}_${Date.now()}.png`;
      const filePath = path.join(saveDirectory, fileName);
      
      // Download image from imageUrl and save it to the filePath
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      // 等待文件写入完成
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log('Image saved to:', filePath);
      
      // Step 2: Insert a record with the file path
      const insertSql = `
        INSERT INTO postcards 
        (postcard_url, status, sender_token, receiver_token, feedback_text, postal_code) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const insertValues = [
        filePath,
        'sent',
        senderToken,
        null,
        feedbackText,
        postalCode
      ];
      
      const [result] = await db.execute(insertSql, insertValues);
      const insertedPostcardId = result.insertId;
      
      const postcard = {
        postcard_id: insertedPostcardId,
        postcard_url: filePath,
        created_at: new Date(),
        status: 'sent',
        sender_token: senderToken,
        receiver_token: null,
        feedback_text: feedbackText,
        postal_code: postalCode
      };
      
      console.log('Postcard saved successfully with ID:', insertedPostcardId);
      callback(null, postcard);
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
      
      let [results] = await db.execute(sql, [currentSenderToken]);
      
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
      
      [results] = await db.execute(sql, [currentSenderToken]);
      
      if (results.length === 0) {
        console.log('No pending postcards found for users other than sender with token:', currentSenderToken);
        callback(null, null);
        return;
      }
      
      console.log('Found pending postcard:', results[0]);
      callback(null, results[0]);
    } catch (error) {
      console.error('Database query error in Postcard.getRandomPending:', error);
      callback(error, null);
    }
  }
  
  // Update postcard status to 'sent' and assign it to a receiver
  static async markAsSent(postcardId, receiverToken, callback) {
    console.log('Postcard.markAsSent called with postcardId:', postcardId, 'and receiverToken:', receiverToken);
    
    // If database is not available, return mock success
    if (!isDatabaseAvailable()) {
      console.warn('Database connection not available. Skipping postcard status update.');
      // Return a mock success for development without database
      return callback(null, { affectedRows: 1 });
    }
    
    try {
      const sql = `
        UPDATE postcards 
        SET status = 'sent', receiver_token = ?
        WHERE postcard_id = ?
      `;
      
      const [result] = await db.execute(sql, [receiverToken, postcardId]);
      
      console.log('Postcard marked as sent. Rows affected:', result.affectedRows);
      callback(null, result);
    } catch (error) {
      console.error('Database query error in Postcard.markAsSent:', error);
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
        WHERE status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)
        ORDER BY created_at ASC
      `;
      
      const [results] = await db.execute(sql);
      
      for (const postcard of results) {
        // Find a random receiver (a user who has sent a postcard but hasn't received one yet)
        const receiverSql = `
          SELECT sender_token FROM postcards 
          WHERE sender_token NOT IN (
            SELECT COALESCE(receiver_token, '') FROM postcards WHERE receiver_token IS NOT NULL
          )
          AND sender_token != ?
          LIMIT 1
        `;
        
        const [receivers] = await db.execute(receiverSql, [postcard.sender_token]);
        
        if (receivers.length > 0) {
          const receiverToken = receivers[0].sender_token;
          // Assign the postcard to this receiver
          await this.markAsSent(postcard.postcard_id, receiverToken, () => {});
          console.log(`Assigned postcard ${postcard.postcard_id} to receiver ${receiverToken}`);
        }
      }
    } catch (error) {
      console.error('Error in assignPostcardAfterDelay:', error);
    }
  }
}

// Run the assignment function every minute
setInterval(() => {
  Postcard.assignPostcardAfterDelay();
}, 60000); // Run every minute

module.exports = { Postcard };