const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing POST /api/postcards/send endpoint...');
    
    const response = await axios.post('http://localhost:3001/api/postcards/send', {
      senderId: 'test-user',
      imageUrl: 'https://picsum.photos/200/300',
      feedbackText: 'This is a test feedback',
      postalCode: 'M5V 3L9'
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    console.error('Error calling API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
