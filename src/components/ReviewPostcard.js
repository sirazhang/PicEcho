import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { sendPostcard, getImageFromIndexedDB, saveImageToIndexedDB } from '../utils/api';

// Helper function to manage localStorage with quota protection
const saveToLocalStorage = async (key, data) => {
  try {
    // Convert data to JSON
    const jsonData = JSON.stringify(data);
    
    // Get current storage usage
    const usedSize = new Blob([jsonData]).size;
    const quota = navigator.storage?.estimate ? 
      (await navigator.storage.estimate()).quota : 
      5 * 1024 * 1024; // Fallback to 5MB
    
    // Check if we're under the quota (leave 10% buffer)
    if (usedSize < quota * 0.9) {
      localStorage.setItem(key, jsonData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

// 工具函数：生成图片路径
const getImagePath = (propsLevel, imageId) => {
  return `/Level${propsLevel}/${imageId}.png`;
};

const ReviewPostcard = ({ feedback, onNextPicture, level, imageId, onClose, selectedLanguage, conversationHistory, onSave, onBack, isLoading, error, onOpenPostOffice }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [postalCode, setPostalCode] = useState('');
  const [stampImage, setStampImage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [indexedDBImage, setIndexedDBImage] = useState(null); // For IndexedDB images
  const [showModal, setShowModal] = useState(false); // For showing the saved postcard modal
  const [selectedPostcard, setSelectedPostcard] = useState(null); // For the selected postcard in the modal
  const [showSuccess, setShowSuccess] = useState(false); // For showing success message
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
    
    const randomIndex = Math.floor(Math.random() * stampImages.length);
    setStampImage(stampImages[randomIndex]);
  }, [imageId]);

  // Load image from IndexedDB when selectedPostcard changes
  useEffect(() => {
    const loadImageFromIndexedDB = async () => {
      if (showModal && selectedPostcard && selectedPostcard.id && !selectedPostcard.imageData) {
        try {
          const imageBlob = await getImageFromIndexedDB(selectedPostcard.id);
          if (imageBlob) {
            setIndexedDBImage(URL.createObjectURL(imageBlob));
          }
        } catch (error) {
          console.error('Error loading image from IndexedDB:', error);
        }
      } else {
        // Clear the image when modal is closed or postcard changes
        if (indexedDBImage) {
          URL.revokeObjectURL(indexedDBImage);
          setIndexedDBImage(null);
        }
      }
    };

    loadImageFromIndexedDB();

    // Cleanup function to revoke object URL
    return () => {
      if (indexedDBImage) {
        URL.revokeObjectURL(indexedDBImage);
      }
    };
  }, [showModal, selectedPostcard, indexedDBImage]);

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
        imageData: imageBlob, // Pass the Blob directly
        timestamp: new Date().toISOString(),
        postalCode: postalCode
      };
      
      // Save to IndexedDB
      const postcardId = `postcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await saveImageToIndexedDB(postcardId, imageBlob);
      
      // Convert Blob to data URL for localStorage
      const imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(imageBlob);
      });
      
      // Update postcard data with backend response and data URL for localStorage
      const postcardDataWithId = {
        ...postcardData,
        id: postcardId, // Add the IndexedDB ID
        // Store both Blob and data URL to facilitate different use cases
        imageData: {
          blob: imageBlob,      // Original Blob for direct display
          url: imageDataUrl     // Data URL for localStorage and sharing
        },
        timestamp: new Date().toISOString(),
        postalCode: postalCode,
        level: level,
        imageId: imageId
      };
      
      // Call onSave callback with complete data
      onSave(postcardDataWithId); 
      // The postcard data now contains both Blob and data URL, 
      // making it flexible for different display scenarios in WorldMapReview
      
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
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle print postcard button click
  const handlePrintPostcard = async () => {
    try {
      setIsSaving(true);
      setSaveMessage('');
      
      // Generate the postcard image as a Blob
      const imageBlob = await generatePostcardImage();
      
      // Create a temporary URL for the blob
      const imageUrl = URL.createObjectURL(imageBlob);
      
      // Create a temporary image element for printing
      const img = new Image();
      img.src = imageUrl;
      
      img.onload = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Postcard</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #f0f0f0;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  box-shadow: 0 0 20px rgba(0,0,0,0.3);
                }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Clean up the object URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(imageUrl);
        }, 5000);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setSaveMessage(selectedLanguage === 'zh' ? '打印失败，请重试' : 'Failed to print, please try again');
        setTimeout(() => {
          setSaveMessage('');
        }, 2000);
      };
    } catch (err) {
      console.error('Error printing postcard:', err);
      setSaveMessage(selectedLanguage === 'zh' ? '打印失败，请重试' : 'Failed to print, please try again');
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle next picture button click
  const handleNextPicture = () => {
    if (onNextPicture) {
      onNextPicture(level);
    }
  };

  // Close modal function
  const closeModal = () => {
    setShowModal(false);
    setSelectedPostcard(null);
  };
  
  // Handle opening the community
  const handleOpenCommunity = () => {
    if (onOpenPostOffice) {
      onOpenPostOffice(); // Reuse the same callback for now, will be updated in App.js
    }
  };

  // Define text content for different languages
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        send: '发送明信片',
        sendPreviewConfirm: '这是您要发送的明信片，确认发送吗？',
        step3: '点击发送按钮将明信片发送给其他学习者',
        postOfficeButton: '邮局',
        successMessage: '操作成功！'
      };
    } else {
      return {
        send: 'Send Postcard',
        sendPreviewConfirm: 'This is the postcard you want to send. Confirm sending?',
        step3: 'Click the send button to send the postcard to another learner',
        postOfficeButton: 'Post Office',
        successMessage: 'Operation successful!'
      };
    }
  };

  // 新的处理发送明信片函数
  const handleSendPostcard = async () => {
    try {
      // 获取文本内容
      const textContent = getTextContent();
      
      // 创建一个canvas元素来渲染明信片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置canvas尺寸，匹配ReviewPostcard界面比例
      canvas.width = 1200;
      canvas.height = 800;
      
      // 绘制背景
      const backgroundColor = '#F5F5F5';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 生成明信片图像
      const imageBlob = await generatePostcardImage();
      
      // 将Blob转换为URL
      const imageUrl = URL.createObjectURL(imageBlob);
      
      // 准备发送数据
      const postcardData = {
        imageData: imageBlob,
        senderToken: localStorage.getItem('senderToken') || 'user_' + Math.random().toString(36).substr(2, 9),
        feedback: localFeedback,
        postalCode: postalCode
      };
      
      // 发送明信片
      const savedPostcard = await sendPostcard(postcardData);
      
      // 释放对象URL
      URL.revokeObjectURL(imageUrl);
      
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
  
  // Helper function to load images with fallback and timeout
  const loadImageWithFallback = async (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      
      // Set timeout to prevent hanging indefinitely
      const timeoutId = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(src);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Image load error: ${src}`));
      };
    });
  };

  useEffect(() => {
    if (!imageId || !level) return;
    
    let isMounted = true; // Track mounted state
    const loadImage = async () => {
      try {
        setImageLoading(true);
        if (!isMounted) return;
        
        const imageSrc = getImagePath(level, imageId);
        setCurrentImageSrc(imageSrc);
        
        try {
          await loadImageWithFallback(imageSrc);
          if (!isMounted) return;
          
          console.log(`Successfully loaded image: ${imageSrc}`);
          setImageLoading(false);
          setImageError(false);
        } catch (error) {
          console.log(`Failed to load image: ${imageSrc}`, error);
          // Try fallback to level 1 image
          const fallbackSrc = getImagePath(1, imageId);
          try {
            await loadImageWithFallback(fallbackSrc);
            if (!isMounted) return;
            
            console.log(`Successfully loaded fallback image: ${fallbackSrc}`);
            setCurrentImageSrc(fallbackSrc);
            setImageLoading(false);
            setImageError(false);
          } catch (fallbackError) {
            console.log(`Failed to load fallback image: ${fallbackSrc}`, fallbackError);
            if (!isMounted) return;
            
            setImageLoading(false);
            setImageError(true);
          }
        }
      } catch (error) {
        console.error('Error in image loading process:', error);
        if (!isMounted) return;
        
        setImageLoading(false);
        setImageError(true);
      }
    };

    loadImage();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
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
          onClick={handlePrintPostcard}
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
              {selectedLanguage === 'zh' ? '打印中...' : selectedLanguage === 'es' ? 'Imprimiendo...' : selectedLanguage === 'fr' ? 'Impression...' : 'Printing...'}
            </>
          ) : (
            <>
              <span className="mr-2">🖨️</span> 
              {selectedLanguage === 'zh' ? '打印' : selectedLanguage === 'es' ? 'Imprimir' : selectedLanguage === 'fr' ? 'Imprimer' : 'Print'}
            </>
          )}
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
          <div className="absolute top-4 right-4 w-32 h-36 flex items-start">
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
                    <span className="text-gray-700">{selectedLanguage === 'zh' ? '加载图片中...' : selectedLanguage === 'es' ? 'Cargando imagen...' : selectedLanguage === 'fr' ? 'Chargement de l\'image...' : 'Loading image...'}</span>
                  </div>
                ) : imageError ? (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <div className="text-center">
                      <p className="text-red-500 mb-2">{selectedLanguage === 'zh' ? '图片未找到' : selectedLanguage === 'es' ? 'Imagen no encontrada' : selectedLanguage === 'fr' ? 'Image non trouvée' : 'Image not found'}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {selectedLanguage === 'zh' ? '重试' : selectedLanguage === 'es' ? 'Reintentar' : selectedLanguage === 'fr' ? 'Réessayer' : 'Retry'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={currentImageSrc} 
                    alt={selectedLanguage === 'zh' ? '对话图片' : selectedLanguage === 'es' ? 'Imagen de conversación' : selectedLanguage === 'fr' ? 'Image de conversation' : 'Conversation image'} 
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
                    {localFeedback?.encouragingRemarks || (selectedLanguage === 'zh' ? '✅ 做得很好！继续努力！' : selectedLanguage === 'es' ? '✅ ¡Bien hecho! ¡Sigue esforzándote!' : selectedLanguage === 'fr' ? '✅ Bien joué ! Continue comme ça !' : '✅ Well done! Keep up the good work!')}
                  </div>
                </div>
                
                {/* Error Summary */}
                <div className="mb-4">
                  <div className="font-inter font-semibold text-gray-700 mb-1">
                    {textContent.errorSummary}
                  </div>
                  <div className="font-inter text-base whitespace-pre-line bg-[#fef3c7] p-3 rounded-lg">
                    {localFeedback?.errorSummary || (selectedLanguage === 'zh' ? '❗️ 没有发现明显错误' : selectedLanguage === 'es' ? '❗️ No se encontraron errores significativos' : selectedLanguage === 'fr' ? '❗️ Aucune erreur significative trouvée' : '❗️ No significant errors found')}
                  </div>
                </div>
                
                {/* Suggestions */}
                <div className="mb-4">
                  <div className="font-inter font-semibold text-gray-700 mb-1">
                    {textContent.suggestions}
                  </div>
                  <div className="font-inter text-base whitespace-pre-line bg-[#dbeafe] p-3 rounded-lg">
                    {localFeedback?.suggestions || (selectedLanguage === 'zh' ? '💡 保持当前水平，继续练习！' : selectedLanguage === 'es' ? '💡 ¡Mantén tu nivel actual y sigue practicando!' : selectedLanguage === 'fr' ? '💡 Maintiens ton niveau actuel et continue à t\'entraîner !' : '💡 Maintain your current level and keep practicing!')}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Community icon button in bottom right corner */}
      <div 
        className="fixed cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-200 z-40"
        style={{ 
          right: '20px', 
          bottom: '20px',
          width: '50px',
          height: '50px'
        }}
        onClick={handleOpenCommunity}
      >
        <img 
          src="/design/community.png" 
          alt="Community" 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to sample image if the specified image fails to load
            e.target.src = '/sample/sample_community.png';
          }}
        />
      </div>
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedLanguage === 'zh' ? '预览明信片' : selectedLanguage === 'es' ? 'Vista previa de la postal' : selectedLanguage === 'fr' ? 'Aperçu de la carte postale' : 'Preview Postcard'}
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
                    {selectedLanguage === 'zh' ? '取消' : selectedLanguage === 'es' ? 'Cancelar' : selectedLanguage === 'fr' ? 'Annuler' : 'Cancel'}
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
                        setSaveMessage(selectedLanguage === 'zh' ? '明信片已发送！' : selectedLanguage === 'es' ? '¡Postal enviada!' : selectedLanguage === 'fr' ? 'Carte postale envoyée !' : 'Postcard sent!');
                        setTimeout(() => {
                          setSaveMessage('');
                        }, 2000);
                      } catch (error) {
                        console.error('Error sending postcard:', error);
                        setSaveMessage(selectedLanguage === 'zh' ? '发送失败，请重试' : selectedLanguage === 'es' ? 'Error al enviar, inténtalo de nuevo' : selectedLanguage === 'fr' ? 'Échec de l\'envoi, veuillez réessayer' : 'Failed to send, please try again');
                        setTimeout(() => {
                          setSaveMessage('');
                        }, 2000);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium"
                  >
                    {selectedLanguage === 'zh' ? '发送' : selectedLanguage === 'es' ? 'Enviar' : selectedLanguage === 'fr' ? 'Envoyer' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Postcard Modal */}
      {showModal && selectedPostcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedLanguage === 'zh' ? '已保存的明信片' : selectedLanguage === 'es' ? 'Postal guardada' : selectedLanguage === 'fr' ? 'Carte postale enregistrée' : 'Saved Postcard'}
                </h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                {(() => {
                  // Add safety check for selectedPostcard
                  if (!selectedPostcard) {
                    // Fallback to sample images when no postcard data is available
                    const sampleImages = [
                      '/sample/sample_01.png',
                      '/sample/sample_02.png'
                    ];
                    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                    return (
                      <img 
                        src={randomImage} 
                        alt="Sample postcard" 
                        className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                      />
                    );
                  }
                  
                  // Check if we have imageData (Blob) from the saved postcard
                  if (selectedPostcard.imageData) {
                    // Handle Blob data
                    if (typeof selectedPostcard.imageData === 'string' && selectedPostcard.imageData.startsWith('data:')) {
                      // It's already a data URL
                      return (
                        <img 
                          src={selectedPostcard.imageData} 
                          alt="Saved postcard" 
                          className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                        />
                      );
                    } else {
                      // It's a Blob, convert it to URL
                      const imageUrl = URL.createObjectURL(selectedPostcard.imageData);
                      return (
                        <img 
                          src={imageUrl} 
                          alt="Saved postcard" 
                          className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                          onLoad={(e) => {
                            // Revoke the object URL after the image has loaded to free memory
                            URL.revokeObjectURL(e.target.src);
                          }}
                        />
                      );
                    }
                  } else if (selectedPostcard.id) {
                    // For IndexedDB images, display the loaded image or a loading indicator
                    if (indexedDBImage) {
                      return (
                        <img 
                          src={indexedDBImage} 
                          alt="Saved postcard" 
                          className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                        />
                      );
                    } else {
                      // Show loading indicator while fetching from IndexedDB
                      return (
                        <div className="flex items-center justify-center w-full h-64">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                        </div>
                      );
                    }
                  } else if (selectedPostcard.image_path) {
                    return (
                      <img 
                        src={selectedPostcard.image_path} 
                        alt="Saved postcard" 
                        className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                        onError={(e) => {
                          // Fallback to sample image if the specified image fails to load
                          const sampleImages = [
                            '/sample/sample_01.png',
                            '/sample/sample_02.png'
                          ];
                          const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                          e.target.src = randomImage;
                        }}
                      />
                    );
                  } else {
                    // Fallback to sample images when no image is available
                    const sampleImages = [
                      '/sample/sample_01.png',
                      '/sample/sample_02.png'
                    ];
                    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                    return (
                      <img 
                        src={randomImage} 
                        alt="Sample postcard" 
                        className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                      />
                    );
                  }
                })()}
                <p className="text-gray-600 text-center">
                  {selectedPostcard && selectedPostcard.timestamp ? 
                    new Date(selectedPostcard.timestamp).toLocaleString() : 
                    new Date().toLocaleString()}
                </p>
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
      
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {textContent.successMessage}
        </div>
      )}
    </div>
  );
};

export default ReviewPostcard;
