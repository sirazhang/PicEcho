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
  const [selectedLevel, setSelectedLevel] = useState(1); // Add level state

  // Load selected language from localStorage on app start
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  // Load selected level from localStorage on app start
  useEffect(() => {
    const savedLevel = localStorage.getItem('selectedLevel');
    if (savedLevel) {
      setSelectedLevel(parseInt(savedLevel, 10));
    }
  }, []);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/dialogue/')) {
        // Parse the hash to extract imageId, language, and level
        const parts = hash.substring(11).split('/');
        const imageId = parts[0];
        const language = parts[1] || 'en';
        const level = parts[2] ? parseInt(parts[2], 10) : 1;
        
        console.log('Parsed from hash - imageId:', imageId, 'language:', language, 'level:', level); // 添加日志以便调试
        
        setSelectedImage(imageId);
        setSelectedLanguage(language);
        setSelectedLevel(level);
        setCurrentScreen('dialogue');
      } else if (hash === '#/map') {
        setMap(true);
        setCurrentScreen('map');
      } else {
        // Default to home screen
        setCurrentScreen('home');
        setFeedback(null);
        setConversationHistory([]);
        setSelectedPostcard(null);
      }
    };

    // Handle initial hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleStartDialogue = (imageId, language, level) => {
    setSelectedImage(imageId);
    setSelectedLanguage(language || 'en'); // Set language when starting dialogue
    setSelectedLevel(level || 1); // Set level when starting dialogue
    
    // Save level to localStorage
    localStorage.setItem('selectedLevel', level || 1);
    
    // Update URL hash with imageId, language, and level
    window.location.hash = `#/dialogue/${imageId}/${language || 'en'}/${level || 1}`;
    
    setCurrentScreen('dialogue');
  };

  const handleFinishDialogue = async (conversation) => {
    setConversationHistory(conversation);
    setCurrentScreen('loading');
    setIsLoading(true);
    setError('');

    try {
      // Get image description from the appropriate level file
      const response = await fetch(`/descriptions_level${selectedLevel}.json`);
      const descriptions = await response.json();
      const imageDescription = descriptions[selectedImage] || 'A beautiful image';

      // Generate feedback using Kimi API with selected language
      const feedbackData = await generateKimiFeedback(conversation, imageDescription, selectedLanguage);
      
      setFeedback(feedbackData);
      setIsLoading(false);
      setCurrentScreen('review');
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError('Failed to load description or generate feedback');
      setIsLoading(false);
      // 即使出错也跳转到review页面
      setCurrentScreen('review');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate simulated feedback when API is not available
  const generateSimulatedFeedback = (language) => {
    if (language === 'zh') {
      return {
        encouragingRemarks: "做得很好！你的英语表达能力在不断提高。继续保持！",
        errorSummary: "有一些小的语法错误，特别是在时态使用方面。",
        suggestions: "建议多练习动词时态，可以尝试用过去时描述图片中的动作。"
      };
    } else {
      return {
        encouragingRemarks: "Great job! Your English expression skills are improving. Keep it up!",
        errorSummary: "There are some minor grammar errors, especially with tense usage.",
        suggestions: "Try to practice verb tenses more. You could describe the actions in the image using past tense."
      };
    }
  };

  const handleCancelDialogue = () => {
    setCurrentScreen('home');
    setConversationHistory([]);
  };

  const handleSavePostcard = (postcardData) => {
    // In a real app, you would send this to a backend
    console.log('Saving postcard:', postcardData);
    
    // Save to localStorage for demo purposes
    const savedPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
    savedPostcards.push(postcardData);
    localStorage.setItem('savedPostcards', JSON.stringify(savedPostcards));
  };

  const handleViewMap = () => {
    setMap(true);
    setCurrentScreen('map');
  };

  const handleViewPostcard = (postcard) => {
    setSelectedPostcard(postcard);
    setCurrentScreen('review');
  };

  const handleBackToMap = () => {
    setMap(true);
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
          onOpenMapReview={handleViewMap}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
        />
      )}

      {currentScreen === 'dialogue' && (
        <DialogueMode 
          imageId={selectedImage}
          language={selectedLanguage}
          level={selectedLevel}
          onConversationComplete={handleFinishDialogue}
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

      {currentScreen === 'review' && (
        <ReviewPostcard
          imageId={selectedImage}
          conversationHistory={conversationHistory}
          feedback={feedback}
          onSave={handleSavePostcard}
          onBack={handleBackToHome}
          isLoading={isLoading}
          error={error}
          selectedLanguage={selectedLanguage}
          level={selectedLevel}
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