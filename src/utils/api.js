// No axios import needed for fetch API

/**
 * Send a postcard to the backend (using Blob format)
 * @param {Object} postcardData - The postcard data to send, including image Blob
 * @returns {Promise<Object>} - The response from the server
 */
export const sendPostcard = async (postcardData) => {
  try {
    const formData = new FormData();
    
    // Add image Blob with correct field name
    formData.append('image', postcardData.imageData, 'postcard.png');
    
    // Add other data
    formData.append('senderToken', postcardData.senderToken);
    formData.append('feedbackText', JSON.stringify(postcardData.feedback));
    formData.append('postalCode', postcardData.postalCode);
    
    const response = await fetch('/postcards', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Postcard sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending postcard:', error);
    throw error;
  }
};

/**
 * Receive a random postcard from the backend
 * @param {Object} params - The parameters for the request
 * @returns {Promise<Object|null} - The received postcard data or null if none available
 */
export const receivePostcard = async (params) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/postcards/random?${queryString}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No postcards available
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Postcard received successfully:', data);
    return data.postcard;
  } catch (error) {
    console.error('Error receiving postcard:', error);
    throw error;
  }
};