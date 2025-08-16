const { Postcard } = require('./models/Postcard');

// Test database connection and insertion
async function testDB() {
  console.log('Testing database connection and insertion...');
  
  // Try to create a postcard
  Postcard.create(
    'test-sender', 
    'https://picsum.photos/200/300', 
    'This is a test feedback', 
    'M5V 3L9',
    (err, result) => {
      if (err) {
        console.error('Error creating postcard:', err);
      } else {
        console.log('Postcard created successfully:', result);
      }
      
      // Check if we can query the database
      const { db, isDatabaseAvailable } = require('./config/db');
      console.log('Database available:', isDatabaseAvailable);
      
      if (isDatabaseAvailable) {
        db.execute('SELECT COUNT(*) as count FROM postcards')
          .then(([rows]) => {
            console.log('Total postcards in database:', rows[0].count);
          })
          .catch(err => {
            console.error('Error querying database:', err);
          });
      }
    }
  );
}

testDB();
