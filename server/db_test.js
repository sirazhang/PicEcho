const { db, testConnection } = require('./config/db');

async function testDB() {
  console.log('Testing database connection...');
  
  try {
    const connected = await testConnection();
    console.log('Database connection status:', connected);
    
    if (connected) {
      console.log('Checking if postcards table exists...');
      const [rows] = await db.execute("SHOW TABLES LIKE 'postcards'");
      console.log('Postcards table exists:', rows.length > 0);
      
      if (rows.length > 0) {
        console.log('Checking table structure...');
        const [columns] = await db.execute('DESCRIBE postcards');
        console.log('Table columns:');
        columns.forEach(column => {
          console.log(`  ${column.Field}: ${column.Type} ${column.Null} ${column.Key} ${column.Default || ''} ${column.Extra || ''}`);
        });
      }
      
      console.log('Testing data insertion...');
      const [result] = await db.execute(
        'INSERT INTO postcards (postcard_url, postcard_image, status, sender_token, feedback_text) VALUES (?, ?, ?, ?, ?)',
        ['https://example.com/test.jpg', Buffer.from('test image data'), 'sent', 'test-token', 'Test feedback']
      );
      console.log('Insertion result:', result);
      
      // Clean up test data
      await db.execute('DELETE FROM postcards WHERE sender_token = ?', ['test-token']);
      console.log('Test data cleaned up');
    }
  } catch (error) {
    console.error('Error during database test:', error.message);
  } finally {
    process.exit(0);
  }
}

testDB();
