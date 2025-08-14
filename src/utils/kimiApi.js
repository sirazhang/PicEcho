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
 * @param {string} language - The language for the AI to use (default: 'en')
 * @returns {Promise<string>} - The AI's first question
 */
export const startKimiDialogue = async (imageDescription, language = 'en') => {
  // Wait a bit for env to load if it hasn't already
  if (!KIMI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!KIMI_API_KEY) {
    console.error('KIMI_API_KEY is not set');
    return language === 'zh' 
      ? "你在这张图片中看到了什么？🤔" 
      : "What do you see in this image? 🤔";
  }
  
  console.log('Calling Kimi API with image description:', imageDescription);
  
  try {
    let prompt;
    let systemMessage;
    
    // Check if the image description contains keywords for special handling
    const isFourPanel = imageDescription.includes('四张图') || imageDescription.includes('four panels') || imageDescription.includes('four images');
    const isSpotTheDifference = imageDescription.includes('找不同') || imageDescription.includes('spot the difference') || imageDescription.includes('两张图') || imageDescription.includes('two images');
    
    if (language === 'zh') {
      if (isFourPanel) {
        prompt = `你是一位友好且有鼓励性的英语导师。
你的目标是帮助学习者根据给定的四格图片描述练习英语口语。

图片描述：
"${imageDescription}"

指导说明：
1. 总共向学习者提出6个问题，覆盖以下类别：
   - 场景设定 (Setting the scene)
   - 人物互动 (Character interactions)
   - 环境细节 (Details of the environment)
   - 事件顺序 (Sequence of events)
   - 情绪反应 (Emotional responses)
   - 预测性提问 (Predictive questions)
2. 保持问题简短和友好。
3. 一次只输出一个问题，并根据对话流程进行。
4. 问题要具体涉及面板顺序（使用"第一张图"、"第二张图"等）。
5. 适当使用emoji来让对话更生动有趣。

从第一个问题开始。请用中文提问。`;
      } else if (isSpotTheDifference) {
        prompt = `你是一位友好且有鼓励性的英语导师。
你的目标是帮助学习者根据给定的找不同图片描述练习英语口语。

图片描述：
"${imageDescription}"

指导说明：
1. 总共向学习者提出4个问题。
2. 首先提出概览性问题（引导问题），然后提出具体定位差异的问题。
3. 保持问题简短和友好。
4. 一次只输出一个问题，并根据对话流程进行。
5. 适当使用emoji来让对话更生动有趣。

从第一个引导性问题开始。请用中文提问。`;
      } else {
        prompt = `你是一位友好且有鼓励性的英语导师。
你的目标是帮助学习者根据给定的图片描述练习英语口语。

图片描述：
"${imageDescription}"

指导说明：
1. 总共向学习者提出4个问题。
2. 从简单的观察开始，然后进入细节、感受和创意。
3. 保持问题简短和友好。
4. 一次只输出一个问题，并根据对话流程进行。
5. 适当使用emoji来让对话更生动有趣。

从第一个问题开始。请用中文提问。`;
      }
      
      systemMessage = "你是一位友好且有鼓励性的英语导师，帮助学习者练习英语口语。请用中文提问。适当使用emoji来让对话更生动有趣。";
    } else {
      if (isFourPanel) {
        prompt = `You are a friendly and encouraging English tutor. 
Your goal is to help the learner practice descriptive speaking in English based on the given four-panel image description.

Image description:
"${imageDescription}"

Instructions:
1. Ask the learner exactly 6 questions in total, covering these categories:
   - Setting the scene
   - Character interactions
   - Details of the environment
   - Sequence of events
   - Emotional responses
   - Predictive questions
2. Keep questions short and friendly.
3. Output one question at a time, based on conversation flow.
4. Make questions specific to panel order (use "first panel", "second panel" etc.).
5. Use emojis appropriately to make the conversation more engaging.

Start with the first question.`;
      } else if (isSpotTheDifference) {
        prompt = `You are a friendly and encouraging English tutor. 
Your goal is to help the learner practice descriptive speaking in English based on the given spot-the-difference image description.

Image description:
"${imageDescription}"

Instructions:
1. Ask the learner exactly 4 questions in total.
2. Start with overview questions (guiding questions), then move to specific questions that locate differences.
3. Keep questions short and friendly.
4. Output one question at a time, based on conversation flow.
5. Use emojis appropriately to make the conversation more engaging.

Start with the first guiding question.`;
      } else {
        prompt = `You are a friendly and encouraging English tutor. 
Your goal is to help the learner practice descriptive speaking in English based on the given image description.

Image description:
"${imageDescription}"

Instructions:
1. Ask the learner exactly 4 questions in total.
2. Start with simple observation, then go into details, feelings, and creativity.
3. Keep questions short and friendly.
4. Output one question at a time, based on conversation flow.
5. Use emojis appropriately to make the conversation more engaging.

Start with the first question.`;
      }
      
      systemMessage = "You are a friendly and encouraging English tutor helping learners practice descriptive speaking. Use emojis appropriately to make the conversation more engaging.";
    }

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
            content: systemMessage
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
    return language === 'zh' 
      ? "你在这张图片中看到了什么？🤔" 
      : "What do you see in this image? 🤔";
  }
};

/**
 * Send user message to Kimi API and get AI response
 * @param {string} message - The user's message
 * @param {Array} conversationHistory - The conversation history
 * @param {string} language - The language for the AI to use (default: 'en')
 * @returns {Promise<string>} - The AI's response
 */
export const sendToKimi = async (message, conversationHistory, language = 'en') => {
  // Wait a bit for env to load if it hasn't already
  if (!KIMI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!KIMI_API_KEY) {
    console.error('KIMI_API_KEY is not set');
    // Fallback responses
    let aiResponses;
    if (language === 'zh') {
      aiResponses = [
        "很有趣！能告诉我更多吗？😊",
        "观察得很好！这让你有什么感受？🌟",
        "我明白了！你还注意到图片中的什么？🔍",
        "很棒！让我们用一个有创意的问题来结束 - 如果你能进入这张图片，你会做什么？✨"
      ];
    } else {
      aiResponses = [
        "That's interesting! Can you tell me more about it? 😊",
        "Great observation! How does this make you feel? 🌟",
        "I see! What else do you notice in the image? 🔍",
        "Wonderful! Let's wrap up with a creative question - if you could step into this image, what would you do? ✨"
      ];
    }
    
    const aiMessageCount = conversationHistory.filter(m => m.sender === 'ai').length;
    return aiResponses[aiMessageCount] || (language === 'zh' ? "谢谢你和我练习！🎉" : "Thanks for practicing with me! 🎉");
  }
  
  console.log('Sending message to Kimi API:', message);
  
  try {
    // Build the conversation history for the API
    let systemMessage;
    if (language === 'zh') {
      systemMessage = "你是一位友好且有鼓励性的英语导师，帮助学习者练习英语口语。总共问4个问题，一次一个。请用中文提问。适当使用emoji来让对话更生动有趣。";
    } else {
      systemMessage = "You are a friendly and encouraging English tutor helping learners practice descriptive speaking. Ask exactly 4 questions in total, one at a time. Use emojis appropriately to make the conversation more engaging.";
    }

    const messages = [
      {
        role: "system",
        content: systemMessage
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
    let aiResponses;
    if (language === 'zh') {
      aiResponses = [
        "很有趣！能告诉我更多吗？😊",
        "观察得很好！这让你有什么感受？🌟",
        "我明白了！你还注意到图片中的什么？🔍",
        "很棒！让我们用一个有创意的问题来结束 - 如果你能进入这张图片，你会做什么？✨"
      ];
    } else {
      aiResponses = [
        "That's interesting! Can you tell me more about it? 😊",
        "Great observation! How does this make you feel? 🌟",
        "I see! What else do you notice in the image? 🔍",
        "Wonderful! Let's wrap up with a creative question - if you could step into this image, what would you do? ✨"
      ];
    }
    
    const aiMessageCount = conversationHistory.filter(m => m.sender === 'ai').length;
    return aiResponses[aiMessageCount] || (language === 'zh' ? "谢谢你和我练习！🎉" : "Thanks for practicing with me! 🎉");
  }
};

/**
 * Generate feedback using Kimi API based on the conversation with the new prompt format
 * @param {Array} conversation - The conversation history
 * @param {string} imageDescription - The description of the image
 * @param {string} language - The language for the feedback (default: 'en')
 * @returns {Promise<Object>} - The feedback object
 */
export const generateKimiFeedback = async (conversation, imageDescription, language = 'en') => {
  // Wait a bit for env to load if it hasn't already
  if (!KIMI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!KIMI_API_KEY) {
    console.error('KIMI_API_KEY is not set');
    // Fallback to default feedback based on language
    if (language === 'zh') {
      return {
        encouragingRemarks: "做得很好！👏 你在描述图片和回答问题方面表现出色。你的英语技能正在提高！",
        errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
        suggestions: "• 不要使用 'I seen'，尝试使用 'I saw' 或 'I noticed'\n• 不要只用简单句，尝试合并想法: 'The sunset was beautiful and made me feel peaceful'",
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        encouragingRemarks: "Great job! 👏 You did very well in describing the image and answering all questions. Your English skills are improving!",
        errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
        suggestions: "• Instead of 'I seen', try using 'I saw' or 'I noticed'\n• Instead of simple sentences, try combining ideas: 'The sunset was beautiful and made me feel peaceful'",
        timestamp: new Date().toISOString()
      };
    }
  }
  
  console.log('Generating feedback with Kimi API');
  
  try {
    // Build the conversation text
    let conversationText = "";
    conversation.forEach(msg => {
      const sender = msg.sender === 'user' ? 'Student' : 'Tutor';
      conversationText += `${sender}: ${msg.text}\n`;
    });

    let prompt;
    if (language === 'zh') {
      prompt = `你是一位鼓励性的英语导师。🧑‍🏫
你的任务：根据之前的对话，给出三个部分的针对性反馈：

1. **带表情符号的鼓励评价**
   - 给出温暖、激励性的反馈。
   - 至少包含一个积极的表情符号。

2. **错误总结**
   - 对于每个错误，用下划线标出错误部分：\`_错误的文本_\`
   - 然后，紧接着显示正确版本。
   - 格式为：
     \`_错误的句子_ → 正确的句子\`

3. **改进建议**
   - 给出至少2个自然流畅的替代表达。
   - 使用清晰的项目符号。

格式规则：
- 保留章节编号（1, 2, 3）在输出中。
- 仅用中文回复。
- 保持简洁但友好。

对话:
${conversationText}`;
    } else {
      prompt = `You are an encouraging English tutor. 🧑‍🏫 
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
    }

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
    return parseFeedbackResponse(content, language);
  } catch (error) {
    console.error("Error calling Kimi API for feedback:", error);
    // Fallback to default feedback based on language
    if (language === 'zh') {
      return {
        encouragingRemarks: "做得很好！👏 你在描述图片和回答问题方面表现出色。你的英语技能正在提高！",
        errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
        suggestions: "• 不要使用 'I seen'，尝试使用 'I saw' 或 'I noticed'\n• 不要只用简单句，尝试合并想法: 'The sunset was beautiful and made me feel peaceful'",
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        encouragingRemarks: "Great job! 👏 You did very well in describing the image and answering all questions. Your English skills are improving!",
        errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
        suggestions: "• Instead of 'I seen', try using 'I saw' or 'I noticed'\n• Instead of simple sentences, try combining ideas: 'The sunset was beautiful and made me feel peaceful'",
        timestamp: new Date().toISOString()
      };
    }
  }
};

/**
 * Parse the feedback response from Kimi API into structured format
 * @param {string} content - The raw feedback content from Kimi API
 * @param {string} language - The language of the feedback
 * @returns {Object} - The parsed feedback object
 */
const parseFeedbackResponse = (content, language) => {
  try {
    // Extract sections using regex
    const encouragingMatch = content.match(/1\.\s*\**.*\**([\s\S]*?)(?=\d\.\s*\**|$)/i);
    const errorMatch = content.match(/2\.\s*\**.*\**([\s\S]*?)(?=\d\.\s*\**|$)/i);
    const suggestionMatch = content.match(/3\.\s*\**.*\**([\s\S]*?)(?=\d\.\s*\**|$)/i);
    
    if (language === 'zh') {
      return {
        encouragingRemarks: encouragingMatch ? encouragingMatch[1].trim() : "做得很好！👏 继续练习你的英语技能！",
        errorSummary: errorMatch ? errorMatch[1].trim() : "未发现特定错误。你的英语正在进步！",
        suggestions: suggestionMatch ? suggestionMatch[1].trim() : "• 尝试使用更多描述性形容词\n• 练习形成长而复杂的句子",
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        encouragingRemarks: encouragingMatch ? encouragingMatch[1].trim() : "Great job! 👏 Keep practicing your English skills!",
        errorSummary: errorMatch ? errorMatch[1].trim() : "No specific errors found. Your English is improving!",
        suggestions: suggestionMatch ? suggestionMatch[1].trim() : "• Try to use more descriptive adjectives\n• Practice forming longer, more complex sentences",
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error("Error parsing feedback response:", error);
    // Return default structure based on language
    if (language === 'zh') {
      return {
        encouragingRemarks: "做得很好！👏 你在描述图片和回答问题方面表现出色。你的英语技能正在提高！",
        errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
        suggestions: "• 不要使用 'I seen'，尝试使用 'I saw' 或 'I noticed'\n• 不要只用简单句，尝试合并想法: 'The sunset was beautiful and made me feel peaceful'",
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        encouragingRemarks: "Great job! 👏 You did very well in describing the image and answering all questions. Your English skills are improving!",
        errorSummary: "_I seen a beautiful sunset_ → I saw a beautiful sunset\n_they was very happy_ → they were very happy",
        suggestions: "• Instead of 'I seen', try using 'I saw' or 'I noticed'\n• Instead of simple sentences, try combining ideas: 'The sunset was beautiful and made me feel peaceful'",
        timestamp: new Date().toISOString()
      };
    }
  }
};