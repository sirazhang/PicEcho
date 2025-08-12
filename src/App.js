// src/App.js
import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DialogueMode from './components/DialogueMode';
import ReviewPostcard from './components/ReviewPostcard';
import WorldMapReview from './components/WorldMapReview';
import { generateKimiFeedback } from './utils/kimiApi';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedImage, setSelectedImage] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [map, setMap] = useState(false);
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Add language state

  // Load selected language from localStorage on app start
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  const handleStartDialogue = (imageId, language) => {
    setSelectedImage(imageId);
    setSelectedLanguage(language || 'en'); // Set language when starting dialogue
    setCurrentScreen('dialogue');
  };

  const handleFinishDialogue = async (conversation) => {
    setConversationHistory(conversation);
    setCurrentScreen('loading');
    setIsLoading(true);
    setError('');

    try {
      // Get image description
      const response = await fetch('/descriptions.json');
      const descriptions = await response.json();
      const imageDescription = descriptions[selectedImage] || 'A beautiful image';

      // Generate feedback using Kimi API with selected language
      const feedbackData = await generateKimiFeedback(conversation, imageDescription, selectedLanguage);
      setFeedback(feedbackData);
      setCurrentScreen('feedback');
    } catch (err) {
      console.error('Error generating feedback:', err);
      // Generate simulated feedback when API call fails
      const simulatedFeedback = generateSimulatedFeedback(selectedLanguage);
      setFeedback(simulatedFeedback);
      setCurrentScreen('feedback');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate simulated feedback when API is not available
  const generateSimulatedFeedback = (language) => {
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
  };

  const handleCancelDialogue = () => {
    setCurrentScreen('home');
    setConversationHistory([]);
  };

  const handleSavePostcard = (postcardData) => {
    const savedPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
    
    // Check if this postcard already exists
    const existingIndex = savedPostcards.findIndex(
      card => card.imageId === postcardData.imageId && card.timestamp === postcardData.timestamp
    );
    
    if (existingIndex >= 0) {
      // Update existing postcard
      savedPostcards[existingIndex] = postcardData;
    } else {
      // Add new postcard
      savedPostcards.push(postcardData);
    }
    
    localStorage.setItem('savedPostcards', JSON.stringify(savedPostcards));
  };

  const handleOpenMapReview = () => {
    setMap(true);
    setCurrentScreen('map');
  };

  const handleViewPostcard = (postcard) => {
    setSelectedPostcard(postcard);
    setCurrentScreen('feedback');
  };

  const handleBackToMap = () => {
    setSelectedPostcard(null);
    setCurrentScreen('map');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setFeedback(null);
    setConversationHistory([]);
    setSelectedPostcard(null);
  };

  return (
    <div className="App">
      {currentScreen === 'home' && (
        <HomeScreen 
          onStartDialogue={handleStartDialogue} 
          onOpenMapReview={handleOpenMapReview}
        />
      )}

      {currentScreen === 'dialogue' && (
        <DialogueMode 
          imageId={selectedImage}
          onFinish={handleFinishDialogue}
          onCancel={handleCancelDialogue}
        />
      )}

      {currentScreen === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {selectedLanguage === 'zh' ? '正在生成反馈...' : 'Generating Feedback...'}
            </h2>
            <p className="text-gray-600">
              {selectedLanguage === 'zh' 
                ? '我们正在分析您的对话并生成个性化反馈' 
                : 'We are analyzing your conversation and generating personalized feedback'}
            </p>
          </div>
        </div>
      )}

      {currentScreen === 'feedback' && (
        <ReviewPostcard 
          imageId={selectedImage}
          conversationHistory={conversationHistory}
          feedback={feedback || selectedPostcard}
          onSave={handleSavePostcard}
          onBack={selectedPostcard ? handleBackToMap : handleBackToHome}
          isLoading={isLoading}
          error={error}
          selectedLanguage={selectedLanguage} // Pass language to feedback component
        />
      )}

      {currentScreen === 'map' && (
        <WorldMapReview 
          onBack={handleBackToHome}
          onViewPostcard={handleViewPostcard}
        />
      )}
    </div>
  );
};

export default App;