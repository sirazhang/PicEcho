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
  } else {
    console.log('KIMI_API_KEY loaded successfully');
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
  
  console.log('Calling Kimi API with image description:', imageDescription);
  
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
    console.log('Kimi API response:', data);
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
  
  console.log('Sending message to Kimi API:', message);
  
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
    console.log('Kimi API response:', data);
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
 * Generate feedback using Kimi API based on the conversation with the new prompt format
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
      encouragingRemarks: "Great job! 👏 You did very well in describing the image and answering all questions. Your English skills are improving!",
      errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
      suggestions: "• Instead of 'I seen', try using 'I saw' or 'I noticed'\n• Instead of simple sentences, try combining ideas: 'The sunset was beautiful and made me feel peaceful'"
    };
  }
  
  console.log('Generating feedback with Kimi API');
  
  try {
    // Build the conversation text
    let conversationText = "";
    conversation.forEach(msg => {
      const sender = msg.sender === 'user' ? 'Student' : 'Tutor';
      conversationText += `${sender}: ${msg.text}\n`;
    });

    const prompt = `You are an encouraging English tutor. 🧑‍🏫 
Your task: Based on the previous conversation with the user, give targeted feedback in **three sections**:

1. **Encouraging Remarks with Emoji**  
   - Give warm, motivating feedback.
   - Include at least one positive emoji.

2. **Error Summary**  
   - For each error, show the incorrect part with underscores: \`_incorrect text_\`
   - Then, immediately after, show the corrected version.  
   - Format each correction as:
     \`_incorrect sentence_ → Correct sentence\`

3. **Improvement Suggestions**  
   - Give at least 2 natural and fluent alternative expressions.
   - Use clear bullet points.

Formatting rules:  
- Keep section numbers (1, 2, 3) in the output.  
- Respond in English only.  
- Keep it concise but friendly.

Conversation:
${conversationText}`;

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
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    console.log('Kimi API feedback response:', data);
    
    // Parse the response into sections
    return parseFeedbackResponse(content);
  } catch (error) {
    console.error("Error calling Kimi API for feedback:", error);
    // Fallback to default feedback
    return {
      encouragingRemarks: "Great job! 👏 You did very well in describing the image and answering all questions. Your English skills are improving!",
      errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
      suggestions: "• Instead of 'I seen', try using 'I saw' or 'I noticed'\n• Instead of simple sentences, try combining ideas: 'The sunset was beautiful and made me feel peaceful'"
    };
  }
};

/**
 * Parse the feedback response from Kimi API into structured format
 * @param {string} content - The raw feedback content from Kimi API
 * @returns {Object} - The parsed feedback object
 */
const parseFeedbackResponse = (content) => {
  try {
    // Extract sections using regex
    const encouragingMatch = content.match(/1\.\s*\**Encouraging Remarks with Emoji\**([\s\S]*?)(?=\d\.\s*\**|$)/i);
    const errorMatch = content.match(/2\.\s*\**Error Summary\**([\s\S]*?)(?=\d\.\s*\**|$)/i);
    const suggestionMatch = content.match(/3\.\s*\**Improvement Suggestions\**([\s\S]*?)(?=\d\.\s*\**|$)/i);
    
    return {
      encouragingRemarks: encouragingMatch ? encouragingMatch[1].trim() : "Great job! 👏 Keep practicing your English skills!",
      errorSummary: errorMatch ? errorMatch[1].trim() : "No specific errors found. Your English is improving!",
      suggestions: suggestionMatch ? suggestionMatch[1].trim() : "• Try to use more descriptive adjectives\n• Practice forming longer, more complex sentences"
    };
  } catch (error) {
    console.error("Error parsing feedback response:", error);
    // Return default structure
    return {
      encouragingRemarks: "Great job! 👏 You did very well in describing the image and answering all questions. Your English skills are improving!",
      errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
      suggestions: "• Instead of 'I seen', try using 'I saw' or 'I noticed'\n• Instead of simple sentences, try combining ideas: 'The sunset was beautiful and made me feel peaceful'"
    };
  }
};