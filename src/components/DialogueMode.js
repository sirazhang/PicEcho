import React, { useState, useEffect, useRef } from 'react';

// 工具函数：生成图片路径
const getImagePath = (level, imageId) => {
  return `/Level${level}/${imageId}.png`;
};

// 工具函数：生成提示图片路径
const getHintPath = (level, imageId) => {
  const hintId = imageId.replace('img', 'hint');
  return `/Level${level}/${hintId}.png`;
};

const DialogueMode = ({ imageId, language, level, onConversationComplete, onCancel }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // For text-to-speech
  const [imageLoading, setImageLoading] = useState(true); // For image loading state
  const [imageError, setImageError] = useState(false); // For image error state
  const [currentImageSrc, setCurrentImageSrc] = useState(''); // For current image source
  
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const isInitialized = useRef(false); // 用于标记是否已初始化
  const synthRef = useRef(window.speechSynthesis); // For text-to-speech

  // 添加useEffect来监听level和imageId的变化
  useEffect(() => {
    // 开发环境显示详细调试信息
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DialogueMode Debug] - level changed to:', level, 'imageId:', imageId);
    }
    
    // 生产环境也记录基本事件，但不暴露敏感信息
    console.info('[DialogueMode] Level or ImageID changed');
    
    // 当level或imageId变化时，加载对应的图片
    if (level && imageId) {
      loadImage();
    }
  }, [level, imageId]);

  // 图片加载函数
  const loadImage = async () => {
    if (!level || !imageId) return;
    
    // 设置加载状态
    setImageLoading(true);
    setImageError(false);
    
    try {
      // 构造图片路径
      const imagePath = getImagePath(level, imageId);
      
      // 创建图片对象来测试加载
      const img = new Image();
      
      // 设置超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Image load timeout')), 10000);
      });
      
      // 图片加载Promise
      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(imagePath);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = imagePath;
      });
      
      // 等待图片加载或超时
      await Promise.race([imagePromise, timeoutPromise]);
      
      // 更新状态
      setCurrentImageSrc(imagePath);
      setImageLoading(false);
    } catch (error) {
      console.error('Error loading image:', error);
      setImageError(true);
      setImageLoading(false);
      
      // 尝试加载默认图片作为后备
      try {
        const fallbackPath = getImagePath(1, imageId);
        const fallbackImg = new Image();
        
        const fallbackTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Fallback image load timeout')), 5000);
        });
        
        const fallbackPromise = new Promise((resolve, reject) => {
          fallbackImg.onload = () => resolve(fallbackPath);
          fallbackImg.onerror = () => reject(new Error('Fallback image failed to load'));
          fallbackImg.src = fallbackPath;
        });
        
        await Promise.race([fallbackPromise, fallbackTimeout]);
        
        setCurrentImageSrc(fallbackPath);
        setImageError(false);
      } catch (fallbackError) {
        console.error('Fallback image also failed to load:', fallbackError);
      }
    }
  };

  // Load questions based on level, language and imageId
  const loadQuestions = async () => {
    try {
      // Determine which question file to load based on language
      const questionFile = language === 'zh' ? 'questions1.json' : 'questions2.json';
      
      // Load questions from the appropriate level file
      const response = await fetch(`/Level${level}/${questionFile}`);
      const questionsData = await response.json();
      
      console.log('Loaded questions for level:', level, 'language:', language, 'imageId:', imageId, 'questions:', questionsData);
      
      // Get questions for the specific image
      let loadedQuestions = [];
      
      // Handle different data structures for different levels
      if (level === 2) {
        // Level 2 has a different structure - array of objects
        const imageData = questionsData.find(item => 
          item[`image_${imageId.split('_')[1]}`] !== undefined
        );
        
        if (imageData) {
          const imageKey = `image_${imageId.split('_')[1]}`;
          loadedQuestions = imageData[imageKey].questions || [];
        }
      } else {
        // Level 1 and 3 have simpler structure - direct object mapping
        loadedQuestions = questionsData[imageId]?.questions || [];
      }
      
      // Limit questions based on level
      // Level 1: 4 questions, Level 2: 6 questions, Level 3: 6 questions
      let limitedQuestions = [];
      switch (level) {
        case 1:
          limitedQuestions = loadedQuestions.slice(0, 4);
          break;
        case 2:
          limitedQuestions = loadedQuestions.slice(0, 6);
          break;
        case 3:
          limitedQuestions = loadedQuestions.slice(0, 6);
          break;
        default:
          limitedQuestions = loadedQuestions.slice(0, 4);
      }
      
      setQuestions(limitedQuestions);
      return limitedQuestions;
    } catch (error) {
      console.error('Error loading questions:', error);
      // Fallback questions
      const fallbackQuestions = language === 'zh' ? [
        "这是谁呀？如果给TA起个名字，你会叫什么？ 🤔",
        "你觉得TA现在在想什么呢？ 💭",
        "你觉得这个地方在哪里？现实中会有吗？ 🏞️",
        "如果你能走进画里，你会做什么？ 🚪"
      ] : [
        "Who is this? If you could give them a name, what would it be?",
        "What do you think they are thinking about right now?",
        "Where do you think this place is? Could it exist in real life?",
        "If you could step inside this picture, what would you do?"
      ];
      
      // Apply level-based limits to fallback questions too
      let limitedFallback = [];
      switch (level) {
        case 1:
          limitedFallback = fallbackQuestions.slice(0, 4);
          break;
        case 2:
          limitedFallback = fallbackQuestions.slice(0, 6);
          break;
        case 3:
          limitedFallback = fallbackQuestions.slice(0, 6);
          break;
        default:
          limitedFallback = fallbackQuestions.slice(0, 4);
      }
      
      setQuestions(limitedFallback);
      return limitedFallback;
    }
  };

  // Initialize conversation with local questions
  const initializeConversation = async () => {
    console.log('initializeConversation called with level:', level, 'imageId:', imageId);
    
    // 重置初始化标记
    isInitialized.current = false;

    try {
      // Load questions
      const loadedQuestions = await loadQuestions();
      
      // Set the initial AI message (first question)
      if (loadedQuestions.length > 0) {
        setMessages([{
          id: 1,
          sender: 'ai',
          text: loadedQuestions[0],
          timestamp: new Date()
        }]);
      }
      
      // 标记为已初始化
      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing conversation:', error);
      
      // 重置初始化标记
      isInitialized.current = false;

      // Even if there's an error, we still need to start the conversation
      const fallbackQuestion = language === 'zh' ? 
        "这是谁呀？如果给TA起个名字，你会叫什么？ 🤔" : 
        "Who is this? If you could give them a name, what would it be?";
      
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
    // 只有当imageId存在且尚未初始化时才初始化对话
    if (imageId && !isInitialized.current) {
      isInitialized.current = true; // 标记为已初始化
      initializeConversation();
    }
    
    // 组件卸载时重置初始化状态
    return () => {
      isInitialized.current = false;
    };
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

  // Initialize speech synthesis
  useEffect(() => {
    // Cleanup function to cancel any ongoing speech when component unmounts
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
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
      // 只有当尚未初始化时才初始化对话
      if (!isInitialized.current) {
        isInitialized.current = true; // 标记为已初始化
        initializeConversation();
      }
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

  // Text-to-speech function
  const speakText = (text) => {
    // Cancel any ongoing speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    if (text !== '') {
      // Set speaking state
      setIsSpeaking(true);
      
      // Create utterance
      const utterThis = new SpeechSynthesisUtterance(text);
      
      // Set utterance properties
      utterThis.lang = language === 'zh' ? 'zh-CN' : 'en-US';
      utterThis.pitch = 1;
      utterThis.rate = 1;
      
      // Event handlers
      utterThis.onend = () => {
        setIsSpeaking(false);
      };
      
      utterThis.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setIsSpeaking(false);
      };
      
      // Speak the utterance
      synthRef.current.speak(utterThis);
    }
  };

  const isProcessing = useRef(false); // 防止重复调用
  const lastCallTime = useRef(0); // 用于防抖

  const handleSend = async () => {
    // 防止重复调用
    if ((inputValue.trim() === '' && transcript.trim() === '') || isLoading || isProcessing.current) {
      return;
    }

    // 防抖处理，防止频繁调用
    const now = Date.now();
    if (now - lastCallTime.current < 1000) { // 最小间隔1秒
      return;
    }

    isProcessing.current = true;
    
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
      // 模拟处理时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get next question based on user response and current question count
      const userMessagesCount = messages.filter(m => m.sender === 'user').length + 1; // +1 for current message
      
      let nextQuestion = "";
      
      // Check if we've reached the question limit
      const questionLimit = level === 1 ? 4 : 6;
      
      if (userMessagesCount < questionLimit && userMessagesCount < questions.length) {
        // Positive response before next question
        const positiveResponse = language === 'zh' ? 
          "很棒的回答！👍 " : 
          "Great answer! 👍 ";
        
        nextQuestion = positiveResponse + questions[userMessagesCount];
      } else {
        // Final positive response
        const finalResponse = language === 'zh' ? 
          "谢谢你和我练习！🎉" : 
          "Thanks for practicing with me! 🎉";
        
        nextQuestion = finalResponse;
      }

      const aiMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: nextQuestion,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      lastCallTime.current = Date.now(); // 更新最后调用时间
      
      // 检查对话是否完成
      if (userMessagesCount >= questionLimit || userMessagesCount >= questions.length) {
        // 延迟一点时间确保状态更新完成
        setTimeout(() => {
          onConversationComplete(messages.concat(userMessage, aiMessage));
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      setIsLoading(false);
      
      // 使用统一的回退响应处理
      const userMessagesCount = messages.filter(m => m.sender === 'user').length + 1;
      const questionLimit = level === 1 ? 4 : 6;
      
      let nextQuestion = "";
      if (userMessagesCount < questionLimit) {
        const positiveResponse = language === 'zh' ? 
          "很棒的回答！👍 " : 
          "Great answer! 👍 ";
        
        nextQuestion = positiveResponse + (language === 'zh' ? 
          "你能告诉我更多吗？" : 
          "Can you tell me more?");
      } else {
        nextQuestion = language === 'zh' ? 
          "谢谢你和我练习！🎉" : 
          "Thanks for practicing with me! 🎉";
      }
      
      const aiMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: nextQuestion,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 检查是否达到问题数量限制
      if (userMessagesCount >= questionLimit) {
        setTimeout(() => {
          onConversationComplete(messages.concat(userMessage, aiMessage));
        }, 1000);
      }
    } finally {
      isProcessing.current = false;
    }
  };

  // 生成统一的回退响应
  const generateFallbackResponse = (userMessageCount, language, newUserMessageId) => {
    const baseResponses = {
      zh: [
        "这是谁呀？如果给TA起个名字，你会叫什么？ 🤔",
        "你觉得TA现在在想什么呢？ 💭",
        "你觉得这个地方在哪里？现实中会有吗？ 🏞️",
        "如果你能走进画里，你会做什么？ 🚪",
        "画面里最吸引你的一点是什么？ 👀",
        "如果这张图是故事的开头，会发生什么？📖",
        "你觉得角色们开心吗？为什么？ 😆",
        "看到这张图，你有什么感觉？🤔",
        "如果让你待在这个场景里，你会觉得放松还是兴奋？",
        "如果你能给这幅画加一个细节，你会加什么？💡",
        "如果可以和其中一个角色做朋友，你会选谁？🐹🐱🧚",
        "你会想要去体验图片的场景吗？",
        "如果你能和TA对话，你第一句话会说什么？ 🗨️"
      ],
      en: [
        "Who is this? If you could give them a name, what would it be? 🧐",
        "What do you think they are thinking about right now? 💡",
        "If you could talk to them, what would be the first thing you say? 🎤",
        "Where do you think this place is? Could it exist in real life? 🏝️",
        "If you could step inside this picture, what would you do? 🚶",
        "What's the most interesting detail in this picture for you? 🔍",
        "How does this picture make you feel? 😊",
        "Do you think the characters are happy? Why? 😺",
        "If this were a story, what would happen in the next scene? 📖",
        "What fun thing would you add to this picture? 🎨",
        "Who would you most like to be friends with? 🐹🐱🧚"
      ]
    };
    
    const responses = baseResponses[language === 'zh' ? 'zh' : 'en'];
    const responseText = responses[userMessageCount - 1] || (language === 'zh' ? "谢谢你和我练习！🎉" : "Thanks for practicing with me! 🎉");
    
    return {
      id: newUserMessageId + 1,
      sender: 'ai',
      text: responseText,
      timestamp: new Date()
    };
  };

  // 统一的问题数量检查逻辑
  const checkQuestionLimit = (conversationMessages) => {
    // 根据等级获取问题数量限制
    const getQuestionCount = () => {
      switch (level) {
        case 1: return 4;
        case 2: return 6;
        case 3: return 6;
        default: return 4;
      }
    };
    
    const questionCount = getQuestionCount();
    const userMessageCount = conversationMessages.filter(m => m.sender === 'user').length;
    
    if (userMessageCount >= questionCount) {
      setTimeout(() => {
        onConversationComplete(conversationMessages);
      }, 1500);
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

  // Add custom CSS for the pulsing animation
  const customStyles = `
    @keyframes pulse-slow {
      0%, 100% {
        transform: scale(0.95);
      }
      50% {
        transform: scale(1);
      }
    }
    
    .animate-pulse-slow {
      animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes typing-bounce {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-5px);
      }
    }
    
    .typing-dot {
      animation: typing-bounce 1.5s infinite ease-in-out;
    }
    
    .typing-dot-delay-1 {
      animation-delay: 0.2s;
    }
    
    .typing-dot-delay-2 {
      animation-delay: 0.4s;
    }
  `;

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
          <div className="w-1/2 relative">
            <div className="h-full flex items-center justify-center p-0 m-0">
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
            
            {/* Hint Button */}
            <button 
              onClick={() => setShowHint(true)}
              className="absolute bottom-4 left-4 w-16 h-16 focus:outline-none"
            >
              <img 
                src="/design/hint.png" 
                alt="Hint" 
                className="w-full h-full object-contain"
              />
            </button>
            
            {/* Hint Panel */}
            {showHint && (
              <div className="absolute bottom-0 left-0 w-2/3 h-[55vh]">
                <button 
                  onClick={() => setShowHint(false)}
                  className="absolute top-4 right-20 w-8 h-8 z-10 focus:outline-none"
                >
                  <img 
                    src="/design/close_01.png" 
                    alt="Close" 
                    className="w-full h-full object-contain"
                  />
                </button>
                <img 
                  src={getHintPath(level, imageId)} 
                  alt="Hint" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
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
                            className="w-24 h-24 mr-4 object-contain align-start animate-pulse-slow" // Reduced from 80 to 24 (8vh)
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
                            {/* Play button for AI messages */}
                            {message.sender === 'ai' && (
                              <button 
                                onClick={() => speakText(message.text)}
                                className="ml-2 focus:outline-none"
                                aria-label={isSpeaking ? "Stop speaking" : "Play audio"}
                              >
                                <img 
                                  src="/design/play.png" 
                                  alt="Play" 
                                  className="w-6 h-6 object-contain inline-block"
                                />
                              </button>
                            )}
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
                          className="w-24 h-24 mr-4 object-contain align-start animate-pulse-slow" // Reduced from 80 to 24 (8vh)
                        />
                        <div className="flex flex-col">
                          <div className="font-semibold mb-1">{textContent.aiTutor}</div>
                          <div className="bg-[#A6e2b1] p-6 rounded-lg">
                            <div className="flex space-x-1 items-center justify-center">
                              <div className="w-2 h-2 bg-gray-600 rounded-full typing-dot"></div>
                              <div className="w-2 h-2 bg-gray-600 rounded-full typing-dot typing-dot-delay-1"></div>
                              <div className="w-2 h-2 bg-gray-600 rounded-full typing-dot typing-dot-delay-2"></div>
                            </div>
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
      {/* Inject custom styles */}
      <style>{customStyles}</style>
    </div>
  );
}

export default DialogueMode;