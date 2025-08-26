import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DialogueMode from './components/DialogueMode';
import ReviewPostcard from './components/ReviewPostcard';
import LoadingScreen from './components/LoadingScreen';
import WorldMapReview from './components/WorldMapReview';
import PostOffice from './components/PostOffice';
import Community from './components/Community';
import Ranking from './components/Ranking';
import { generateKimiFeedback } from './utils/kimiApi';
import { saveImageToIndexedDB } from './utils/api';
import html2canvas from 'html2canvas';

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
  const [isTransitioning, setIsTransitioning] = useState(false); // 添加过渡状态

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
    // 添加过渡效果
    setIsTransitioning(true);
    
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
    
    // 延迟设置当前屏幕以允许过渡动画完成
    setTimeout(() => {
      setCurrentScreen('dialogue');
      setIsTransitioning(false);
      
      if (currentImageId !== imageId) {
        setCurrentImageId(imageId);
      }
      
      if (currentLevel !== (level || 1)) {
        setCurrentLevel(level || 1);
      }
    }, 300);
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
      
      // Auto-save postcard to WorldMapReview
      await autoSavePostcard({
        imageId: selectedImage,
        level: selectedLevel,
        feedback: feedbackData,
        conversationHistory: conversation
      });
      
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
      
      // Auto-save postcard to WorldMapReview even when error occurs
      await autoSavePostcard({
        imageId: selectedImage,
        level: selectedLevel,
        feedback: templateFeedback,
        conversationHistory: conversation
      });
      
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
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('home');
      setConversationHistory([]);
      setSelectedImage('');
      setIsTransitioning(false);
    }, 300);
  };

  const handleSavePostcard = async (postcardData) => {
    // Generate a unique ID for this postcard if not already provided
    const postcardId = postcardData.id || `postcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract the blob from imageData if it's an object with blob and url properties
    let imageBlob = postcardData.imageData;
    
    try {
      // Check if imageData is an object with blob and url properties
      if (postcardData.imageData && typeof postcardData.imageData === 'object' && postcardData.imageData.blob) {
        imageBlob = postcardData.imageData.blob;
      } else if (postcardData.imageData instanceof Blob) {
        imageBlob = postcardData.imageData;
      }
      
      // Store the blob image in IndexedDB
      await saveImageToIndexedDB(postcardId, imageBlob);
      
      // Store only the essential metadata in localStorage (without image data)
      const simplifiedPostcard = {
        id: postcardId,
        timestamp: postcardData.timestamp || new Date().toISOString(),
        imageId: postcardData.imageId,
        level: postcardData.level,
        feedback: postcardData.feedback,
        postalCode: postcardData.postalCode
        // Do NOT store imageData in localStorage to save space
      };

      // Retrieve existing postcards
      let existingPostcards = [];
      try {
        existingPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
      } catch (parseError) {
        console.error('Error parsing existing postcards:', parseError);
        // If parsing fails, start with an empty array
        existingPostcards = [];
      }

      // Add the new postcard
      const updatedPostcards = [...existingPostcards, simplifiedPostcard];

      // Save back to localStorage
      localStorage.setItem('savedPostcards', JSON.stringify(updatedPostcards));
      
      // WorldMapReview will automatically refresh and pick up the new postcards
      // from localStorage via its refreshPostcards function
    } catch (error) {
      console.error('Error saving postcard:', error);
      // Implement fallback mechanism
      if (error.name === 'QuotaExceededError') {
        console.log('Storage quota exceeded. Clearing cache and trying again...');
        // Try to free up space by removing old postcards
        try {
          let existingPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
          // Keep only the most recent postcards (limit to 20)
          if (existingPostcards.length > 20) {
            const recentPostcards = existingPostcards.slice(-20);
            localStorage.setItem('savedPostcards', JSON.stringify(recentPostcards));
            
            // Create simplified postcard data for retry
            const simplifiedPostcard = {
              id: postcardId,
              timestamp: postcardData.timestamp || new Date().toISOString(),
              imageId: postcardData.imageId,
              level: postcardData.level,
              feedback: postcardData.feedback,
              postalCode: postcardData.postalCode
            };
            
            // Try saving again
            const updatedPostcards = [...recentPostcards, simplifiedPostcard];
            localStorage.setItem('savedPostcards', JSON.stringify(updatedPostcards));
          } else {
            // Create simplified postcard data for retry
            const simplifiedPostcard = {
              id: postcardId,
              timestamp: postcardData.timestamp || new Date().toISOString(),
              imageId: postcardData.imageId,
              level: postcardData.level,
              feedback: postcardData.feedback,
              postalCode: postcardData.postalCode
            };
            
            // If we still can't save, clear all postcards
            localStorage.setItem('savedPostcards', JSON.stringify([simplifiedPostcard]));
          }
        } catch (retryError) {
          console.error('Error during retry:', retryError);
          // Last resort: clear all saved postcards
          const simplifiedPostcard = {
            id: postcardId,
            timestamp: postcardData.timestamp || new Date().toISOString(),
            imageId: postcardData.imageId,
            level: postcardData.level,
            feedback: postcardData.feedback,
            postalCode: postcardData.postalCode
          };
          
          localStorage.setItem('savedPostcards', JSON.stringify([simplifiedPostcard]));
        }
      }
    }
  };

  const handleViewMap = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('map');
      window.location.hash = '#/map';
      setIsTransitioning(false);
    }, 300);
  };

  const handleViewPostOffice = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('postoffice');
      window.location.hash = '#/postoffice';
      setIsTransitioning(false);
    }, 300);
  };

  const handleViewCommunity = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('community');
      window.location.hash = '#/community';
      setIsTransitioning(false);
    }, 300);
  };

  const handleViewRanking = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('ranking');
      window.location.hash = '#/ranking';
      setIsTransitioning(false);
    }, 300);
  };

  const handleViewPostcard = (postcard) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedPostcard(postcard);
      setCurrentScreen('review');
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToMap = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('map');
      window.location.hash = '#/map';
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToHome = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen('home');
      setFeedback(null);
      setConversationHistory([]);
      setSelectedImage('');
      window.location.hash = '';
      setIsTransitioning(false);
    }, 300);
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

  // Auto-save postcard to WorldMapReview
  const autoSavePostcard = async (postcardData) => {
    try {
      // Create a temporary postcard element for screenshot
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '1200px';
      tempDiv.style.height = '800px';
      tempDiv.style.backgroundColor = '#F5F5F5';
      tempDiv.style.fontFamily = 'Inter, sans-serif';
      
      // Generate random postal code
      const generatePostalCode = () => {
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += Math.floor(Math.random() * 10);
        }
        return result;
      };
      
      const postalCode = generatePostalCode();
      
      // Select random stamp image
      const stampImages = [
        '/img_post/img_post_01.png',
        '/img_post/img_post_02.png',
        '/img_post/img_post_03.png',
        '/img_post/img_post_04.png',
        '/img_post/img_post_05.png',
        '/img_post/img_post_06.png',
        '/img_post/img_post_07.png',
        '/img_post/img_post_08.png',
        '/img_post/img_post_09.png',
        '/img_post/img_post_10.png',
        '/img_post/img_post_11.png',
        '/img_post/img_post_12.png',
        '/img_post/img_post_13.png',
        '/img_post/img_post_14.png',
        '/img_post/img_post_15.png',
        '/img_post/img_post_16.png',
        '/img_post/img_post_17.png',
        '/img_post/img_post_18.png',
        '/img_post/img_post_19.png',
        '/img_post/img_post_20.png'
      ];
      
      const randomStamp = stampImages[Math.floor(Math.random() * stampImages.length)];
      
      // Add postcard structure
      tempDiv.innerHTML = `
        <div style="width: 100%; height: 100%; position: relative; background-color: #F5F5F5;">
          <div style="position: absolute; top: 16px; left: 16px; display: flex; gap: 4px;">
            ${postalCode.split('').map(digit => `
              <div style="width: 32px; height: 32px; background: white; border: 2px solid black; display: flex; align-items: center; justify-content: center; font-family: 'Gloria Hallelujah', cursive; font-size: 24px;">${digit}</div>
            `).join('')}
          </div>
          
          <div style="position: absolute; top: 16px; right: 16px; width: 112px; height: 128px;">
            <img src="${randomStamp}" style="width: 100%; height: 100%; object-contain;" />
          </div>
          
          <div style="display: flex; height: 100%; padding-top: 64px;">
            <div style="width: 50%; height: 100%; border-right: 4px solid #ccc; padding: 0 16px; box-sizing: border-box;">
              <div style="width: 100%; height: 100%; overflow: hidden; border-radius: 8px;">
                <img src="/Level${postcardData.level}/${postcardData.imageId}.png" style="width: 100%; height: 100%; object-cover;" />
              </div>
            </div>
            
            <div style="width: 50%; padding: 0 16px; box-sizing: border-box; display: flex; flex-direction: column;">
              <div style="flex-grow: 1; overflow-y: auto; padding-top: 80px;">
                <div style="margin-bottom: 16px;">
                  <div style="font-family: 'Inter', sans-serif; font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${(selectedLanguage === 'zh' || selectedLanguage === 'es' || selectedLanguage === 'fr') ? '鼓励评价 ✅' : 'Encouraging Remarks ✅'}
                  </div>
                  <div style="font-family: 'Inter', sans-serif; font-size: 16px; white-space: pre-line; background-color: #f0fdf4; padding: 12px; border-radius: 8px;">
                    ${postcardData.feedback?.encouragingRemarks || (selectedLanguage === 'zh' ? '✅ 做得很好！继续努力！' : selectedLanguage === 'es' ? '✅ ¡Bien hecho! ¡Sigue esforzándote!' : selectedLanguage === 'fr' ? '✅ Bien joué ! Continue comme ça !' : '✅ Well done! Keep up the good work!')}
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <div style="font-family: 'Inter', sans-serif; font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${(selectedLanguage === 'zh' || selectedLanguage === 'es' || selectedLanguage === 'fr') ? '错误总结 ❗️' : 'Error Summary ❗️'}
                  </div>
                  <div style="font-family: 'Inter', sans-serif; font-size: 16px; white-space: pre-line; background-color: #fef3c7; padding: 12px; border-radius: 8px;">
                    ${postcardData.feedback?.errorSummary || (selectedLanguage === 'zh' ? '❗️ 没有发现明显错误' : selectedLanguage === 'es' ? '❗️ No se encontraron errores significativos' : selectedLanguage === 'fr' ? '❗️ Aucune erreur significative trouvée' : '❗️ No significant errors found')}
                  </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <div style="font-family: 'Inter', sans-serif; font-weight: 600; color: #374151; margin-bottom: 4px;">
                    ${(selectedLanguage === 'zh' || selectedLanguage === 'es' || selectedLanguage === 'fr') ? '改进建议 💡' : 'Suggestions 💡'}
                  </div>
                  <div style="font-family: 'Inter', sans-serif; font-size: 16px; white-space: pre-line; background-color: #dbeafe; padding: 12px; border-radius: 8px;">
                    ${postcardData.feedback?.suggestions || (selectedLanguage === 'zh' ? '💡 保持当前水平，继续练习！' : selectedLanguage === 'es' ? '💡 ¡Mantén tu nivel actual y sigue practicando!' : selectedLanguage === 'fr' ? '💡 Maintiens ton niveau actuel et continue à t\'entraîner !' : '💡 Maintain your current level and keep practicing!')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      // Use html2canvas to generate image
      const canvas = await html2canvas(tempDiv, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Convert canvas to Blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      // Save to IndexedDB
      const postcardId = `postcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await saveImageToIndexedDB(postcardId, blob);
      
      // Create simplified postcard data for localStorage
      const simplifiedPostcard = {
        id: postcardId,
        timestamp: new Date().toISOString(),
        imageId: postcardData.imageId,
        level: postcardData.level,
        feedback: postcardData.feedback
      };

      // Retrieve existing postcards
      let existingPostcards = [];
      try {
        existingPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
      } catch (parseError) {
        console.error('Error parsing existing postcards:', parseError);
        existingPostcards = [];
      }

      // Add the new postcard
      const updatedPostcards = [...existingPostcards, simplifiedPostcard];

      // Save back to localStorage
      localStorage.setItem('savedPostcards', JSON.stringify(updatedPostcards));
      
      console.log('Postcard auto-saved to WorldMapReview');
    } catch (error) {
      console.error('Error auto-saving postcard:', error);
    }
  };

  return (
    <div className="App">
      <div className={`transition-container ${isTransitioning ? 'transitioning' : ''}`}>
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
              onOpenPostOffice={handleViewCommunity}
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
            onOpenPostOffice={handleViewCommunity}
            selectedLanguage={selectedLanguage}
          />
        )}

        {currentScreen === 'postoffice' && (
          <PostOffice 
            onBack={handleViewCommunity}
            onViewPostcard={handleViewPostcard}
          />
        )}
        
        {currentScreen === 'community' && (
          <Community 
            onBack={handleBackToHome}
            onNavigateToPostOffice={handleViewPostOffice}
            onNavigateToRanking={handleViewRanking}
            selectedLanguage={selectedLanguage}
          />
        )}
        
        {currentScreen === 'ranking' && (
          <Ranking 
            onBack={handleViewCommunity}
            selectedLanguage={selectedLanguage}
          />
        )}
        
        {currentScreen === 'postoffice' && (
          <PostOffice 
            onBack={handleViewCommunity}
            onViewPostcard={handleViewPostcard}
            selectedLanguage={selectedLanguage}
          />
        )}
      </div>
      
      <style jsx>{`
        .transition-container {
          transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
        }
        
        .transition-container.transitioning {
          opacity: 0;
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default App;