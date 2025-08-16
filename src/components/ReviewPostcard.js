import React, { useState, useEffect, useRef } from 'react';
import { sendPostcard } from '../utils/api';

// 工具函数：生成图片路径
const getImagePath = (level, imageId) => {
  return `/img_Level${level}/${imageId}.png`;
};

// 模板化反馈内容
const getTemplateFeedback = (language) => {
  if (language === 'zh') {
    return {
      encouragingRemarks: "做得很好！🌟\\n你的表达清晰自信，这真的很了不起！继续保持！👍",
      errorSummary: "• \"I no know this word.\" → \"I don't know this word.\"\\n• \"She is more higher than me.\" → \"She is higher than me.\"",
      suggestions: "• 用 \"I'm not familiar with this word.\" 替代 \"I don't know this word.\"\\n• 用 \"I haven't heard of this word before.\" 替代 \"I don't know this word.\""
    };
  } else {
    return {
      encouragingRemarks: "Excellent Effort! 🌟\\nYour speaking was clear and confident, which is really impressive! Keep up the good work! 👍",
      errorSummary: "• \"I no know this word.\" → \"I don't know this word.\"\\n• \"She is more higher than me.\" → \"She is higher than me.\"",
      suggestions: "Instead of \"I don't know this word,\" you can say:\\n• \"I'm not familiar with this word.\"\\n• \"I haven't heard of this word before.\""
    };
  }
};

