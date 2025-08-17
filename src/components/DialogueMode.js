import React, { useState, useEffect, useRef } from 'react';
import { startKimiDialogue, sendToKimi } from '../utils/kimiApi';

// 工具函数：生成图片路径
const getImagePath = (level, imageId) => {
  return `/Level${level}/${imageId}.png`;
};

const DialogueMode = ({ imageId, language, level, onConversationComplete, onCancel }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [showImageAnalysisMessage, setShowImageAnalysisMessage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // 添加useEffect来监听level和imageId的变化
  useEffect(() => {
    // 开发环境显示详细调试信息
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DialogueMode Debug] - level changed to:', level, 'imageId:', imageId);
    }
    
    // 生产环境也记录基本事件，但不暴露敏感信息
    console.info('[DialogueMode] Level or ImageID changed');
  }, [level, imageId]);

  // Load image description and initialize AI conversation
  const initializeConversation = async () => {
    console.log('initializeConversation called with level:', level, 'imageId:', imageId);
    
    try {
      // Load image descriptions from the appropriate level file
      const response = await fetch(`/Level${level}/descriptions.json`);
      const descriptions = await response.json();
      const description = descriptions[imageId] || 'A beautiful image';
      
      console.log('Loaded description for image:', imageId, 'in level:', level, 'description:', description);
      
      setImageDescription(description);
      
      // Show image analysis message
      setShowImageAnalysisMessage(true);
      
      // Call Kimi API to start the conversation with selected language and level
      setIsLoading(true);
      const firstQuestion = await startKimiDialogue(description, language, level);
      setIsLoading(false);
      setShowImageAnalysisMessage(false);
      
      // Set the initial AI message
      setMessages([{
        id: 1,
        sender: 'ai',
        text: firstQuestion,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      setIsLoading(false);
      setShowImageAnalysisMessage(false);
      setImageDescription('A beautiful image');
      
      // Even if there's an error, we still need to start the conversation
      let fallbackQuestion = "What do you see in this image? 🤔";
      if (language === 'zh') {
        fallbackQuestion = "你在这张图片中看到了什么？🤔";
      }
      
      setMessages([{
        id: 1,
        sender: 'ai',
        text: fallbackQuestion,
        timestamp: new Date()
      }]);
    }
  };

  useEffect(() => {
    console.log('useEffect for initializeConversation triggered. imageId:', imageId, 'language:', language, 'level:', level);
    if (imageId) {
      initializeConversation();
    }
  }, [imageId, language, level]);

  // Initialize speech recognition
  useEffect(() => {
    const initSpeechRecognition = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setSpeechError('Speech recognition not supported in this browser');
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      // Set language based on current selection
      recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + transcript + ' ');
            setInputValue(prev => prev + transcript + ' ');
          } else {
            interimTranscript += transcript;
          }
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    };
    
    initSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Update speech recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    }
  }, [language]);
  
  // Reset conversation when level changes
  useEffect(() => {
    if (imageId && level) {
      // Reset the conversation when level changes
      setMessages([]);
      setImageDescription('');
      initializeConversation();
    }
  }, [level, imageId]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition not initialized');
      return;
    }
    
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setSpeechError('Failed to start speech recognition. Please check microphone permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleSend = async () => {
    if ((inputValue.trim() === '' && transcript.trim() === '') || isLoading) return;

    // Add user message
    const newUserMessageId = messages.length + 1;
    const userMessage = {
      id: newUserMessageId,
      sender: 'user',
      text: inputValue.trim() || transcript.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setTranscript('');
    setIsLoading(true);

    try {
      // Call Kimi API to get AI response with selected language and level
      const aiResponse = await sendToKimi(userMessage.text, [...messages, userMessage], language, level);
      
      const aiMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // Determine question count based on level
      const getQuestionCount = () => {
        switch (level) {
          case 1: return 4;
          case 2: return 6;
          case 3: return 8;
          default: return 4;
        }
      };
      
      const questionCount = getQuestionCount();
      const userMessageCount = messages.filter(m => m.sender === 'user').length + 1; // +1 for the new user message
      
      if (userMessageCount >= questionCount) {
        setTimeout(() => {
          onConversationComplete([...messages, userMessage, aiMessage]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
      
      // Create simulated AI response as fallback
      let simulatedResponse;
      const userMessageCount = messages.filter(m => m.sender === 'user').length + 1; // +1 for the new user message
      
      if (language === 'zh') {
        const simulatedResponses = [
          "很有趣！能告诉我更多吗？😊",
          "观察得很好！这让你有什么感受？🌟",
          "我明白了！你还注意到图片中的什么？🔍",
          "很棒！让我们用一个有创意的问题来结束 - 如果你能进入这张图片，你会做什么？✨"
        ];
        simulatedResponse = simulatedResponses[userMessageCount - 1] || "谢谢你和我练习！🎉";
      } else {
        const simulatedResponses = [
          "That's interesting! Can you tell me more about it? 😊",
          "Great observation! How does this make you feel? 🌟",
          "I see! What else do you notice in the image? 🔍",
          "Wonderful! Let's wrap up with a creative question - if you could step into this image, what would you do? ✨"
        ];
        simulatedResponse = simulatedResponses[userMessageCount - 1] || "Thanks for practicing with me! 🎉";
      }
      
      const aiMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: simulatedResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // If this was the last question, finish the dialogue even with simulated response
      // Different levels have different question counts
      let questionCount = 4; // Default
      if (level === 1) {
        questionCount = 4;
      } else if (level === 2) {
        questionCount = 6;
      } else if (level === 3) {
        questionCount = 8;
      }
      
      const userMessageCountWithSimulated = messages.filter(m => m.sender === 'user').length + 1; // +1 for the new user message
      if (userMessageCountWithSimulated >= questionCount) {
        setTimeout(() => {
          onConversationComplete([...messages, userMessage, aiMessage]);
        }, 1500);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFinish = () => {
    onConversationComplete(messages);
  };

  // Define text content for different languages
  const getTextContent = () => {
    if (language === 'zh') {
      return {
        title: 'ChatPic',
        cancel: '取消',
        conversation: '对话',
        you: '你',
        aiTutor: 'AI导师',
        placeholder: '在这里输入你的回答...',
        send: '发送',
        finish: '结束对话',
        pressEnter: '按回车发送，Shift+回车换行',
        imageAnalysis: 'AI 正在仔细看你的图片📷，马上就来！',
        startListening: '开始语音输入',
        stopListening: '停止语音输入',
        speechNotSupported: '您的浏览器不支持语音识别',
        speechError: '语音识别错误'
      };
    } else {
      return {
        title: 'ChatPic',
        cancel: 'Cancel',
        conversation: 'Conversation',
        you: 'You',
        aiTutor: 'AI Tutor',
        placeholder: 'Type your response here...',
        send: 'Send',
        finish: 'Finish Conversation',
        pressEnter: 'Press Enter to send, Shift+Enter for new line',
        imageAnalysis: 'AI is carefully looking at your image 📷—just a moment!',
        startListening: 'Start voice input',
        stopListening: 'Stop voice input',
        speechNotSupported: 'Speech recognition is not supported in your browser',
        speechError: 'Speech recognition error'
      };
    }
  };

  const textContent = getTextContent();

  // 预加载图片并验证是否存在
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');

  useEffect(() => {
    if (!imageId || !level) return;
    
    const loadImage = async () => {
      setImageLoading(true);
      setImageError(false);
      const imageSrc = getImagePath(level, imageId);
      setCurrentImageSrc(imageSrc); // 确保设置currentImageSrc
      
      try {
        // 创建图片加载的辅助函数
        const loadImageWithFallback = (src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            
            // 设置超时防止永久挂起
            const timeoutId = setTimeout(() => {
              reject(new Error('Image load timeout'));
            }, 5000);
            
            img.onload = () => {
              clearTimeout(timeoutId);
              resolve(src);
            };
            
            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error('Image load error'));
            };
          });
        };
        
        // 尝试加载当前级别的图片
        try {
          await loadImageWithFallback(imageSrc);
          console.log(`Successfully loaded image: ${imageSrc}`);
          setImageLoading(false);
          setImageError(false);
        } catch (error) {
          console.log(`Failed to load image: ${imageSrc}`, error);
          // 如果当前级别的图片加载失败，尝试加载级别1的图片作为后备
          const fallbackSrc = getImagePath(1, imageId);
          try {
            await loadImageWithFallback(fallbackSrc);
            console.log(`Successfully loaded fallback image: ${fallbackSrc}`);
            setCurrentImageSrc(fallbackSrc);
            setImageLoading(false);
            setImageError(false);
          } catch (fallbackError) {
            console.log(`Failed to load fallback image: ${fallbackSrc}`, fallbackError);
            setImageLoading(false);
            setImageError(true);
          }
        }
      } catch (error) {
        console.error('Error in image loading process:', error);
        setImageLoading(false);
        setImageError(true);
      }
    };

    loadImage();
  }, [imageId, level]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#e5f5fb' }}>
      <div className="max-w-8xl mx-auto w-full">
        {/* Header with Home and Complete buttons */}
        <div className="flex justify-between items-center p-6">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: '#003153',
              color: 'white',
              minWidth: '120px',
              minHeight: '40px'
            }}
          >
            {language === 'zh' ? '主页' : 'Home'}
          </button>
          <button
            onClick={handleFinish}
            className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: '#66ab4b',
              color: 'white',
              minWidth: '120px',
              minHeight: '40px'
            }}
          >
            {language === 'zh' ? '完成' : 'Complete'}
          </button>
        </div>
        
        <div className="flex flex-row gap-6 px-6 pb-6" style={{ height: '90vh' }}>
          {/* Image Section */}
          <div className="w-1/2">
            <div className="h-full flex items-center justify-center border-2 border-black p-0 m-0">
              <div className="flex items-center justify-center h-full p-0 m-0">
                {/* 根据难度级别加载对应的图片路径 */}
                {imageLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></div>
                    <span className="text-gray-700">{language === 'zh' ? '加载图片中...' : 'Loading image...'}</span>
                  </div>
                ) : imageError ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <p className="text-red-500 mb-2">{language === 'zh' ? '图片未找到' : 'Image not found'}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {language === 'zh' ? '重试' : 'Retry'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={currentImageSrc} 
                    alt={language === 'zh' ? '对话提示图片' : 'Conversation prompt'} 
                    className="max-h-full max-w-full object-contain block"
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Chat Section */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-grow border-8 border-[#77c6d7] bg-white rounded-xl p-6 flex flex-col" style={{ height: '90vh' }}>
              <div className="flex-grow mb-4 overflow-y-auto">
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`rounded-lg max-w-[90%] font-sans tracking-wide leading-relaxed ${
                        message.sender === 'user' 
                          ? 'ml-auto text-base' 
                          : 'mr-auto text-base'
                      }`}
                    >
                      <div className="flex items-start">
                        {message.sender === 'ai' && (
                          <img 
                            src="/design/robot.png" 
                            alt="AI Tutor" 
                            className="w-24 h-24 mr-4 object-contain align-start" // Reduced from 80 to 24 (8vh)
                          />
                        )}
                        <div className="flex flex-col">
                          <div className="font-semibold mb-1">
                            {message.sender === 'user' 
                              ? textContent.you
                              : message.sender === 'ai'
                              ? textContent.aiTutor
                              : ''}
                          </div>
                          <div className={`p-6 rounded-lg ${message.sender === 'ai' ? 'bg-[#A6e2b1]' : ''}`}>
                            {message.text}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="rounded-lg mr-auto max-w-[90%] text-base font-sans tracking-wide leading-relaxed">
                      <div className="flex items-start">
                        <img 
                          src="/design/robot.png" 
                          alt="AI Tutor" 
                          className="w-24 h-24 mr-4 object-contain align-start" // Reduced from 80 to 24 (8vh)
                        />
                        <div className="flex flex-col">
                          <div className="font-semibold mb-1">{textContent.aiTutor}</div>
                          <div className="bg-[#A6e2b1] p-6 rounded-lg">
                            {showImageAnalysisMessage ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mr-2"></div>
                                {textContent.imageAnalysis}
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {speechError && (
                    <div className="p-2 rounded-lg bg-red-100 text-red-700 text-sm">
                      {textContent.speechError}: {speechError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="flex">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={textContent.placeholder}
                    className="flex-grow border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-sans"
                    rows="1"
                    disabled={isLoading}
                    style={{ minHeight: '30px' }}
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={handleSend}
                      disabled={isLoading || (inputValue.trim() === '' && transcript.trim() === '')}
                      className="bg-white p-0 rounded-tr-lg font-medium flex items-center justify-center"
                    >
                      <img 
                        src="/design/send.png" 
                        alt="Send" 
                        className="w-12 h-12 object-contain"
                      />
                    </button>
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className="bg-white p-0 rounded-br-lg h-full flex items-center justify-center"
                    >
                      {isListening ? (
                        <div className="flex items-center">
                          <div className="w-1 h-1 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                          <span className="text-xs">●</span>
                        </div>
                      ) : (
                        <img 
                          src="/design/voice.png" 
                          alt="Voice Input" 
                          className="w-12 h-12 object-contain"
                        />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mt-1 text-xs text-gray-500">
                  {textContent.pressEnter}
                </div>
                {isListening && (
                  <div className="mt-1 text-xs text-green-600">
                    {language === 'zh' ? '正在聆听...' : 'Listening...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DialogueMode;
