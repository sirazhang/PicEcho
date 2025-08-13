import axios from 'axios';

// Create an axios instance with default configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:3001', // Default backend URL
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send a postcard to the backend
 * @param {Object} postcardData - The postcard data to send
 * @returns {Promise<Object>} - The response from the server
 */
export const sendPostcard = async (postcardData) => {
  try {
    const response = await apiClient.post('/postcards/send', postcardData);
    return response.data;
  } catch (error) {
    console.error('Error sending postcard:', error);
    throw error;
  }
};

/**
 * Receive a random postcard from the backend
 * @param {string} userId - The ID of the current user
 * @returns {Promise<Object>} - The received postcard data
 */
export const receivePostcard = async (userId) => {
  try {
    const response = await apiClient.get('/postcards/receive', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error receiving postcard:', error);
    throw error;
  }
};