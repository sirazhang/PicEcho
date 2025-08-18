import { loadEnv } from './envLoader';

// Kimi API configuration
let currentKeyIndex = 0;

// Kimi API configuration (continued)
let KIMI_API_KEYS = [];
let KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// 请求队列，用于串行化API请求
let pending = Promise.resolve();

/**
 * 将Kimi API请求加入队列，串行执行避免并发冲突
 * @param {Function} fn - 要执行的异步函数
 * @returns {Promise} - 执行结果的Promise
 */
export function queueKimiRequest(fn) {
  // 串行化：上一个完成后再执行下一个
  pending = pending.then(() => fn()).catch(() => {});
  return pending;
}

// Initialize environment variables
loadEnv().then(env => {
  // 支持多个API密钥，用逗号分隔
  if (env.KIMI_API_KEY) {
    KIMI_API_KEYS = env.KIMI_API_KEY.split(',').map(key => key.trim()).filter(key => key);
    console.log(`Loaded ${KIMI_API_KEYS.length} Kimi API keys`);
  }
  
  if (KIMI_API_KEYS.length === 0) {
    console.warn('No KIMI_API_KEY found in env file');
  } else {
    console.log('KIMI_API_KEY loaded successfully');
  }
});

/**
 * 获取当前可用的API密钥
 * @returns {string|null} - 当前API密钥或null（如果没有配置）
 */
const getCurrentApiKey = () => {
  if (KIMI_API_KEYS.length === 0) return null;
  return KIMI_API_KEYS[currentKeyIndex];
};

/**
 * 切换到下一个API密钥（轮询机制）
 */
const switchToNextApiKey = () => {
  if (KIMI_API_KEYS.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % KIMI_API_KEYS.length;
    console.log(`Switched to API key ${currentKeyIndex + 1}/${KIMI_API_KEYS.length}`);
  }
};

/**
 * Get default question when Kimi API is not available
 * @param {string} lang - The language for the question
 * @returns {string} - The default question
 */
export const getDefaultQuestion = (lang) => {
  return lang === 'zh' 
    ? "你在这张图片中看到了什么？🤔" 
    : "What do you see in this image? 🤔";
};

/**
 * Check if a text contains Chinese characters
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains Chinese characters
 */
const containsChinese = (text) => {
  return /[\u4e00-\u9fa5]/.test(text);
};

/**
 * Call Kimi API to start a dialogue with the given image description
 * @param {string} imageDescription - The description of the image
 * @param {string} lang - The language for the AI to use (default: 'en')
 * @param {number} level - The difficulty level (1, 2, or 3)
 * @returns {Promise<string>} - The AI's first question
 */
