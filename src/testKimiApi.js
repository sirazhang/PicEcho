// src/testKimiApi.js
import { startKimiDialogue, sendToKimi, generateKimiFeedback } from './utils/kimiApi';

// Test function to verify Kimi API integration
export const testKimiApi = async () => {
  console.log('Testing Kimi API integration...');
  
  try {
    // Test 1: Check if we can start a dialogue
    console.log('Test 1: Starting dialogue with sample image description');
    const firstQuestion = await startKimiDialogue('A beautiful sunset over the ocean');
    console.log('First question from AI:', firstQuestion);
    
    // Test 2: Check if we can send a message and get a response
    console.log('Test 2: Sending message to AI');
    const conversationHistory = [
      { sender: 'ai', text: firstQuestion },
      { sender: 'user', text: 'I see a beautiful sunset with orange and pink colors.' }
    ];
    
    const aiResponse = await sendToKimi('I see a beautiful sunset with orange and pink colors.', conversationHistory);
    console.log('AI response:', aiResponse);
    
    // Test 3: Check if we can generate feedback
    console.log('Test 3: Generating feedback');
    const fullConversation = [
      { sender: 'ai', text: firstQuestion },
      { sender: 'user', text: 'I see a beautiful sunset with orange and pink colors.' },
      { sender: 'ai', text: aiResponse },
      { sender: 'user', text: 'It makes me feel peaceful and relaxed.' }
    ];
    
    const feedback = await generateKimiFeedback(fullConversation, 'A beautiful sunset over the ocean');
    console.log('Feedback from AI:', feedback);
    
    console.log('All tests completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during Kimi API tests:', error);
    return false;
  }
};

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
  // Delay the test to allow environment variables to load
  setTimeout(testKimiApi, 2000);
}