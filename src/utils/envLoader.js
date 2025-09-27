// src/utils/envLoader.js
// 注意：为了安全起见，API密钥应该从系统环境变量读取，而不是从env文件读取
// 该文件保留用于开发环境调试，生产环境中应使用系统环境变量

/**
 * Load environment variables from the env file
 * @returns {Object} - Object containing environment variables
 */
export const loadEnv = async () => {
  try {
    const response = await fetch('/env');
    const text = await response.text();
    
    console.log('Raw env file content:', text); // 添加调试日志
    
    // Parse the env file content
    const envVars = {};
    const lines = text.split('\n');
    
    console.log('Lines in env file:', lines); // 添加调试日志
    
    lines.forEach(line => {
      // Skip empty lines and comments
      if (line.trim() === '' || line.startsWith('#')) {
        return;
      }
      
      console.log('Processing line:', line); // 添加调试日志
      
      // Split on the first '='
      const eqIndex = line.indexOf('=');
      if (eqIndex !== -1) {
        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim();
        envVars[key] = value;
        console.log(`Parsed env var: ${key} = ${value}`); // 添加调试日志
      }
    });
    
    console.log('Final parsed env vars:', envVars); // 添加调试日志
    
    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return {};
  }
};