import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DialogueMode from './components/DialogueMode';
import ReviewPostcard from './components/ReviewPostcard';
import WorldMapReview from './components/WorldMapReview';
import { generateKimiFeedback } from './utils/kimiApi';
import './index.css'; // Import the CSS file

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'dialogue', 'review', 'loading'
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPostcard, setSelectedPostcard] = useState(null);

  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const savedLevel = localStorage.getItem('selectedLevel');
    
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
    
    if (savedLevel) {
      setSelectedLevel(parseInt(savedLevel, 10));
    }
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
      const response = await fetch(`/Level${selectedLevel}/descriptions.json`);
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
    setSelectedImage('');
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
    setCurrentScreen('map');
  };

  const handleViewPostcard = (postcard) => {
    setSelectedPostcard(postcard);
    setCurrentScreen('review');
  };

  const handleBackToMap = () => {
    setCurrentScreen('map');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setFeedback(null);
    setConversationHistory([]);
    setSelectedImage('');
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
              {selectedLanguage === 'zh' ? '这可能需要几秒钟时间' : 'This may take a few seconds'}
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