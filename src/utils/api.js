// No axios import needed for fetch API

/**
 * Send a postcard to the backend (using Blob format)
 * @param {Object} postcardData - The postcard data to send, including image Blob
 * @returns {Promise<Object>} - The response from the server
 */
export const sendPostcard = async (postcardData) => {
  try {
    const formData = new FormData();
    
    // Handle image data properly
    let imageBlob;
    if (postcardData.imageData instanceof Blob) {
      // If it's already a Blob, use it directly
      imageBlob = postcardData.imageData;
    } else if (typeof postcardData.imageData === 'string' && postcardData.imageData.startsWith('data:')) {
      // If it's a data URL, convert it to a Blob
      const byteString = atob(postcardData.imageData.split(',')[1]);
      const mimeString = postcardData.imageData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      imageBlob = new Blob([ab], { type: mimeString });
    } else {
      // If we can't handle the image data, throw an error
      throw new Error('Invalid image data format');
    }
    
    // Add image Blob with correct field name
    formData.append('image', imageBlob, 'postcard.png');
    
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
 * Receive a postcard from another user
 * @param {Object} params - The parameters for the request
 * @returns {Promise<Object>} - The received postcard data
 */
export const receivePostcard = async (params) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/postcards/random?${queryString}`);
    
    // Even if there's a 404 (no postcards available), we'll return a mock postcard
    if (response.status === 404) {
      // Return a mock postcard when none are available
      return {
        postcard_id: Math.floor(Math.random() * 10000),
        image_path: `/sample/sample_01.png`,
        postcard_url: `/sample/sample_01.png`,
        created_at: new Date().toISOString(),
        status: 'sent',
        sender_token: 'mock-sender',
        receiver_token: params.senderToken,
        feedback_text: JSON.stringify({
          encouragingRemarks: "Great job! You're doing well with your English practice.",
          errorSummary: "Minor grammar issues with article usage.",
          suggestions: "Try to practice using articles (a, an, the) in your sentences."
        }),
        postal_code: '123456'
      };
    }
    
    if (!response.ok) {
      console.error(`Server error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Postcard received successfully:', data);
    return data.postcard || data;
  } catch (error) {
    console.error('Error receiving postcard:', error);
    // Even if there's an error, return a mock postcard
    return {
      postcard_id: Math.floor(Math.random() * 10000),
      image_path: `/sample/sample_01.png`,
      postcard_url: `/sample/sample_01.png`,
      created_at: new Date().toISOString(),
      status: 'sent',
      sender_token: 'mock-sender',
      receiver_token: params.senderToken,
      feedback_text: JSON.stringify({
        encouragingRemarks: "Great job! You're doing well with your English practice.",
        errorSummary: "Minor grammar issues with article usage.",
        suggestions: "Try to practice using articles (a, an, the) in your sentences."
      }),
      postal_code: '123456'
    };
  }
};

// Function to get questions for an image
export const getQuestions = async (level, imageId, language) => {
  try {
    // Determine the questions file based on the level
    const questionsFile = level <= 2 ? 'questions1.json' : 'questions2.json';
    
    // Load the questions data
    const response = await fetch(`/Level${level}/${questionsFile}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.status}`);
    }
    
    const questionsData = await response.json();
    
    // Get questions for the specific image
    const imageQuestions = questionsData[imageId]?.questions;
    
    if (!imageQuestions) {
      throw new Error(`No questions found for image ${imageId} at level ${level}`);
    }
    
    // Filter questions by language
    const languageQuestions = imageQuestions.filter(q => q.language === language);
    
    return languageQuestions;
  } catch (error) {
    console.error('Error loading questions:', error);
    throw error;
  }
};

// IndexedDB utility for image storage
const DB_NAME = 'PostcardDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

let db;

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = (event) => {
      reject(`Database error: ${event.target.error}`);
    };
  });
};

// Save image to IndexedDB
export const saveImageToIndexedDB = async (id, blob) => {
  await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const imageData = {
      id: id,
      blob: blob,
      timestamp: new Date().getTime()
    };
    
    const request = store.put(imageData);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject(`Save error: ${event.target.error}`);
    };
  });
};

// Get image from IndexedDB
export const getImageFromIndexedDB = async (id) => {
  await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);
    
    request.onsuccess = (event) => {
      const result = event.target.result;
      resolve(result ? result.blob : null);
    };
    
    request.onerror = (event) => {
      reject(`Get error: ${event.target.error}`);
    };
  });
};

// Clear all images from IndexedDB
export const clearIndexedDBImages = async () => {
  await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.clear();
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (event) => {
      reject(`Clear error: ${event.target.error}`);
    };
  });
};
