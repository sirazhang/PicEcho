const { db, isDatabaseAvailable } = require('../config/db');

class Postcard {
  // Create a new postcard
  static async create(senderId, imageUrl, feedbackText, postalCode, callback) {
    console.log('Postcard.create called with:', { senderId, imageUrl, feedbackText, postalCode });
    
    // If database is not available, return mock data
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available. Postcard will not be saved.');
      // Return a mock success for development without database
      return callback(null, { 
        id: Math.floor(Math.random() * 10000),
        senderId,
        imageUrl,
        feedbackText,
        postalCode,
        status: 'pending',
        createdAt: new Date()
      });
    }
    
    try {
      const sql = `
        INSERT INTO sent_postcards 
        (senderId, imageUrl, feedbackText, postalCode, status) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const values = [
        senderId,
        imageUrl,
        feedbackText,
        postalCode,
        'pending'
      ];
      
      const [result] = await db.execute(sql, values);
      
      const postcard = {
        id: result.insertId,
        senderId,
        imageUrl,
        feedbackText,
        postalCode,
        status: 'pending',
        createdAt: new Date()
      };
      
      console.log('Postcard created with ID:', result.insertId);
      callback(null, postcard);
    } catch (error) {
      console.error('Database query error in Postcard.create:', error);
      callback(error, null);
    }
  }
  
  // Get a random postcard that is pending (excluding those sent by the current user)
  static async getRandomPending(currentUserId, callback) {
    console.log('Postcard.getRandomPending called with currentUserId:', currentUserId);
    
    // If database is not available, return mock data
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available. Returning mock postcard.');
      // Return a mock postcard for development without database
      // 50% chance of returning a postcard, 50% chance of returning null (no postcards)
      if (Math.random() > 0.5) {
        return callback(null, {
          id: Math.floor(Math.random() * 10000),
          senderId: 'user-' + Math.floor(Math.random() * 10000),
          imageUrl: '/img/img_01.png',
          feedbackText: JSON.stringify({
            encouragingRemarks: "Great job! You're doing well with your English practice.",
            errorSummary: "Minor grammar issues with article usage.",
            suggestions: "Try to practice using articles (a, an, the) in your sentences."
          }),
          postalCode: 'A1B 2C3',
          status: 'pending',
          createdAt: new Date()
        });
      } else {
        return callback(null, null);
      }
    }
    
    try {
      const sql = `
        SELECT * FROM sent_postcards 
        WHERE senderId != ? AND status = 'pending' 
        ORDER BY RAND() 
        LIMIT 1
      `;
      
      const [results] = await db.execute(sql, [currentUserId]);
      
      if (results.length === 0) {
        console.log('No pending postcards found for users other than:', currentUserId);
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
  
  // Update postcard status to 'sent'
  static async markAsSent(id, callback) {
    console.log('Postcard.markAsSent called with ID:', id);
    
    // If database is not available, return mock success
    if (!isDatabaseAvailable) {
      console.warn('Database connection not available. Skipping postcard status update.');
      // Return a mock success for development without database
      return callback(null, { affectedRows: 1 });
    }
    
    try {
      const sql = `
        UPDATE sent_postcards 
        SET status = 'sent' 
        WHERE id = ?
      `;
      
      const [result] = await db.execute(sql, [id]);
      
      console.log('Postcard marked as sent. Rows affected:', result.affectedRows);
      callback(null, result);
    } catch (error) {
      console.error('Database query error in Postcard.markAsSent:', error);
      callback(error, null);
    }
  }
}

module.exports = { Postcard };