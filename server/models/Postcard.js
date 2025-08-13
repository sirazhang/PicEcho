const db = require('../config/db');

class Postcard {
  // Create a new postcard
  static create(senderId, imageUrl, feedbackText, postalCode, callback) {
    // Check if database connection is available
    if (!db.connection || db.connection.state === 'disconnected') {
      console.warn('Database connection not available. Postcard will not be saved.');
      // Return a mock success for development without database
      return callback(null, { 
        id: Math.floor(Math.random() * 10000),
        senderId,
        imageUrl,
        feedbackText,
        postalCode,
        status: 'pending'
      });
    }
    
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
    
    db.query(sql, values, (err, result) => {
      if (err) {
        callback(err, null);
        return;
      }
      
      const postcard = {
        id: result.insertId,
        senderId,
        imageUrl,
        feedbackText,
        postalCode,
        status: 'pending'
      };
      
      callback(null, postcard);
    });
  }
  
  // Get a random postcard that is pending (excluding those sent by the current user)
  static getRandomPending(currentUserId, callback) {
    // Check if database connection is available
    if (!db.connection || db.connection.state === 'disconnected') {
      console.warn('Database connection not available. Returning mock postcard.');
      // Return a mock postcard for development without database
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
    }
    
    const sql = `
      SELECT * FROM sent_postcards 
      WHERE senderId != ? AND status = 'pending' 
      ORDER BY RAND() 
      LIMIT 1
    `;
    
    db.query(sql, [currentUserId], (err, results) => {
      if (err) {
        callback(err, null);
        return;
      }
      
      if (results.length === 0) {
        callback(null, null);
        return;
      }
      
      callback(null, results[0]);
    });
  }
  
  // Update postcard status to 'sent'
  static markAsSent(id, callback) {
    // Check if database connection is available
    if (!db.connection || db.connection.state === 'disconnected') {
      console.warn('Database connection not available. Skipping postcard status update.');
      // Return a mock success for development without database
      return callback(null, { affectedRows: 1 });
    }
    
    const sql = `
      UPDATE sent_postcards 
      SET status = 'sent' 
      WHERE id = ?
    `;
    
    db.query(sql, [id], (err, result) => {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, result);
    });
  }
}

module.exports = Postcard;