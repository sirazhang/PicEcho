import React, { useState, useEffect } from 'react';
import { startKimiDialogue, sendToKimi } from '../utils/kimiApi';

const DialogueMode = ({ imageId, onFinish, onCancel }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [showImageAnalysisMessage, setShowImageAnalysisMessage] = useState(false);

  // Load image description and initialize AI conversation
  useEffect(() => {
    const initializeConversation = async () => {
      // Get the latest language setting
      const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
      
      try {
        const response = await fetch('/descriptions.json');
        const descriptions = await response.json();
        const description = descriptions[imageId] || 'A beautiful image';
        setImageDescription(description);
        
        // Show image analysis message
        setShowImageAnalysisMessage(true);
        
        // Call Kimi API to start the conversation with selected language
        setIsLoading(true);
        const firstQuestion = await startKimiDialogue(description, currentLanguage);
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
        if (currentLanguage === 'zh') {
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

    if (imageId) {
      initializeConversation();
    }
  }, [imageId]);

  const handleSend = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    // Get the latest language setting
    const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';

    // Add user message
    const newUserMessageId = messages.length + 1;
    const userMessage = {
      id: newUserMessageId,
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call Kimi API to get AI response with selected language
      const aiResponse = await sendToKimi(inputValue, messages, currentLanguage);
      
      const aiMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // If this was the last question, finish the dialogue
      // We want 4 user answers, which means 4 AI questions have been asked
      const userMessageCount = messages.filter(m => m.sender === 'user').length + 1; // +1 for the new user message
      if (userMessageCount >= 4) { // 4 user answers
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
      
      if (currentLanguage === 'zh') {
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
      if (userMessageCount >= 4) { // 4 user answers
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

  // Get the latest language setting for UI text
  const currentLanguage = localStorage.getItem('selectedLanguage') || 'en';

  // Define text content for different languages
  const getTextContent = () => {
    if (currentLanguage === 'zh') {
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
        imageAnalysis: 'AI 正在仔细看你的图片📷，马上就来！'
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
        imageAnalysis: 'AI is carefully looking at your image 📷—just a moment!'
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
                <img 
                  src={`/img/${imageId}.png`} 
                  alt={currentLanguage === 'zh' ? '对话提示图片' : 'Conversation prompt'} 
                  className="h-auto max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
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
              </div>
              
              <div className="mt-auto">
                <div className="flex">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={textContent.placeholder}
                    className="flex-grow border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    rows="3"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || inputValue.trim() === ''}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 rounded-r-lg font-medium"
                  >
                    {textContent.send}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {textContent.pressEnter}
                </div>
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