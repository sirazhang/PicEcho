// src/utils/kimiApi.js
import { loadEnv } from './envLoader';

// Kimi API configuration
let KIMI_API_KEY = '';
let KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// Initialize environment variables
loadEnv().then(env => {
  KIMI_API_KEY = env.KIMI_API_KEY || '';
  if (!KIMI_API_KEY) {
    console.warn('KIMI_API_KEY not found in env file');
  }
});

/**
 * Call Kimi API to start a dialogue with the given image description
 * @param {string} imageDescription - The description of the image
 * @returns {Promise<string>} - The AI's first question
 */
export const startKimiDialogue = async (imageDescription) => {
  // Wait a bit for env to load if it hasn't already
  if (!KIMI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!KIMI_API_KEY) {
    console.error('KIMI_API_KEY is not set');
    return "What do you see in this image?";
  }
  
  try {
    const prompt = `You are a friendly and encouraging English tutor. 
Your goal is to help the learner practice descriptive speaking in English based on the given image description.

Image description:
"${imageDescription}"

Instructions:
1. Ask the learner exactly 4 questions in total.
2. Start with simple observation, then go into details, feelings, and creativity.
3. Keep questions short and friendly.
4. Output one question at a time, based on conversation flow.

Start with the first question.`;

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "system",
            content: "You are a friendly and encouraging English tutor helping learners practice descriptive speaking."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling Kimi API:", error);
    // Fallback to simulated response
    return "What do you see in this image?";
  }
};

/**
 * Send user message to Kimi API and get AI response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - The conversation history
 * @returns {Promise<string>} - The AI's response
 */
export const sendToKimi = async (message, conversationHistory) => {
  // Wait a bit for env to load if it hasn't already
  if (!KIMI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!KIMI_API_KEY) {
    console.error('KIMI_API_KEY is not set');
    // Fallback responses
    const aiResponses = [
      "That's interesting! Can you tell me more about it?",
      "Great observation! How does this make you feel?",
      "I see! What else do you notice in the image?",
      "Wonderful! Let's wrap up with a creative question - if you could step into this image, what would you do?"
    ];
    
    const aiMessageCount = conversationHistory.filter(m => m.sender === 'ai').length;
    return aiResponses[aiMessageCount] || "Thanks for practicing with me!";
  }
  
  try {
    // Build the conversation history for the API
    const messages = [
      {
        role: "system",
        content: "You are a friendly and encouraging English tutor helping learners practice descriptive speaking. Ask exactly 4 questions in total, one at a time."
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });

    // Add the latest user message
    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling Kimi API:", error);
    // Fallback responses
    const aiResponses = [
      "That's interesting! Can you tell me more about it?",
      "Great observation! How does this make you feel?",
      "I see! What else do you notice in the image?",
      "Wonderful! Let's wrap up with a creative question - if you could step into this image, what would you do?"
    ];
    
    const aiMessageCount = conversationHistory.filter(m => m.sender === 'ai').length;
    return aiResponses[aiMessageCount] || "Thanks for practicing with me!";
  }
};

/**
 * Generate feedback using Kimi API based on the conversation
 * @param {Array} conversation - The conversation history
 * @param {string} imageDescription - The description of the image
 * @returns {Promise<Object>} - The feedback object
 */
export const generateKimiFeedback = async (conversation, imageDescription) => {
  // Wait a bit for env to load if it hasn't already
  if (!KIMI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!KIMI_API_KEY) {
    console.error('KIMI_API_KEY is not set');
    // Fallback to default feedback
    return {
      encouragingRemarks: "Great job! You did very well in describing the image and answering all questions. Your English skills are improving!",
      errorSummary: "Minor grammar issues with article usage (a/the) and some verb tenses. Keep practicing!",
      corrections: [
        { error: "I seen", correction: "I saw" },
        { error: "a beautiful trees", correction: "beautiful trees" },
        { error: "they was", correction: "they were" }
      ],
      suggestions: "Try to use more descriptive adjectives and vary your sentence structures. Practice using past and present tenses correctly."
    };
  }
  
  try {
    // Build the conversation text
    let conversationText = "";
    conversation.forEach(msg => {
      const sender = msg.sender === 'user' ? 'Student' : 'Tutor';
      conversationText += `${sender}: ${msg.text}\n`;
    });

    const prompt = `As an English tutor, please provide detailed feedback on the following conversation between a student and an AI tutor about an image. The image description is: "${imageDescription}"

Conversation:
${conversationText}

Please provide feedback in the following JSON format:
{
  "encouragingRemarks": "Positive feedback about the student's performance",
  "errorSummary": "Brief summary of grammar or vocabulary errors",
  "corrections": [
    {
      "error": "incorrect phrase",
      "correction": "corrected phrase"
    }
  ],
  "suggestions": "Suggestions for improvement"
}

Focus on 2-3 specific errors and provide clear corrections.`;

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          {
            role: "system",
            content: "You are an English tutor providing feedback on student conversations. Respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Try to parse the JSON response
    try {
      // Remove potential markdown code block markers
      const jsonStr = content.replace(/```json\s*|\s*```/g, '');
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Error parsing feedback JSON:", parseError);
      // Return default feedback structure
      return {
        encouragingRemarks: "Great job participating in the conversation! You're doing well practicing your English speaking skills.",
        errorSummary: "Some opportunities for improvement in grammar and vocabulary usage.",
        corrections: [],
        suggestions: "Keep practicing speaking English regularly. Try to expand your sentences and use more descriptive language."
      };
    }
  } catch (error) {
    console.error("Error calling Kimi API for feedback:", error);
    // Fallback to default feedback
    return {
      encouragingRemarks: "Great job! You did very well in describing the image and answering all questions. Your English skills are improving!",
      errorSummary: "Minor grammar issues with article usage (a/the) and some verb tenses. Keep practicing!",
      corrections: [
        { error: "I seen", correction: "I saw" },
        { error: "a beautiful trees", correction: "beautiful trees" },
        { error: "they was", correction: "they were" }
      ],
      suggestions: "Try to use more descriptive adjectives and vary your sentence structures. Practice using past and present tenses correctly."
    };
  }
};