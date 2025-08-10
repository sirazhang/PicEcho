import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DialogueMode from './components/DialogueMode';
import ReviewPostcard from './components/ReviewPostcard';
import { testKimiApi } from './testKimiApi';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // home, dialogue, review
  const [selectedImage, setSelectedImage] = useState(null);
  const [conversation, setConversation] = useState([]);

  // Run Kimi API test when app starts
  useEffect(() => {
    testKimiApi();
  }, []);

  const startDialogue = (imageId) => {
    setSelectedImage(imageId);
    setCurrentScreen('dialogue');
  };

  const finishDialogue = (conversationData) => {
    setConversation(conversationData);
    setCurrentScreen('review');
  };

  const practiceAnotherImage = () => {
    // Reset state and go back to home screen
    setSelectedImage(null);
    setConversation([]);
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentScreen === 'home' && (
        <HomeScreen onStartDialogue={startDialogue} />
      )}
      
      {currentScreen === 'dialogue' && (
        <DialogueMode 
          imageId={selectedImage} 
          onFinish={finishDialogue}
          onCancel={practiceAnotherImage}
        />
      )}
      
      {currentScreen === 'review' && (
        <ReviewPostcard 
          imageId={selectedImage} 
          conversation={conversation}
          onPracticeAnother={practiceAnotherImage}
        />
      )}
    </div>
  );
}

export default App;