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
    console.error('Error sending postcard:', error.response?.data || error.message);
    if (error.response) {
      // Server responded with error status
      throw new Error(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to reach the server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
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
    console.error('Error receiving postcard:', error.response?.data || error.message);
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 404) {
        // No postcards available - this is not necessarily an error
        return null;
      }
      throw new Error(`Server error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: Unable to reach the server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
  }
};