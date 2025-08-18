import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DialogueMode from './components/DialogueMode';
import ReviewPostcard from './components/ReviewPostcard';
import WorldMapReview from './components/WorldMapReview';
import { generateKimiFeedback } from './utils/kimiApi';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'dialogue', 'review', 'loading'
  const [selectedImage, setSelectedImage] = useState('img_01');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [currentImageId, setCurrentImageId] = useState('img_01');
  const [currentLevel, setCurrentLevel] = useState(1);

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

  const handleNextPicture = (level) => {
    // 根据 level 来确定有多少张图
    let maxCount = level === 1 ? 16 : level === 2 ? 16 : 6;

    let nextId = currentImageId;
    while (nextId === currentImageId && maxCount > 1) {
      const rand = Math.floor(Math.random() * maxCount) + 1;
      nextId = `img_${String(rand).padStart(2, "0")}`;
    }

    setCurrentImageId(nextId);
    setCurrentLevel(level);
    setSelectedImage(nextId);
    setSelectedLevel(level);
    setCurrentScreen('dialogue');
  };

  const handleStartDialogue = (imageId, language, level) => {
    setSelectedImage(imageId);
    setSelectedLanguage(language || 'en'); // Set language when starting dialogue
    setSelectedLevel(level || 1); // Set level when starting dialogue
    
    // Save level to localStorage
    localStorage.setItem('selectedLevel', level || 1);
    
    // Update URL hash with imageId, language, and level
    window.location.hash = `#/dialogue/${imageId}/${language || 'en'}/${level || 1}`;
    
    setCurrentScreen('dialogue');
    setCurrentImageId(imageId);
    setCurrentLevel(level || 1);
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
      
      setFeedback({
        ...feedbackData,
        imageId: selectedImage,
        level: selectedLevel,
        conversationHistory: conversation
      });
      setIsLoading(false);
      setCurrentScreen('review');
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError('Failed to load description or generate feedback');
      setIsLoading(false);
      // 即使出错也跳转到review页面，使用标准反馈模板
      const templateFeedback = getFallbackFeedback(selectedLanguage);
      setFeedback({
        ...templateFeedback,
        imageId: selectedImage,
        level: selectedLevel,
        conversationHistory: conversation
      });
      setCurrentScreen('review');
    } finally {
      // 确保加载状态被清除
      setIsLoading(false);
    }
  };

  // 获取备用反馈内容
  const getFallbackFeedback = (language) => {
    if (language === 'zh') {
      return {
        encouragingRemarks: "✅ 很棒的努力！🌟\n你的中文表达清晰而自然 👍，语气也很自信！继续保持，你的进步很明显！🚀",
        errorSummary: "❗ 小修正\n* ❌ \"小狗在跑步步。\" → ✅ \"小狗在跑。\"\n* ❌ \"他们在吃苹果子。\" → ✅ \"他们在吃苹果。\"",
        suggestions: "💡 可以试着这样说\n在看图说话时，可以尝试用更完整的句子，比如：\n* \"小狗正在公园里跑来跑去。\"\n* \"他们一家人坐在桌子旁边，一起吃苹果。\""
      };
    } else {
      return {
        encouragingRemarks: "✅ Excellent Effort! 🌟\n* Your speaking was clear and confident👍, which is really impressive! Keep it up, you're improving fast. 🚀",
        errorSummary: "❗️ Small Fixes\n❌ \"I no know this word.\" → ✅ \"I don't know this word.\"\n❌ \"She is more higher than me.\" → ✅ \"She is higher than me.\"",
        suggestions: "💡 Try These Improvements\nInstead of \"I don't know this word\", you can say:\n* \"I'm not familiar with this word.\"\n* \"I haven't heard this word before.\""
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
          imageId={currentImageId || selectedImage}
          language={selectedLanguage}
          level={currentLevel || selectedLevel}
          onConversationComplete={handleFinishDialogue}
          onCancel={handleCancelDialogue}
        />
      )}

      {currentScreen === 'review' && (
        selectedPostcard ? (
          <ReviewPostcard
            imageId={selectedPostcard.imageId}
            conversationHistory={selectedPostcard.conversationHistory}
            feedback={selectedPostcard.feedback}
            onSave={handleSavePostcard}
            onBack={handleBackToMap}
            onNextPicture={handleNextPicture}
            level={selectedPostcard.level}
            isLoading={false}
            error={null}
            selectedLanguage={selectedLanguage}
          />
        ) : (
          <ReviewPostcard
            imageId={selectedImage}
            conversationHistory={conversationHistory}
            feedback={feedback}
            onSave={handleSavePostcard}
            onBack={handleBackToHome}
            onNextPicture={handleNextPicture}
            level={selectedLevel}
            isLoading={false}
            error={error}
            selectedLanguage={selectedLanguage}
          />
        )
      )}

      {currentScreen === 'loading' && (
        <ReviewPostcard
          imageId={selectedImage}
          conversationHistory={conversationHistory}
          feedback={feedback}
          onSave={handleSavePostcard}
          onBack={handleBackToHome}
          onNextPicture={handleNextPicture}
          level={selectedLevel}
          isLoading={true}
          error={error}
          selectedLanguage={selectedLanguage}
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