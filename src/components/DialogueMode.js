import React, { useState, useEffect, useRef } from 'react';
import { startKimiDialogue, sendToKimi } from '../utils/kimiApi';

const DialogueMode = ({ imageId, language, level, onFinish, onCancel }) => {
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

  // Load image description and initialize AI conversation
  const initializeConversation = async () => {
    try {
      const response = await fetch('/descriptions.json');
      const descriptions = await response.json();
      const description = descriptions[imageId] || 'A beautiful image';
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
          case 3: return 5;
          default: return 4;
        }
      };
      
      const questionCount = getQuestionCount();
      const userMessageCount = messages.filter(m => m.sender === 'user').length + 1; // +1 for the new user message
      
      if (userMessageCount >= questionCount) {
        setTimeout(() => {
          onFinish([...messages, userMessage, aiMessage]);
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
        questionCount = 5;
      }
      
      const userMessageCountWithSimulated = messages.filter(m => m.sender === 'user').length + 1; // +1 for the new user message
      if (userMessageCountWithSimulated >= questionCount) {
        setTimeout(() => {
          onFinish([...messages, userMessage, aiMessage]);
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
    onFinish(messages);
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

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">{textContent.title}</h1>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            {textContent.cancel}
          </button>
        </div>
        
        <div className="flex flex-row gap-6">
          {/* Image Section - Fixed position, no scroll */}
          <div className="w-1/2">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4">
              <div className="flex items-center justify-center">
                {/* 根据难度级别加载对应的图片路径 */}
                <img 
                  src={`/img_Level${level}/${imageId}.png`} 
                  alt={language === 'zh' ? '对话提示图片' : 'Conversation prompt'} 
                  className="h-auto max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    // 如果特定级别的图片不存在，尝试加载默认级别图片
                    if (e.target.src.includes('/img_Level')) {
                      // Try level 1 as fallback
                      e.target.src = `/img_Level1/${imageId}.png`;
                    } else if (e.target.src.includes('/img_Level1')) {
                      // If level 1 doesn't exist, show placeholder
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Conversation Section */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col h-[70vh]">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {textContent.conversation}
              </h2>
              
              <div className="flex-grow mb-4 space-y-4 max-h-[45vh] overflow-y-auto">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-4 rounded-lg max-w-[80%] text-[1.5rem] ${
                      message.sender === 'user' 
                        ? 'bg-blue-100 ml-auto' 
                        : 'bg-gray-100 mr-auto'
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {message.sender === 'user' 
                        ? textContent.you
                        : textContent.aiTutor}
                    </div>
                    <div>{message.text}</div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="p-4 rounded-lg bg-gray-100 mr-auto max-w-[80%] text-[1.5rem]">
                    <div className="font-semibold mb-1">
                      {showImageAnalysisMessage ? '' : textContent.aiTutor}
                    </div>
                    <div>
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
                )}
                
                {speechError && (
                  <div className="p-2 rounded-lg bg-red-100 text-red-700 text-sm">
                    {textContent.speechError}: {speechError}
                  </div>
                )}
              </div>
              
              <div className="mt-auto">
                <div className="flex">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={textContent.placeholder}
                    className="flex-grow border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    rows="3"
                    disabled={isLoading}
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={handleSend}
                      disabled={isLoading || (inputValue.trim() === '' && transcript.trim() === '')}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 rounded-tr-lg font-medium"
                    >
                      {textContent.send}
                    </button>
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className={`${
                        isListening 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white px-4 rounded-br-lg font-medium h-full flex items-center justify-center`}
                    >
                      {isListening ? (
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-white rounded-full mr-1 animate-pulse"></div>
                          <span>●</span>
                        </div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {textContent.pressEnter}
                </div>
                {isListening && (
                  <div className="mt-2 text-sm text-green-600">
                    {language === 'zh' ? '正在聆听...' : 'Listening...'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleFinish}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg"
              >
                {textContent.finish}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueMode;