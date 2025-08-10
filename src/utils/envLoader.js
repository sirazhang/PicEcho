// src/utils/envLoader.js

/**
 * Load environment variables from the env file
 * @returns {Object} - Object containing environment variables
 */
export const loadEnv = async () => {
  try {
    const response = await fetch('/env');
    const text = await response.text();
    
    // Parse the env file content
    const envVars = {};
    const lines = text.split('\n');
    
    lines.forEach(line => {
      // Skip empty lines and comments
      if (line.trim() === '' || line.startsWith('#')) {
        return;
      }
      
      // Split on the first '='
      const eqIndex = line.indexOf('=');
      if (eqIndex !== -1) {
        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim();
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return {};
  }
};