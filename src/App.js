import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DialogueMode from './components/DialogueMode';
import ReviewPostcard from './components/ReviewPostcard';
import LoadingScreen from './components/LoadingScreen';
import WorldMapReview from './components/WorldMapReview';
import PostOffice from './components/PostOffice';
import { generateKimiFeedback } from './utils/kimiApi';
import { saveImageToIndexedDB } from './utils/api';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'dialogue', 'review', 'loading', 'map', 'postoffice'
  const [selectedImage, setSelectedImage] = useState('img_01');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [currentImageId, setCurrentImageId] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    const savedLevel = localStorage.getItem('selectedLevel');
    const savedImage = localStorage.getItem('selectedImage');
    
    if (savedLanguage) setSelectedLanguage(savedLanguage);
    if (savedLevel) setSelectedLevel(parseInt(savedLevel));
    if (savedImage) setSelectedImage(savedImage);
    
    // Parse URL hash to determine initial screen
    const hash = window.location.hash;
    if (hash.startsWith('#/dialogue/')) {
      const parts = hash.substring(11).split('/');
      const imageId = parts[0];
      const language = parts[1] || 'en';
      const level = parseInt(parts[2]) || 1;
      
      // 只有当状态不匹配时才更新状态
      if (selectedLanguage !== language || selectedLevel !== level || currentImageId !== imageId) {
        setSelectedLanguage(language);
        setSelectedLevel(level);
        setCurrentImageId(imageId);
        setCurrentLevel(level);
        setCurrentScreen('dialogue');
      }
    } else if (hash === '#/map') {
      setCurrentScreen('map');
    } else if (hash === '#/postoffice') {
      setCurrentScreen('postoffice');
    } else {
      // Default to home screen if no hash or unrecognized hash
      setCurrentScreen('home');
      // Clear hash to ensure we start fresh
      window.location.hash = '';
    }
  }, []);

  const handleStartDialogue = (imageId, language, level) => {
    // Save selections to localStorage
    if (imageId) {
      setSelectedImage(imageId);
      localStorage.setItem('selectedImage', imageId);
    }
    
    if (language) {
      setSelectedLanguage(language);
      localStorage.setItem('selectedLanguage', language);
    }
    
    if (level) {
      setSelectedLevel(level);
      localStorage.setItem('selectedLevel', level || 1);
    }
    
    // Update URL hash with imageId, language, and level
    window.location.hash = `#/dialogue/${imageId}/${language || 'en'}/${level || 1}`;
    
    setCurrentScreen('dialogue');
    
    if (currentImageId !== imageId) {
      setCurrentImageId(imageId);
    }
    
    if (currentLevel !== (level || 1)) {
      setCurrentLevel(level || 1);
    }
  };

  // Handle finishing a dialogue
  const handleFinishDialogue = async (conversation) => {
    console.log('Finishing dialogue with conversation:', conversation);
    setCurrentScreen('loading');
    setError('');
    
    try {
      // Load image description
      const response = await fetch(`/Level${selectedLevel}/descriptions.json`);
      const descriptions = await response.json();
      const imageDescription = descriptions[selectedImage] || 'No description available';
      
      // Generate feedback using Kimi API
      const feedbackData = await generateKimiFeedback(conversation, imageDescription, selectedLanguage);
      
      setFeedback({
        ...feedbackData,
        imageId: selectedImage,
        level: selectedLevel,
        conversationHistory: conversation
      });
      setCurrentScreen('review');
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError('Failed to load description or generate feedback');
      // 即使出错也跳转到review页面，使用标准反馈模板
      const templateFeedback = getFallbackFeedback(selectedLanguage);
      setFeedback({
        ...templateFeedback,
        imageId: selectedImage,
        level: selectedLevel,
        conversationHistory: conversation
      });
      setCurrentScreen('review');
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

  const handleSavePostcard = async (postcardData) => {
    try {
      // Generate a unique ID for this postcard
      const postcardId = `postcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the blob image in IndexedDB
      await saveImageToIndexedDB(postcardId, postcardData.imageData);
      
      // Store only the essential metadata in localStorage
      const simplifiedPostcard = {
        id: postcardId,
        timestamp: new Date().toISOString(),
        description: postcardData.description,
        // Add other necessary metadata
      };

      // Retrieve existing postcards
      const existingPostcards = JSON.parse(localStorage.getItem('savedPostcards')) || [];

      // Add the new postcard
      existingPostcards.push(simplifiedPostcard);

      // Save back to localStorage
      localStorage.setItem('savedPostcards', JSON.stringify(existingPostcards));
    } catch (error) {
      console.error('Error saving postcard:', error);
      // Implement fallback mechanism
      if (error.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded. Clearing cache and trying again...');
        clearCache();
        // Optionally, you could implement a server-side fallback here
      }
    }
  };

  const handleViewMap = () => {
    setCurrentScreen('map');
    window.location.hash = '#/map';
  };

  const handleViewPostOffice = () => {
    setCurrentScreen('postoffice');
    window.location.hash = '#/postoffice';
  };

  const handleViewPostcard = (postcard) => {
    setSelectedPostcard(postcard);
    setCurrentScreen('review');
  };

  const handleBackToMap = () => {
    setCurrentScreen('map');
    window.location.hash = '#/map';
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setFeedback(null);
    setConversationHistory([]);
    setSelectedImage('');
    window.location.hash = '';
  };

  // Handle next picture button click
  const handleNextPicture = (currentLevel) => {
    // 确保currentLevel是数字类型
    const level = Number(currentLevel);
    
    // 获取对应关卡的图片列表
    const images = getImagesForLevel(level);
    
    // 找到当前图片的索引
    const currentIndex = images.findIndex(img => img.id === (currentImageId || selectedImage));
    
    // 计算下一个图片的索引（循环）
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImageId = images[nextIndex].id;
    
    // 更新状态
    setSelectedImage(nextImageId);
    setCurrentImageId(nextImageId);
    
    // 保存到localStorage
    localStorage.setItem('selectedImage', nextImageId);
    
    // 更新URL hash
    window.location.hash = `#/dialogue/${nextImageId}/${selectedLanguage}/${level}`;
    
    // 重置对话状态
    setConversationHistory([]);
    setFeedback(null);
    setCurrentScreen('dialogue');
  };

  // 获取指定关卡的图片列表
  const getImagesForLevel = (level) => {
    // 根据实际的图片文件来动态生成
    switch(level) {
      case 1:
      case 2:
      case 3:
        // 对于关卡1、2、3，使用实际存在的图片
        return [
          { id: 'img_01', name: 'Image 1' },
          { id: 'img_02', name: 'Image 2' },
          { id: 'img_03', name: 'Image 3' },
          { id: 'img_04', name: 'Image 4' },
          { id: 'img_05', name: 'Image 5' }
        ];
      default:
        // 默认情况下，使用关卡1的图片
        return [
          { id: 'img_01', name: 'Image 1' },
          { id: 'img_02', name: 'Image 2' },
          { id: 'img_03', name: 'Image 3' },
          { id: 'img_04', name: 'Image 4' },
          { id: 'img_05', name: 'Image 5' }
        ];
    }
  };

  const refreshMapData = () => {
    // 模拟刷新数据，例如从localStorage重新加载或调用API
    console.log('Refreshing map data...');
    // 实际刷新逻辑，比如重新获取数据
    // const updatedPostcards = fetchUpdatedPostcards();
    // setMapPostcards(updatedPostcards);
  };

  const clearCache = () => {
    localStorage.clear();
    console.log('Cache cleared');
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
            selectedLanguage={selectedLanguage}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <ReviewPostcard
            imageId={currentImageId || selectedImage}
            conversationHistory={feedback?.conversationHistory || []}
            feedback={feedback}
            onSave={handleSavePostcard}
            onBack={handleBackToHome}
            onNextPicture={handleNextPicture}
            level={currentLevel || selectedLevel}
            selectedLanguage={selectedLanguage}
            isLoading={isLoading}
            error={error}
            onOpenPostOffice={handleViewPostOffice}
          />
        )
      )}

      {currentScreen === 'loading' && (
        <LoadingScreen />
      )}

      {currentScreen === 'map' && (
        <WorldMapReview 
          onViewPostcard={handleViewPostcard}
          onBack={handleBackToHome}
          refreshData={refreshMapData}
          onOpenPostOffice={handleViewPostOffice}
        />
      )}

      {currentScreen === 'postoffice' && (
        <PostOffice 
          onBack={handleBackToHome}
          onViewPostcard={handleViewPostcard}
        />
      )}
    </div>
  );
}

export default App;