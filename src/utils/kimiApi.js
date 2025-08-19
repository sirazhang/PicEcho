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
  
  if (env.KIMI_API_URL) {
    KIMI_API_URL = env.KIMI_API_URL;
  }
});

/**
 * Get the current API key, rotating through available keys
 * @returns {string|null} - The current API key or null if none available
 */
const getCurrentApiKey = () => {
  if (KIMI_API_KEYS.length === 0) return null;
  
  const key = KIMI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % KIMI_API_KEYS.length;
  return key;
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

        // Build the conversation text - only include user responses
        let conversationText = "";
        conversation.forEach(msg => {
          if (msg.sender === 'user') {
            conversationText += `Student: ${msg.text}\n`;
          }
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

图片描述:
${imageDescription}

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

Image Description:
${imageDescription}

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