export const startKimiDialogue = async (imageDescription, lang = 'en', level = 1) => {
  // Wait a bit for env to load if it hasn't already
  if (KIMI_API_KEYS.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const apiKey = getCurrentApiKey();
  if (!apiKey) {
    console.error('KIMI_API_KEY is not set');
    return getDefaultQuestion(lang);
  }
  
  console.log('Calling Kimi API with image description:', imageDescription);
  
  // 添加自动重试机制（指数退避）
  for (let i = 0; i < 3; i++) {
    try {
      let prompt;
      let systemMessage;

      // Handle different levels
      if (level === 1) {
        // Level 1 (Kids - simple questions with emojis)
        if (lang === 'zh') {
          prompt = `你是一个儿童互动老师，通过图片帮助孩子用简单句子描述和想象。你的语言应简单有趣并配合 emoji，给出第一个问题。

图片描述：
"${imageDescription}"

请根据图片内容，按照以下结构提出第一个问题，使用中文并配合emoji：
观察趣味：'哇！那是什么呀？🧐'`;
          
          systemMessage = "你是一个儿童互动老师，通过图片帮助孩子用简单句子描述和想象。你的语言应简单有趣并配合 emoji。只需要提出第一个问题，不要输出其他内容。请用中文提问并配合emoji。";
        } else {
          prompt = `You are a kindergarden English teacher. You always speak in simple English with friendly emojis, encourage curiosity. 

Image description:
"${imageDescription}"

Ask only the first question following this example structure:
Fun observation: Example – 'Wow! What's that? 🧐'

Based on the image description, ask the first question in simple English with emojis.`;
          
          systemMessage = "You always speak in simple English with friendly emojis, encourage curiosity. Only ask the first question. If the child responds in Chinese, gently encourage them to try in English with a message like 'Let's try in English 😊'";
        }
      } else if (level === 2) {
        // Level 2 (Intermediate - encourage full sentences)
        if (lang === 'zh') {
          prompt = `你是一个互动对话AI，帮助学生通过图片练习描述、表达和思考。现在提出第一个问题。

图片描述：
"${imageDescription}"

指导说明：
1. 只需要提出第一个问题。
2. 从简单的观察开始。
3. 保持问题简短和友好。
4. 适当使用emoji来让对话更生动有趣。

请用中文提问第一个问题。`;
          
          systemMessage = "你是一个互动对话AI，帮助学生通过图片练习描述、表达和思考。只需要提出第一个问题。请用中文提问。适当使用emoji来让对话更生动有趣。";
        } else {
          prompt = `You are an interactive conversation AI helping students practice description, expression, and thinking through images. Now ask the first question.

Image description:
"${imageDescription}"

Instructions:
1. Only ask the first question.
2. Start with simple observation.
3. Keep questions short and friendly.
4. Use emojis appropriately to make the conversation more engaging.

Ask the first question.`;
          
          systemMessage = "You are an interactive conversation AI helping students practice description, expression, and thinking through images. Only ask the first question. Use emojis appropriately to make the conversation more engaging. If the learner responds in Chinese, gently encourage them to try in English with a message like 'Let's try in English 😊'";
        }
      } else if (level === 3) {
        // Level 3 (Advanced - storytelling and analytical thinking)
        if (lang === 'zh') {
          prompt = `你是一位初中语文老师。你的任务是通过图片，引导学生去观察、想象和表达，锻炼讲故事的能力。

图片描述：
"${imageDescription}"

指导说明：
1. 只需要提出第一个问题。
2. 问题应引导学习者进行深入思考和创造性表达。
3. 保持问题简短和友好。
4. 适当使用emoji来让对话更生动有趣。

请用中文提问第一个问题。`;
          
          systemMessage = "你是一位初中语文老师。你的任务是通过图片，引导学生去观察、想象和表达，锻炼讲故事的能力。只需要提出第一个问题。请用中文提问。适当使用emoji来让对话更生动有趣。";
        } else {
          prompt = `You are a middle school Chinese language teacher. Your task is to guide students to observe, imagine and express themselves through pictures, and train their storytelling skills.

Image description:
"${imageDescription}"

Instructions:
1. Only ask the first question.
2. Questions should guide the learner toward deep thinking and creative expression.
3. Keep questions short and friendly.
4. Use emojis appropriately to make the conversation more engaging.

Ask the first question.`;
          
          systemMessage = "You are a middle school Chinese language teacher. Your task is to guide students to observe, imagine and express themselves through pictures, and train their storytelling skills. Only ask the first question. Use emojis appropriately to make the conversation more engaging. If the learner responds in Chinese, gently encourage them to try in English with a message like 'Let's try in English 😊'";
        }
      }

      const response = await fetch(KIMI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Kimi API error response:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Kimi API response:', data);
      
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('No response content from API');
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === 2) { // Last attempt
        throw error;
      }
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

/**
 * Send a message to Kimi and get a response
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - The conversation history
 * @param {string} lang - The language for the AI to use
 * @param {number} level - The difficulty level (1, 2, or 3)
 * @returns {Promise<string>} - The AI's response
 */
export const sendToKimi = async (userMessage, conversationHistory, lang = 'en', level = 1) => {
  // Wait a bit for env to load if it hasn't already
  if (KIMI_API_KEYS.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const apiKey = getCurrentApiKey();
  if (!apiKey) {
    console.error('KIMI_API_KEY is not set');
    // Return a fallback response
    return lang === 'zh' 
      ? "你说得很对！还有别的想说的吗？😊" 
      : "That's right! Is there anything else you'd like to say? 😊";
  }
  
  try {
    // Count user messages to determine which question we're on
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
    const questionCount = Math.floor((userMessages.length + 1) / 2); // Each question follows a user message
    
    let systemMessage;
    let prompt;
    
    // Determine how many questions should be asked based on level
    let totalQuestions = 4; // Default
    if (level === 2) totalQuestions = 6;
    if (level === 3) totalQuestions = 5;
    
    // Check if we've reached the question limit
    if (questionCount >= totalQuestions) {
      // Conversation is complete
      return lang === 'zh' 
        ? "太棒了！你已经回答了所有问题。我们今天的对话就到这里吧！🌟" 
        : "Great job! You've answered all the questions. Let's end our conversation here! 🌟";
    }
    
    // Prepare the conversation history for the API
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    if (level === 1) {
      // Level 1 (Kids - simple questions with emojis)
      if (lang === 'zh') {
        systemMessage = "你是一个儿童互动老师，通过图片帮助孩子用简单句子描述和想象。你的语言应简单有趣并配合 emoji。根据对话历史，提出下一个合适的问题。请用中文提问并配合emoji。";
        
        // Determine which question to ask next
        let questionType = "";
        switch(questionCount) {
          case 0:
            questionType = "观察趣味";
            break;
          case 1:
            questionType = "简单细节";
            break;
          case 2:
            questionType = "趣味感受";
            break;
          case 3:
            questionType = "想象声音";
            break;
          default:
            questionType = "有趣的后续问题";
        }
        
        prompt = `根据之前的对话历史，现在请提出第${questionCount + 1}个问题，问题类型是"${questionType}"，请用中文并配合emoji。`;
      } else {
        systemMessage = "You are a kindergarden English teacher. You always speak in simple English with friendly emojis, encourage curiosity. Based on the conversation history, ask the next appropriate question. If the child responds in Chinese, gently encourage them to try in English with a message like 'Let's try in English 😊'";
        
        // Determine which question to ask next
        let questionType = "";
        switch(questionCount) {
          case 0:
            questionType = "Fun observation";
            break;
          case 1:
            questionType = "Simple detail";
            break;
          case 2:
            questionType = "Fun feeling";
            break;
          case 3:
            questionType = "Simple imagination";
            break;
          default:
            questionType = "Interesting follow-up";
        }
        
        prompt = `Based on the previous conversation history, please ask the ${questionCount + 1}th question, the question type is "${questionType}", in simple English with emojis.`;
      }
    } else if (level === 2) {
      // Level 2 (Intermediate - encourage full sentences)
      if (lang === 'zh') {
        systemMessage = "你是一个互动对话AI，帮助学生通过图片练习描述、表达和思考。根据对话历史，提出下一个合适的问题。请用中文提问。适当使用emoji来让对话更生动有趣。";
        
        // Question structure for level 2
        const questionStructures = [
          "整体观察",
          "细节",
          "背景",
          "动作",
          "关系",
          "情感"
        ];
        
        const currentStructure = questionStructures[Math.min(questionCount, questionStructures.length - 1)];
        prompt = `根据之前的对话历史，现在请提出第${questionCount + 1}个问题，问题类型是"${currentStructure}"，请用中文。`;
      } else {
        systemMessage = "You are an interactive conversation AI helping students practice description, expression, and thinking through images. Based on the conversation history, ask the next appropriate question. Use emojis appropriately to make the conversation more engaging. If the learner responds in Chinese, gently encourage them to try in English with a message like 'Let's try in English 😊'";
        
        // Question structure for level 2
        const questionStructures = [
          "Overall observation",
          "Detail",
          "Background",
          "Action",
          "Relationship",
          "Feeling"
        ];
        
        const currentStructure = questionStructures[Math.min(questionCount, questionStructures.length - 1)];
        prompt = `Based on the previous conversation history, please ask the ${questionCount + 1}th question, the question type is "${currentStructure}", in English.`;
      }
    } else if (level === 3) {
      // Level 3 (Advanced - storytelling and analytical thinking)
      if (lang === 'zh') {
        systemMessage = "你是一位初中语文老师。你的任务是通过图片，引导学生去观察、想象和表达，锻炼讲故事的能力。根据对话历史，提出下一个合适的问题。请用中文提问。适当使用emoji来让对话更生动有趣。";
        
        // Question structure for level 3
        const questionStructures = [
          "整体故事",
          "按图细节",
          "情感变化",
          "背景与推理",
          "情节预测"
        ];
        
        const currentStructure = questionStructures[Math.min(questionCount, questionStructures.length - 1)];
        prompt = `根据之前的对话历史，现在请提出第${questionCount + 1}个问题，问题类型是"${currentStructure}"，请用中文。`;
      } else {
        systemMessage = "You are a middle school Chinese language teacher. Your task is to guide students to observe, imagine and express themselves through pictures, and train their storytelling skills. Based on the conversation history, ask the next appropriate question. Use emojis appropriately to make the conversation more engaging. If the learner responds in Chinese, gently encourage them to try in English with a message like 'Let's try in English 😊'";
        
        // Question structure for level 3
        const questionStructures = [
          "Overall story",
          "Detail by picture",
          "Feelings change",
          "Background & reasoning",
          "Prediction"
        ];
        
        const currentStructure = questionStructures[Math.min(questionCount, questionStructures.length - 1)];
        prompt = `Based on the previous conversation history, please ask the ${questionCount + 1}th question, the question type is "${currentStructure}", in English.`;
      }
    }

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "moonshot-v1-8k",
        messages: [
          { role: "system", content: systemMessage },
          ...formattedHistory,
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Kimi API error response:', errorData);
      throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('No response content from API');
    }
  } catch (error) {
    console.error('Error in sendToKimi:', error);
    // Return a fallback response
    return lang === 'zh' 
      ? "你说得很对！还有别的想说的吗？😊" 
      : "That's right! Is there anything else you'd like to say? 😊";
  }
};

/**
 * Generate feedback using Kimi API based on the conversation with the new prompt format
 * @param {Array} conversation - The conversation history
 * @param {string} imageDescription - The description of the image
 * @param {string} lang - The language for the feedback (default: 'en')
 * @returns {Promise<Object>} - The feedback object
 */
export const generateKimiFeedback = async (conversation, imageDescription, lang = 'en') => {
  // Wait a bit for env to load if it hasn't already
  if (KIMI_API_KEYS.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 使用队列串行化请求
  return queueKimiRequest(async () => {
    const apiKey = getCurrentApiKey();
    console.log('Generating feedback with Kimi API');
    
    // 添加自动重试机制（指数退避）
    for (let i = 0; i < 3; i++) {
      try {
        // 如果没有API密钥，直接使用标准反馈
        if (!apiKey) {
          throw new Error('KIMI_API_KEY is not set');
        }

        // Build the conversation text
        let conversationText = "";
        conversation.forEach(msg => {
          const sender = msg.sender === 'user' ? 'Student' : 'Tutor';
          conversationText += `${sender}: ${msg.text}\n`;
        });

        let prompt;
        if (lang === 'zh') {
          prompt = `你是一位鼓励性的中文语言老师 你的任务：根据之前的对话，给出三个部分的针对性反馈：

1. **带表情符号的鼓励评价**
   - 给出温暖、激励性的反馈。
   - 至少包含一个积极的表情符号。

2. **错误总结**
   - 对于表达语言每个错误，用下划线标出错误部分：\`_错误的文本_\`
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
            'Authorization': `Bearer ${apiKey}`
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
        return parseFeedbackResponse(content, lang);
      } catch (error) {
        console.error(`Error calling Kimi API for feedback (attempt ${i+1}):`, error);
        
        // 如果是429错误，进行重试
        if (error.message && error.message.includes("429")) {
          console.warn(`429: 第 ${i+1} 次重试...`);
          // 指数退避：等待 2000ms * (尝试次数)
          await new Promise(r => setTimeout(r, 2000 * (i+1)));
          // 切换到下一个API密钥
          switchToNextApiKey();
          continue;
        } else {
          // 其他错误直接抛出
          throw error;
        }
      }
    }
    
    // 重试3次后仍然失败
    console.error("Kimi API 失败（多次重试后仍429）");
    // 切换到下一个API密钥
    switchToNextApiKey();
    // Fallback to standard feedback based on language
    if (lang === 'zh') {
      return {
        encouragingRemarks: "✅ 很棒的努力！🌟\n你的中文表达清晰而自然 👍，语气也很自信！继续保持，你的进步很明显！🚀",
        errorSummary: "❗ 小修正\n* ❌ \"小狗在跑步步。\" → ✅ \"小狗在跑。\"\n* ❌ \"他们在吃苹果子。\" → ✅ \"他们在吃苹果。\"",
        suggestions: "💡 可以试着这样说\n在看图说话时，可以尝试用更完整的句子，比如：\n* \"小狗正在公园里跑来跑去。\"\n* \"他们一家人坐在桌子旁边，一起吃苹果。\"",
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        encouragingRemarks: "✅ Excellent Effort! 🌟\n* Your speaking was clear and confident👍, which is really impressive! Keep it up, you're improving fast. 🚀",
        errorSummary: "⚠️ Small Fixes\n❌ \"I no know this word.\" → ✅ \"I don't know this word.\"\n❌ \"She is more higher than me.\" → ✅ \"She is higher than me.\"",
        suggestions: "💡 Try These Improvements\nInstead of \"I don't know this word\", you can say:\n* \"I'm not familiar with this word.\"\n* \"I haven't heard this word before.\"",
        timestamp: new Date().toISOString()
      };
    }
  });
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