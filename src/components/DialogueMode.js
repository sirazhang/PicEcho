import React, { useState, useEffect } from 'react';
import { startKimiDialogue, sendToKimi } from '../utils/kimiApi';

const DialogueMode = ({ imageId, onFinish, onCancel }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageDescription, setImageDescription] = useState('');

  // Load image description and initialize AI conversation
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        const response = await fetch('/descriptions.json');
        const descriptions = await response.json();
        const description = descriptions[imageId] || 'A beautiful image';
        setImageDescription(description);
        
        // Call Kimi API to start the conversation
        setIsLoading(true);
        const firstQuestion = await startKimiDialogue(description);
        setIsLoading(false);
        
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
        setImageDescription('A beautiful image');
        
        // Even if there's an error, we still need to start the conversation
        setMessages([{
          id: 1,
          sender: 'ai',
          text: 'What do you see in this image?',
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
      // Call Kimi API to get AI response
      const aiResponse = await sendToKimi(inputValue, messages);
      
      const aiMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);

      // If this was the last question, finish the dialogue
      const aiMessageCount = messages.filter(m => m.sender === 'ai').length;
      if (aiMessageCount >= 3) {
        setTimeout(() => {
          onFinish([...messages, userMessage, aiMessage]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
      
      // Show error message to user
      const errorMessage = {
        id: newUserMessageId + 1,
        sender: 'ai',
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">ChatPic</h1>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row flex-grow gap-6">
          {/* Image Section */}
          <div className="md:w-1/2 flex flex-col">
            <div className="bg-white rounded-xl shadow-lg p-4 flex-grow flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Image</h2>
              <div className="flex-grow flex items-center justify-center">
                <img 
                  src={`/img/${imageId}.png`} 
                  alt="Conversation prompt" 
                  className="max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                  }}
                />
              </div>
              <div className="mt-4 text-gray-600">
                <p><span className="font-medium">Description:</span> {imageDescription}</p>
              </div>
            </div>
          </div>
          
          {/* Conversation Section */}
          <div className="md:w-1/2 flex flex-col">
            <div className="bg-white rounded-xl shadow-lg p-4 flex-grow flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Conversation</h2>
              
              <div className="flex-grow overflow-y-auto mb-4 space-y-4 max-h-[50vh]">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`p-4 rounded-lg max-w-[80%] ${
                      message.sender === 'user' 
                        ? 'bg-blue-100 ml-auto' 
                        : 'bg-gray-100 mr-auto'
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {message.sender === 'user' ? 'You' : 'AI Tutor'}
                    </div>
                    <div>{message.text}</div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="p-4 rounded-lg bg-gray-100 mr-auto max-w-[80%]">
                    <div className="font-semibold mb-1">AI Tutor</div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
                    placeholder="Type your response here..."
                    className="flex-grow border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || inputValue.trim() === ''}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 rounded-r-lg font-medium"
                  >
                    Send
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleFinish}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg"
              >
                Finish Conversation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueMode;