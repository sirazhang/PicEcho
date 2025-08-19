import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { sendPostcard } from '../utils/api';

// 工具函数：生成图片路径
const getImagePath = (propsLevel, imageId) => {
  return `/Level${propsLevel}/${imageId}.png`;
};

const ReviewPostcard = ({ feedback, onNextPicture, level, imageId, onClose, selectedLanguage, conversationHistory, onSave, onBack, isLoading, error }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [postalCode, setPostalCode] = useState('');
  const [stampImage, setStampImage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const postcardRef = useRef(null);

  // Generate random postal code
  useEffect(() => {
    const generatePostalCode = () => {
      // Generate 6 random digits for postal code
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += Math.floor(Math.random() * 10);
      }
      return result;
    };
    
    setPostalCode(generatePostalCode());
  }, [imageId]);

  // Select random stamp image
  useEffect(() => {
    const stampImages = [
      '/img_post/img_post_01.png',
      '/img_post/img_post_02.png',
      '/img_post/img_post_03.png',
      '/img_post/img_post_04.png',
      '/img_post/img_post_05.png',
      '/img_post/img_post_06.png'
    ];
    
    const randomIndex = Math.floor(Math.random() * stampImages.length);
    setStampImage(stampImages[randomIndex]);
  }, [imageId]);

  // Handle save postcard button click
  const handleSavePostcard = async () => {
    try {
      setIsSaving(true); // 设置保存状态
      setSaveMessage('');
      
      // Generate the postcard image as a Blob
      const imageBlob = await generatePostcardImage();
      
      // Create postcard data
      const postcardData = {
        imageId: imageId,
        level: level,
        feedback: localFeedback,
        imageData: imageBlob,
        timestamp: new Date().toISOString(),
        postalCode: postalCode
      };

      // Save to backend
      const savedPostcard = await sendPostcard({
        ...postcardData,
        senderToken: localStorage.getItem('senderToken') || 'user_' + Math.random().toString(36).substr(2, 9)
      });
      
      // Update postcard data with backend response
      const postcardDataWithId = {
        ...postcardData,
        serverId: savedPostcard.id,
        timestamp: savedPostcard.timestamp
      };
      
      // Call onSave callback with complete data
      onSave(postcardDataWithId);
      
      // Update state
      setIsSaved(true);
      setSaveMessage(selectedLanguage === 'zh' ? '明信片已保存！' : 'Postcard saved!');
      
      // Reset message after 2 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error saving postcard:', err);
      setSaveMessage(selectedLanguage === 'zh' ? '保存失败，请重试' : 'Failed to save, please try again');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle send postcard button click
  const handleSendPostcard = async () => {
    try {
      setSaveMessage(''); // Clear any previous messages
      
      // Generate the postcard image as a Blob
      const imageBlob = await generatePostcardImage();
      
      // Set preview image and show preview modal
      setPreviewImage(imageBlob);
      setShowPreview(true);
    } catch (err) {
      console.error('Error generating postcard for sending:', err);
      setSaveMessage(selectedLanguage === 'zh' ? '发送失败，请重试' : 'Failed to send postcard');
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    }
  };

  // Generate postcard image using html2canvas
  const generatePostcardImage = async () => {
    try {
      if (!postcardRef.current) {
        throw new Error('Postcard reference is not available');
      }
      
      const canvas = await html2canvas(postcardRef.current, {
        scale: 2, // Higher quality
        useCORS: true, // Enable cross-origin resource sharing
        logging: false, // Disable logging
        backgroundColor: '#ffffff' // Ensure white background
      });
      
      // Convert canvas to Blob instead of data URL
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
      
      return blob;
    } catch (error) {
      console.error('Error generating postcard image with html2canvas:', error);
      throw error; // Re-throw to be handled by caller
    }
  };

  // Handle next picture button click
  const handleNextPicture = () => {
    if (onNextPicture) {
      onNextPicture(level);
    }
  };

  // Memoized text content based on selectedLanguage, isSaved, and isSaving
  const textContent = React.useMemo(() => {
    if (selectedLanguage === 'zh') {
      return {
        home: '主页',
        save: isSaved ? '已保存' : (isSaving ? '保存中...' : '保存明信片'),
        saved: '已保存',
        saving: '保存中...',
        send: '发送明信片',
        nextPicture: '下一张图片',
        encouragingRemarks: '鼓励评价 ✅',
        errorSummary: '错误总结 ❗️',
        suggestions: '改进建议 💡'
      };
    } else {
      return {
        home: 'Home',
        save: isSaved ? 'Saved' : (isSaving ? 'Saving...' : 'Save Postcard'),
        saved: 'Saved',
        saving: 'Saving...',
        send: 'Send Postcard',
        nextPicture: 'Next Picture',
        encouragingRemarks: 'Encouraging Remarks ✅',
        errorSummary: 'Error Summary ❗️',
        suggestions: 'Suggestions 💡'
      };
    }
  }, [selectedLanguage, isSaved, isSaving]);

  // 预加载图片并验证是否存在
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState('');

  useEffect(() => {
    if (!imageId || !level) return;
    
    const loadImage = async () => {
      setImageLoading(true);
      setImageError(false);
      const imageSrc = getImagePath(level, imageId);
      setCurrentImageSrc(imageSrc); // 确保设置currentImageSrc
      
      try {
        // 创建图片加载的辅助函数
        const loadImageWithFallback = (src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            
            // 设置超时防止永久挂起
            const timeoutId = setTimeout(() => {
              reject(new Error('Image load timeout'));
            }, 5000);
            
            img.onload = () => {
              clearTimeout(timeoutId);
              resolve(src);
            };
            
            img.onerror = () => {
              clearTimeout(timeoutId);
              reject(new Error('Image load error'));
            };
          });
        };
        
        // 尝试加载当前级别的图片
        try {
          await loadImageWithFallback(imageSrc);
          console.log(`Successfully loaded image: ${imageSrc}`);
          setImageLoading(false);
          setImageError(false);
        } catch (error) {
          console.log(`Failed to load image: ${imageSrc}`, error);
          // 如果当前级别的图片加载失败，尝试加载级别1的图片作为后备
          const fallbackSrc = getImagePath(1, imageId);
          try {
            await loadImageWithFallback(fallbackSrc);
            console.log(`Successfully loaded fallback image: ${fallbackSrc}`);
            setCurrentImageSrc(fallbackSrc);
            setImageLoading(false);
            setImageError(false);
          } catch (fallbackError) {
            console.log(`Failed to load fallback image: ${fallbackSrc}`, fallbackError);
            setImageLoading(false);
            setImageError(true);
          }
        }
      } catch (error) {
        console.error('Error in image loading process:', error);
        setImageLoading(false);
        setImageError(true);
      }
    };

    loadImage();
  }, [imageId, level]);

  return (
    <div className="min-h-screen bg-[#e5f5fb] p-0">
      {/* Header with action buttons */}
      <div className="flex justify-center items-center p-6 gap-4">
        <button 
          onClick={() => {
            // Clear URL hash to go back to home screen
            window.location.hash = '';
            onBack();
          }}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center justify-center"
          style={{ 
            backgroundColor: '#003153',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {textContent.home}
        </button>
        
        <button
          onClick={handleSavePostcard}
          disabled={isSaving}
          className={`px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center justify-center ${
            isSaved ? 'bg-green-500' : 'bg-[#66ab4b]'
          }`}
          style={{ 
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {textContent.saving}
            </>
          ) : isSaved ? (
            <>
              <span className="mr-2">✓</span> {textContent.saved}
            </>
          ) : (
            textContent.save
          )}
        </button>
        
        <button
          onClick={handleSendPostcard}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center justify-center"
          style={{ 
            backgroundColor: '#ff9800',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {textContent.send}
        </button>
        
        <button
          onClick={handleNextPicture}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center justify-center"
          style={{ 
            backgroundColor: '#3fbdc7',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {textContent.nextPicture}
        </button>
      </div>

      {/* Postcard Container */}
      <div className="flex justify-center px-6 pb-6" style={{ minHeight: '75vh' }}>
        <div 
          ref={postcardRef}
          className="w-full max-w-6xl bg-white rounded-3xl shadow-4xl p-0 relative"
          style={{ height: '75vh', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
        >
          {/* Postal Code - each digit in separate box */}
          <div className="absolute top-4 left-4 flex gap-1 z-10">
            {postalCode.split('').map((digit, index) => (
              <div key={index} className="bg-white border-2 border-black w-8 h-8 flex items-center justify-center font-gloria-hallelujah text-2xl">
                {digit}
              </div>
            ))}
          </div>

          {/* Stamp */}
          <div className="absolute top-4 right-4 w-28 h-32 flex items-start">
            <img 
              src={stampImage} 
              alt="Stamp" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Main Content - Flex row layout */}
          <div className="flex h-full pt-16">
            {/* Image Section - 1/2 width */}
            <div className="w-1/2 flex flex-col border-r-4 border-gray-300 pr-4 pl-4">
              <div className="flex-grow h-full w-full overflow-hidden rounded-lg">
                {imageLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-2"></div>
                    <span className="text-gray-700">{selectedLanguage === 'zh' ? '加载图片中...' : 'Loading image...'}</span>
                  </div>
                ) : imageError ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <p className="text-red-500 mb-2">{selectedLanguage === 'zh' ? '图片未找到' : 'Image not found'}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {selectedLanguage === 'zh' ? '重试' : 'Retry'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={currentImageSrc} 
                    alt={selectedLanguage === 'zh' ? '对话图片' : 'Conversation image'} 
                    className="h-full w-full object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Feedback Section - 1/2 width */}
            <div className="w-1/2 flex flex-col pl-4 pr-4 mt-20">
              <div className="flex-grow overflow-y-auto pr-2" style={{ maxHeight: 'calc(65vh - 120px)' }}>
                {/* Encouraging Remarks */}
                <div className="mb-4">
                  <div className="font-inter font-semibold text-gray-700 mb-1">
                    {textContent.encouragingRemarks}
                  </div>
                  <div className="font-inter text-base whitespace-pre-line bg-[#f0fdf4] p-3 rounded-lg">
                    {localFeedback?.encouragingRemarks || (selectedLanguage === 'zh' ? '✅ 做得很好！继续努力！' : '✅ Well done! Keep up the good work!')}
                  </div>
                </div>
                
                {/* Error Summary */}
                <div className="mb-4">
                  <div className="font-inter font-semibold text-gray-700 mb-1">
                    {textContent.errorSummary}
                  </div>
                  <div className="font-inter text-base whitespace-pre-line bg-[#fef3c7] p-3 rounded-lg">
                    {localFeedback?.errorSummary || (selectedLanguage === 'zh' ? '❗️ 没有发现明显错误' : '❗️ No significant errors found')}
                  </div>
                </div>
                
                {/* Suggestions */}
                <div className="mb-4">
                  <div className="font-inter font-semibold text-gray-700 mb-1">
                    {textContent.suggestions}
                  </div>
                  <div className="font-inter text-base whitespace-pre-line bg-[#dbeafe] p-3 rounded-lg">
                    {localFeedback?.suggestions || (selectedLanguage === 'zh' ? '💡 保持当前水平，继续练习！' : '💡 Maintain your current level and keep practicing!')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedLanguage === 'zh' ? '预览明信片' : 'Preview Postcard'}
                </h3>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                {previewImage && (
                  <img 
                    src={URL.createObjectURL(previewImage)} 
                    alt="Postcard preview" 
                    className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                    onLoad={(e) => {
                      // Revoke the object URL after the image has loaded to free memory
                      URL.revokeObjectURL(e.target.src);
                    }}
                  />
                )}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium"
                  >
                    {selectedLanguage === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    onClick={async () => {
                      // 实际发送明信片的逻辑
                      try {
                        // 从localStorage获取发送者token，如果没有则生成一个
                        let senderToken = localStorage.getItem('senderToken');
                        if (!senderToken) {
                          senderToken = 'user_' + Math.random().toString(36).substr(2, 9);
                          localStorage.setItem('senderToken', senderToken);
                        }
                        
                        // 准备明信片数据
                        const postcardData = {
                          imageData: previewImage,
                          senderToken: senderToken,
                          feedback: localFeedback,
                          postalCode: postalCode
                        };
                        
                        // 发送明信片
                        await sendPostcard(postcardData);
                        
                        // 关闭预览窗口
                        setShowPreview(false);
                        
                        // 显示发送成功消息
                        setSaveMessage(selectedLanguage === 'zh' ? '明信片已发送！' : 'Postcard sent!');
                        setTimeout(() => {
                          setSaveMessage('');
                        }, 2000);
                      } catch (error) {
                        console.error('Error sending postcard:', error);
                        setSaveMessage(selectedLanguage === 'zh' ? '发送失败，请重试' : 'Failed to send, please try again');
                        setTimeout(() => {
                          setSaveMessage('');
                        }, 2000);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium"
                  >
                    {selectedLanguage === 'zh' ? '发送' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {saveMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          {saveMessage}
        </div>
      )}
    </div>
  );
};

export default ReviewPostcard;