const ReviewPostcard = ({ imageId, conversationHistory, feedback, onSave, onBack, isLoading, error, selectedLanguage, level: levelProp }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [imageDescription, setImageDescription] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(''); // '' | 'success' | 'error'
  const [level, setLevel] = useState(1); // Add level state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [postcardImage, setPostcardImage] = useState('');
  const postcardRef = useRef();

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
  }, []);

  // Get level from props or localStorage, default to 1
  useEffect(() => {
    // 如果props中传入了level，则使用props中的level
    if (levelProp) {
      setLevel(levelProp);
    } else {
      // 否则从localStorage读取
      const savedLevel = localStorage.getItem('selectedLevel');
      if (savedLevel) {
        setLevel(parseInt(savedLevel, 10));
      } else {
        setLevel(1);
      }
    }
  }, [levelProp]);

  // Load image description
  useEffect(() => {
    const loadImageDescription = async () => {
      try {
        // Load image descriptions from the appropriate level file
        const response = await fetch(`/descriptions_level${level}.json`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const descriptions = await response.json();
        const description = descriptions[imageId] || '';
        
        // 如果没有找到描述，使用默认值
        if (!description) {
          throw new Error(`No description found for image ID: ${imageId}`);
        }
        
        setImageDescription(description);
      } catch (error) {
        console.error('Error loading image description:', error);
        
        // 根据错误类型提供不同的回退信息
        let fallbackDescription;
        if (error.message.includes('HTTP')) {
          fallbackDescription = selectedLanguage === 'zh' 
            ? '无法加载图片描述（网络错误）' 
            : 'Unable to load image description (Network error)';
        } else if (error.message.includes('No description found')) {
          fallbackDescription = selectedLanguage === 'zh' 
            ? '暂无可用图片描述' 
            : 'No description available for this image';
        } else {
          fallbackDescription = selectedLanguage === 'zh' 
            ? '图片描述加载失败' 
            : 'Failed to load image description';
        }
        
        setImageDescription(fallbackDescription);
      }
    };

    if (imageId) {
      loadImageDescription();
    }
  }, [imageId, level]);

  // Check if postcard is already saved
  useEffect(() => {
    if (!feedback) return;
    
    const savedPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
    const exists = savedPostcards.some(
      card => card.imageId === imageId && card.timestamp === feedback.timestamp
    );
    
    if (exists) {
      setIsSaved(true);
      setSaveMessage(selectedLanguage === 'zh' ? '明信片已保存' : 'Postcard saved');
    }
  }, [feedback, imageId]);

  // Set template feedback if no feedback is provided
  useEffect(() => {
    if (!feedback) {
      const templateFeedback = getTemplateFeedback(selectedLanguage);
      setLocalFeedback(templateFeedback);
    } else {
      setLocalFeedback(feedback);
    }
  }, [feedback, selectedLanguage]);

  // Handle saving the postcard to localStorage
  const handleSavePostcard = () => {
    if (!localFeedback) return;
    
    const postcardData = {
      imageId,
      imageDescription,
      feedback: localFeedback,
      level,
      imageData: postcardImage, // Include the generated postcard image
      timestamp: new Date().toISOString()
    };
    
    onSave(postcardData);
    setIsSaved(true);
    setSaveMessage(selectedLanguage === 'zh' ? '明信片已保存' : 'Postcard saved');
    
    // Auto-hide the message after 2 seconds
    setTimeout(() => {
      setSaveMessage('');
    }, 2000);
  };

  // Handle sending the postcard
  const handleSendPostcard = async () => {
    setShowSendModal(true);
  };

  // Confirm and send the postcard
  const confirmSendPostcard = async () => {
    setIsSending(true);
    setSendStatus('');
    
    try {
      // Generate postcard image first
      await generatePostcardImage();
      
      // Send the postcard
      const response = await sendPostcard({
        senderId: 'user_' + Math.random().toString(36).substr(2, 9), // Generate a simple sender ID
        imageUrl: postcardImage, // This will be the generated image data
        feedbackText: localFeedback,
        postalCode
      });
      
      if (response?.success) {
        setSendStatus('success');
        setTimeout(() => {
          setShowSendModal(false);
          setShowPreviewModal(false);
          setSendStatus('');
        }, 2000);
      } else {
        throw new Error(response?.message || 'send_failed');
      }
    } catch (error) {
      console.error('Error sending postcard:', error);
      
      if (error.message === 'network') {
        setSendStatus(selectedLanguage === 'zh' ? '网络错误：请检查您的互联网连接' : 'Network error: Please check your internet connection');
      } else if (error.message === 'send_failed') {
        setSendStatus(selectedLanguage === 'zh' ? '明信片发送失败，请稍后重试' : 'Failed to send postcard. Please try again later');
      } else {
        setSendStatus(selectedLanguage === 'zh' ? '发生未知错误，请重试' : 'An unknown error occurred. Please try again');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Generate postcard image for preview
  const generatePostcardImage = async () => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to a larger size for better preview
      canvas.width = 1600;
      canvas.height = 1200; // Larger size for better quality
      
      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw decorative border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      
      // Draw postal code (top-left)
      ctx.fillStyle = '#333';
      ctx.font = 'bold 32px "Gloria Hallelujah"';
      ctx.fillText('Postcode: ' + postalCode, 60, 80);
      
      
      // Load and draw stamp (top-right)
      const stampImg = new Image();
      stampImg.crossOrigin = 'Anonymous';
      // Use the same stamp as shown in the postcard
      stampImg.src = `/img_post/img_post_0${Math.floor(Math.random() * 6) + 1}.png`;
      
      // Wait for stamp to load
      await new Promise((resolve) => {
        stampImg.onload = resolve;
        stampImg.onerror = () => resolve(); // Continue even if stamp fails to load
        // Add timeout to prevent infinite waiting
        setTimeout(resolve, 3000);
      });
      
      // Draw stamp (right-top, larger size)
      ctx.drawImage(stampImg, canvas.width - 240, 50, 180, 200);
      
      // Draw separator line (simulating grid layout)
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 200);
      ctx.lineTo(canvas.width / 2, canvas.height - 60);
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw image (left side, larger and less compressed)
      const postcardImg = new Image();
      postcardImg.crossOrigin = 'Anonymous';
      postcardImg.src = `/img_Level${level}/${imageId}.png`;
      
      // Wait for image to load
      await new Promise((resolve) => {
        postcardImg.onload = () => {
          // Draw image to canvas (left area) with larger size
          const maxWidth = 750; // Increased from 700 to 750 to reduce compression
          const maxHeight = 750; // Increased from 700 to 750 to reduce compression
          let width = postcardImg.width;
          let height = postcardImg.height;
          
          // Scale proportionally but with less compression
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
          
          // Center in left area
          const leftAreaCenterX = canvas.width / 4;
          const leftAreaCenterY = (canvas.height + 200) / 2;
          ctx.drawImage(
            postcardImg, 
            leftAreaCenterX - width / 2, 
            leftAreaCenterY - height / 2, 
            width, 
            height
          );
          resolve();
        };
        postcardImg.onerror = () => resolve(); // Continue even if image fails to load
        // Add timeout to prevent blocking
        setTimeout(resolve, 3000);
      });
      
      // Draw feedback title
      const feedbackStartX = canvas.width / 2 + 70;
      let currentY = 250;
      
      ctx.fillStyle = 'black';
      ctx.font = 'bold 42px "Gloria Hallelujah"';
      ctx.fillText(textContent.feedback, feedbackStartX, currentY);
      currentY += 90;
      
      // Encouraging remarks
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#2e7d32'; // Green color
      ctx.fillText('✅ Excellent Effort! 🌟', feedbackX, currentY);
      
      ctx.font = '30px "Inter", sans-serif';
      ctx.fillStyle = '#000000';
      currentY += lineHeight;
      
      const encouragingRemarks = localFeedback?.encouragingRemarks || getTemplateFeedback(selectedLanguage).encouragingRemarks;
      const encouragingLines = encouragingRemarks.split('\\n');
      encouragingLines.forEach(line => {
        ctx.fillText(line, feedbackX, currentY);
        currentY += lineHeight;
      });
      
      currentY += lineHeight / 2;
      
      // Error summary
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#ef6c00'; // Orange color
      ctx.fillText('⚠️ Error Summary', feedbackX, currentY);
      
      ctx.font = '30px "Inter", sans-serif';
      ctx.fillStyle = '#000000';
      currentY += lineHeight;
      
      const errorSummary = localFeedback?.errorSummary || getTemplateFeedback(selectedLanguage).errorSummary;
      const errorLines = errorSummary.split('\\n');
      errorLines.forEach(line => {
        ctx.fillText(line, feedbackX, currentY);
        currentY += lineHeight;
      });
      
      currentY += lineHeight / 2;
      
      // Suggestions
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#1565c0'; // Blue color
      ctx.fillText('💡 Improvement Suggestions', feedbackX, currentY);
      
      ctx.font = '30px "Inter", sans-serif';
      ctx.fillStyle = '#000000';
      currentY += lineHeight;
      
      const suggestions = localFeedback?.suggestions || getTemplateFeedback(selectedLanguage).suggestions;
      const suggestionLines = suggestions.split('\\n');
      suggestionLines.forEach(line => {
        ctx.fillText(line, feedbackX, currentY);
        currentY += lineHeight;
      });
      
      // Convert canvas to image data URL
      const imageData = canvas.toDataURL('image/png');
      setPostcardImage(imageData);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error generating postcard image:', err);
    }
  };

  // Helper function to wrap text on canvas
  const wrapTextForCanvas = (ctx, text, x, y, maxWidth, lineHeight) => {
    if (!text) return 0;
    
    const words = text.split(' ');
    let line = '';
    let lines = 1;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lines++;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, y);
    return lines;
  };

  // Handle next picture button click
  const handleNextPicture = () => {
    // Get all images for current level from localStorage or fallback to hardcoded list
    let levelImages = [];
    
    try {
      // Try to get image list from localStorage (set by HomeScreen)
      const levelImageData = localStorage.getItem('levelImages');
      if (levelImageData) {
        const parsedData = JSON.parse(levelImageData);
        if (parsedData[`level${level}`]) {
          levelImages = parsedData[`level${level}`];
        }
      }
    } catch (e) {
      console.warn('Failed to parse level images from localStorage', e);
    }
    
    // Fallback to hardcoded lists if localStorage data is not available
    if (levelImages.length === 0) {
      const levelImageMap = {
        1: ['img_01', 'img_02', 'img_03', 'img_04', 'img_05', 'img_06', 'img_07', 'img_08', 'img_09', 'img_10', 'img_11', 'img_12', 'img_13', 'img_14', 'img_16', 'img_17', 'img_20', 'img_23', 'img_29', 'img_30', 'img_31', 'img_33', 'img_34', 'img_40', 'img_41', 'img_47', 'img_48', 'img_51'],
        2: ['img_15', 'img_18', 'img_19', 'img_21', 'img_22', 'img_32', 'img_35', 'img_36', 'img_37', 'img_38', 'img_39', 'img_42', 'img_43', 'img_44', 'img_45', 'img_46', 'img_49', 'img_50'],
        3: ['img_24', 'img_25', 'img_26', 'img_27', 'img_28', 'img_52']
      };
      
      levelImages = levelImageMap[level] || levelImageMap[1];
    }
    
    // Filter out current image
    const otherImages = levelImages.filter(img => img !== imageId);
    
    // Select random image from remaining images
    if (otherImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherImages.length);
      const nextImageId = otherImages[randomIndex];
      
      // Redirect to dialogue mode with new image using the hash routing pattern from App.js
      window.location.hash = `#/dialogue/${nextImageId}/${selectedLanguage}/${level}`;
    }
  };

  // Define text content
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        back: 'Home',
        save: isSaved ? '已保存' : '保存明信片',
        send: '发送明信片',
        nextPicture: '下一张图片',
        sendConfirm: '您想发送这张明信片与另一位学习者交换吗？',
        sendPreviewConfirm: '这是您要发送的明信片，确认发送吗？',
        sendYes: '是',
        sendNo: '否',
        sending: '发送中...',
        sendSuccess: '明信片已发送！',
        sendError: '发送失败，请重试',
        feedback: 'Feedback',
        encouragingRemarks: '鼓励评价',
        errorSummary: '错误总结',
        suggestions: '改进建议',
        generatingFeedback: '正在生成反馈...',
        errorGeneratingFeedback: '生成反馈时出错',
        postalCode: 'Postal Code',
      };
    } else {
      return {
        back: 'Home',
        save: isSaved ? 'Saved' : 'Save Postcard',
        send: 'Send Postcard',
        nextPicture: 'Next Picture',
        sendConfirm: 'Do you want to send this postcard and exchange with another learner?',
        sendPreviewConfirm: 'This is the postcard you want to send. Confirm sending?',
        sendYes: 'Yes',
        sendNo: 'No',
        sending: 'Sending...',
        sendSuccess: 'Postcard sent!',
        sendError: 'Failed to send, please try again',
        feedback: 'Feedback',
        encouragingRemarks: 'Encouraging Remarks',
        errorSummary: 'Error Summary',
        suggestions: 'Suggestions',
        generatingFeedback: 'Generating feedback...',
        errorGeneratingFeedback: 'Error generating feedback',
        postalCode: 'Postal Code',
      };
    }
  };

  const textContent = getTextContent();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{textContent.generatingFeedback}</h2>
          <p className="text-gray-600">
            {selectedLanguage === 'zh' 
              ? '我们正在分析您的对话并生成个性化反馈' 
              : 'We are analyzing your conversation and generating personalized feedback'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-2xl w-full">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{textContent.errorGeneratingFeedback}</h2>
          
          <div className="mb-6 text-left inline-block text-gray-600 max-w-lg">
            <p className="mb-4">
              {selectedLanguage === 'zh' 
                ? '我们遇到了一些问题来生成您的反馈。以下是一些可能的原因和解决办法：' 
                : 'We encountered some issues generating your feedback. Here are some possible causes and solutions:'}
            </p>
            <ul className={`list-disc pl-5 space-y-2 ${selectedLanguage === 'zh' ? 'list-outside' : ''}`}>
              {selectedLanguage === 'zh' ? (
                <>
                  <li>网络连接不稳定，请检查您的网络</li>
                  <li>对话内容可能过短，请尝试更详细的对话</li>
                  <li>服务器可能暂时不可用，请稍后再试</li>
                </>
              ) : (
                <>
                  <li>Unstable network connection, please check your network</li>
                  <li>Conversation content may be too brief, try having a more detailed conversation</li>
                  <li>Server may be temporarily unavailable, please try again later</li>
                </>
              )}
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
            >
              {textContent.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4" style={{ minHeight: '100vh', backgroundColor: '#e5f5fb' }}>
      <div className="w-full max-w-8xl">
        {/* Success/Error messages */}
        {saveMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
            {saveMessage}
          </div>
        )}
        {sendStatus === 'success' && (
          <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
            {textContent.sendSuccess}
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="fixed top-4 right-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
            {textContent.sendError}
          </div>
        )}

        {/* All buttons in one row at the top */}
        <div className="flex flex-wrap justify-between items-center p-6 w-full gap-4">
          {/* Home button */}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg font-inter text-white font-bold text-base flex items-center justify-center"
            style={{ backgroundColor: '#003153', minWidth: '120px', minHeight: '40px' }}
          >
            {textContent.back}
          </button>
          
          {/* Save Postcard button */}
          <button
            onClick={handleSavePostcard}
            disabled={isSaved}
            className="px-4 py-2 rounded-lg font-inter text-white font-bold text-base flex items-center justify-center"
            style={{ backgroundColor: '#3fbdc7', minWidth: '120px', minHeight: '40px' }}
          >
            {textContent.save}
          </button>
          
          {/* Send Postcard button */}
          <button
            onClick={handleSendPostcard}
            className="px-4 py-2 rounded-lg font-inter text-white font-bold text-base flex items-center justify-center"
            style={{ backgroundColor: '#66ab4b', minWidth: '120px', minHeight: '40px' }}
          >
            {textContent.send}
          </button>
          
          {/* Next Picture button */}
          <button
            onClick={handleNextPicture}
            className="px-4 py-2 rounded-lg font-inter text-white font-bold text-base flex items-center justify-center"
            style={{ backgroundColor: '#4bc1eb', minWidth: '120px', minHeight: '40px' }}
          >
            {textContent.nextPicture}
          </button>
        </div>

        {/* Send confirmation modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{textContent.send}</h3>
              <p className="text-gray-600 mb-6">{textContent.sendConfirm}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={isSending}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {textContent.sendNo}
                </button>
                <button
                  onClick={confirmSendPostcard}
                  disabled={isSending}
                  className="px-4 py-2 bg-indigo-500 rounded-lg text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {textContent.sending}
                    </>
                  ) : (
                    textContent.sendYes
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6" style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{textContent.send}</h3>
              <p className="text-gray-600 mb-4">{textContent.sendPreviewConfirm}</p>
              
              <div className="flex justify-center mb-6">
                {postcardImage ? (
                  <img 
                    src={postcardImage} 
                    alt="Postcard preview" 
                    className="max-w-full h-auto border border-gray-300 rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-600">生成预览中...</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  disabled={isSending}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {textContent.sendNo}
                </button>
                <button
                  onClick={confirmSendPostcard}
                  disabled={isSending || !postcardImage}
                  className="px-4 py-2 bg-indigo-500 rounded-lg text-white hover:bg-indigo-600 disabled:opacity-50 flex items-center"
                >
                  {isSending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {textContent.sending}
                    </>
                  ) : (
                    textContent.sendYes
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Postcard display area */}
        <div className="flex flex-col items-center mt-6">
          <div 
            ref={postcardRef}
            className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200"
            style={{ 
              width: '80vw', 
              height: '78vh',
              maxWidth: '1200px',
              maxHeight: '900px'
            }}
          >
            {/* Header section with postal code and stamp */}
            <div className="flex justify-between items-start mb-6">
              <div className="text-4xl font-gloria-hallelujah">
                Postcode: {postalCode}
              </div>
              <img 
                src={`/img_post/img_post_0${Math.floor(Math.random() * 6) + 1}.png`} 
                alt="Stamp" 
                className="w-32 h-36 object-contain"
              />
            </div>
            
            {/* Main content area with image and feedback */}
            <div className="flex h-full">
              {/* Image Section */}
              <div className="w-full md:w-2/5 flex items-center justify-center mb-2 md:mb-0">
                <div className="relative w-full h-64 md:h-80 flex items-center justify-center">
                  <img 
                    src={getImagePath(level, imageId)} 
                    alt={selectedLanguage === 'zh' ? "图片" : "Image"} 
                    className="max-h-full max-w-full object-contain rounded-lg border-2 border-gray-300"
                    onError={(e) => {
                      console.log(`Failed to load image: ${getImagePath(level, imageId)}`);
                      // Try to load level 1 image as fallback
                      e.target.src = getImagePath(1, imageId);
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                  />
                </div>
              </div>
              
              {/* Feedback section (right 50%) */}
              <div className="w-1/2 flex flex-col p-6">
                <h2 className="text-5xl font-gloria-hallelujah mb-8 text-center">
                  {textContent.feedback}
                </h2>
                
                <div className="flex-grow overflow-y-auto pr-2">
                  {/* Encouraging Remarks */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-inter font-bold text-green-700 mb-3 flex items-center">
                      <span className="mr-2">✅</span> {textContent.encouragingRemarks}
                    </h3>
                    <p className={`font-inter ${localFeedback?.encouragingRemarks?.length > 200 ? 'text-sm' : 'text-base'} text-gray-800`}>
                      {localFeedback?.encouragingRemarks || 'No encouraging remarks available.'}
                    </p>
                  </div>
                  
                  {/* Error Summary */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-inter font-bold text-orange-700 mb-3 flex items-center">
                      <span className="mr-2">⚠️</span> {textContent.errorSummary}
                    </h3>
                    <p className={`font-inter ${localFeedback?.errorSummary?.length > 200 ? 'text-sm' : 'text-base'} text-gray-800`}>
                      {localFeedback?.errorSummary || 'No error summary available.'}
                    </p>
                  </div>
                  
                  {/* Suggestions */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-inter font-bold text-blue-700 mb-3 flex items-center">
                      <span className="mr-2">💡</span> {textContent.suggestions}
                    </h3>
                    <p className={`font-inter ${localFeedback?.suggestions?.length > 200 ? 'text-sm' : 'text-base'} text-gray-800`}>
                      {localFeedback?.suggestions || 'No suggestions available.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewPostcard;