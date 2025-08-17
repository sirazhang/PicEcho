import React, { useState, useEffect, useRef } from 'react';
import { sendPostcard } from '../utils/api';

// 工具函数：生成图片路径
const getImagePath = (level, imageId) => {
  return `/Level${level}/${imageId}.png`;
};

// 模板化反馈内容
const getTemplateFeedback = (language) => {
  if (language === 'zh') {
    return {
      encouragingRemarks: "✅ 很棒的努力！🌟\n你的中文表达清晰而自然 👍，语气也很自信！继续保持，你的进步很明显！🚀",
      errorSummary: "❗ 小修正\n* ❌ \"小狗在跑步步。\" → ✅ \"小狗在跑。\"\n* ❌ \"他们在吃苹果子。\" → ✅ \"他们在吃苹果。\"",
      suggestions: "💡 可以试着这样说\n在看图说话时，可以尝试用更完整的句子，比如：\n* \"小狗正在公园里跑来跑去。\"\n* \"他们一家人坐在桌子旁边，一起吃苹果。\""
    };
  } else {
    return {
      encouragingRemarks: "✅ Excellent Effort! 🌟\n* Your speaking was clear and confident👍, which is really impressive! Keep it up, you're improving fast. 🚀",
      errorSummary: "⚠️ Small Fixes\n❌ \"I no know this word.\" → ✅ \"I don't know this word.\"\n❌ \"She is more higher than me.\" → ✅ \"She is higher than me.\"",
      suggestions: "💡 Try These Improvements\nInstead of \"I don't know this word\", you can say:\n* \"I'm not familiar with this word.\"\n* \"I haven't heard this word before.\""
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
        const response = await fetch(`/Level${level}/descriptions.json`);
        
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
  }, [feedback, imageId, selectedLanguage]);

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
    // Generate postcard image first
    await generatePostcardImage();
    setShowPreviewModal(true);
  };

  // Confirm and send the postcard
  const confirmSendPostcard = async () => {
    setIsSending(true);
    setSendStatus('');
    
    try {
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
      ctx.strokeStyle = '#3fbdc7';
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      // Draw header with postal code and stamp area
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 60px "Gloria Hallelujah", cursive';
      ctx.fillText(`Postcode: ${postalCode || 'N/A'}`, 60, 100);
      
      // Draw image on postcard (left side)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getImagePath(level, imageId);
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // Try fallback to level 1 image
          img.src = getImagePath(1, imageId);
          img.onload = resolve;
          img.onerror = reject;
        };
      });
      
      // Draw image
      const imgWidth = canvas.width * 0.45; // 45% of canvas width
      const imgHeight = canvas.height * 0.6; // 60% of canvas height
      const imgX = 60;
      const imgY = 150;
      
      // Draw image border
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20);
      
      // Draw image
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
      
      // Draw feedback section (right side)
      const feedbackX = imgX + imgWidth + 60;
      const feedbackY = 150;
      const feedbackWidth = canvas.width - feedbackX - 60;
      const feedbackHeight = canvas.height - feedbackY - 60;
      
      // Define fixed values for text positioning
      const lineHeight = 40;
      
      // Draw feedback section title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 70px "Gloria Hallelujah", cursive';
      ctx.textAlign = 'center';
      ctx.fillText('Feedback', feedbackX + feedbackWidth / 2, feedbackY + 60);
      ctx.textAlign = 'left';
      
      // Draw feedback content
      let currentY = feedbackY + 120;
      
      // Encouraging remarks
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#2e7d32'; // Green color
      ctx.fillText('✅ Excellent Effort! 🌟', feedbackX, currentY);
      
      ctx.font = '30px "Inter", sans-serif';
      ctx.fillStyle = '#000000';
      currentY += lineHeight;
      
      const encouragingRemarks = localFeedback?.encouragingRemarks || getTemplateFeedback(selectedLanguage).encouragingRemarks;
      // 使用 wrapTextForCanvas 函数来绘制鼓励评价
      const encouragingLines = wrapTextForCanvas(ctx, encouragingRemarks, feedbackX, currentY, feedbackWidth, lineHeight);
      currentY += lineHeight * encouragingLines;
      
      currentY += lineHeight / 2;
      
      // Error summary
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#ef6c00'; // Orange color
      ctx.fillText('⚠️ Error Summary', feedbackX, currentY);
      
      ctx.font = '30px "Inter", sans-serif';
      ctx.fillStyle = '#000000';
      currentY += lineHeight;
      
      const errorSummary = localFeedback?.errorSummary || getTemplateFeedback(selectedLanguage).errorSummary;
      // 使用 wrapTextForCanvas 函数来绘制错误总结
      const errorLines = wrapTextForCanvas(ctx, errorSummary, feedbackX, currentY, feedbackWidth, lineHeight);
      currentY += lineHeight * errorLines;
      
      currentY += lineHeight / 2;
      
      // Suggestions
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillStyle = '#1565c0'; // Blue color
      ctx.fillText('💡 Improvement Suggestions', feedbackX, currentY);
      
      ctx.font = '30px "Inter", sans-serif';
      ctx.fillStyle = '#000000';
      currentY += lineHeight;
      
      const suggestions = localFeedback?.suggestions || getTemplateFeedback(selectedLanguage).suggestions;
      // 使用 wrapTextForCanvas 函数来绘制改进建议
      const suggestionLines = wrapTextForCanvas(ctx, suggestions, feedbackX, currentY, feedbackWidth, lineHeight);
      currentY += lineHeight * suggestionLines;
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setPostcardImage(dataUrl);
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating postcard image:', error);
      
      // Generate a simple fallback image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 600;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#000000';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Postcard Image', canvas.width / 2, canvas.height / 2);
      
      const dataUrl = canvas.toDataURL('image/png');
      setPostcardImage(dataUrl);
      
      return dataUrl;
    }
  };

  // Helper function to wrap text on canvas
  const wrapTextForCanvas = (ctx, text, x, y, maxWidth, lineHeight) => {
    if (!text) return 0;
    
    const words = text.split(' ');
    let line = '';
    let lines = 1;
    let currentY = y;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
        lines++;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, currentY);
    return lines;
  };

  // Handle next picture button click
  const handleNextPicture = () => {
    // Step 1: 拿到同 level 的图片池
    let pool = [];
    try {
      const levelImageData = localStorage.getItem('levelImages');
      if (levelImageData) {
        const parsedData = JSON.parse(levelImageData);
        if (parsedData[`level${level}`]) {
          pool = parsedData[`level${level}`];
        }
      }
    } catch (e) {
      console.warn('Failed to parse level images from localStorage', e);
    }

    // fallback: 如果 localStorage 没有，就用硬编码的 levelImageMap
    if (!pool.length) {
      const levelImageMap = {
        1: ['img_01', 'img_02', 'img_03', 'img_04', 'img_05', 'img_06', 'img_07', 'img_08', 'img_09', 'img_10', 'img_11', 'img_12', 'img_13', 'img_14', 'img_16', 'img_17', 'img_20', 'img_23', 'img_29', 'img_30', 'img_31', 'img_33', 'img_34', 'img_40', 'img_41', 'img_47', 'img_48', 'img_51'],
        2: ['img_15', 'img_18', 'img_19', 'img_21', 'img_22', 'img_32', 'img_35', 'img_36', 'img_37', 'img_38', 'img_39', 'img_42', 'img_43', 'img_44', 'img_45', 'img_46', 'img_49', 'img_50'],
        3: ['img_24', 'img_25', 'img_26', 'img_27', 'img_28', 'img_52']
      };
      
      if (levelImageMap[level]) {
        pool = levelImageMap[level];
      }
    }

    // Step 2: 随机挑选不同于当前的 imageId
    let nextId = imageId;
    if (pool.length > 1) {
      // 确保不会选择到当前图片，除非池子只有一张图
      while (nextId === imageId) {
        nextId = pool[Math.floor(Math.random() * pool.length)];
      }
    } else if (pool.length === 1) {
      // 如果池子只有一张图，就使用那张图
      nextId = pool[0];
    }

    // Step 3: 跳转到新的对话页面
    window.location.hash = `#/dialogue/${nextId}/${selectedLanguage}/${level}`;
  };

  // Define text content
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        back: '返回',
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
        feedback: '反馈',
        encouragingRemarks: '鼓励评价',
        errorSummary: '错误总结',
        suggestions: '改进建议',
        generatingFeedback: '正在生成反馈...',
        errorGeneratingFeedback: '生成反馈时出错',
        postalCode: '邮编',
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
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
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
                    <p className="text-gray-600">
                      {selectedLanguage === 'zh' ? '生成预览中...' : 'Generating preview...'}
                    </p>
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
            className="border-4 border-black rounded-lg relative"  // 添加黑框和相对定位
            style={{ 
              width: '75vw', 
              height: '75vh',
              maxWidth: '1100px',
              maxHeight: '850px',
              backgroundColor: 'white'  // 确保背景为白色
            }}
          >
            {/* Main content area with image and feedback */}
            <div className="flex h-full p-6">
              {/* Left side - Image with postcode */}
              <div className="w-1/2 pr-4 flex flex-col">
                {/* Postcode above image */}
                <div className="self-start mb-4 border-2 border-black px-3 py-1">
                  <span className="font-gloria-hallelujah text-2xl">Postcode: {postalCode}</span>
                </div>
                
                {/* Image */}
                <div className="flex-grow flex items-center justify-center">
                  <img 
                    src={getImagePath(level, imageId)} 
                    alt={selectedLanguage === 'zh' ? "图片" : "Image"} 
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      console.log(`Failed to load image: ${getImagePath(level, imageId)}`);
                      // Try to load level 1 image as fallback
                      e.target.src = getImagePath(1, imageId);
                      e.target.onerror = null; // Prevent infinite loop
                    }}
                  />
                </div>
              </div>
              
              {/* Divider */}
              <div className="w-px bg-gray-400 mx-4"></div>
              
              {/* Right side - Feedback */}
              <div className="w-1/2 pl-4 flex flex-col">
                {/* Postcode and Feedback title */}
                <div className="mb-4">
                  <h2 className="font-inter font-bold text-2xl">{textContent.feedback}</h2>
                </div>
                
                {/* Feedback content */}
                <div className="flex-grow overflow-y-auto">
                  {/* Encouraging Remarks */}
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#e1fcc0', color: '#2c677b' }}>
                    <div className="font-inter text-xl font-bold mb-2">
                      {selectedLanguage === 'zh' ? '✅ 很棒的努力！🌟' : '✅ Excellent Effort! 🌟'}
                    </div>
                    <div className="font-inter text-xl whitespace-pre-line">
                      {localFeedback?.encouragingRemarks ? 
                        (selectedLanguage === 'zh' ? 
                          localFeedback.encouragingRemarks :
                          localFeedback.encouragingRemarks.split('\n').slice(1).join('\n')) :
                       (selectedLanguage === 'zh' ?
                         getTemplateFeedback(selectedLanguage).encouragingRemarks :
                         getTemplateFeedback(selectedLanguage).encouragingRemarks.split('\n').slice(1).join('\n'))
                      }
                    </div>
                  </div>
                  
                  {/* Error Summary */}
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f5e7B2', color: '#973131' }}>
                    <div className="font-inter text-xl font-bold mb-2">
                      {selectedLanguage === 'zh' ? '❗ 小修正' : '⚠️ Small Fixes'}
                    </div>
                    <div className="font-inter text-xl">
                      {localFeedback?.errorSummary ? (
                        <pre className="whitespace-pre-wrap font-sans m-0 p-0 text-xl" dangerouslySetInnerHTML={{
                          __html: selectedLanguage === 'zh' ?
                            localFeedback.errorSummary :
                            localFeedback.errorSummary
                              .replace(/⚠️ Small Fixes\n/g, '')
                              .replace(/❌\s*"([^"]+)"\s*→\s*✅\s*"([^"]+)"/g, 
                                '❌ <span style="text-decoration: line-through;">"$1"</span> → ✅ <span style="font-weight: bold;">"$2"</span>')
                        }} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans m-0 p-0 text-xl" dangerouslySetInnerHTML={{
                          __html: selectedLanguage === 'zh' ?
                            getTemplateFeedback(selectedLanguage).errorSummary :
                            getTemplateFeedback(selectedLanguage).errorSummary
                              .replace(/⚠️ Small Fixes\n/g, '')
                              .replace(/❌\s*"([^"]+)"\s*→\s*✅\s*"([^"]+)"/g, 
                                '❌ <span style="text-decoration: line-through;">"$1"</span> → ✅ <span style="font-weight: bold;">"$2"</span>')
                        }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#c0e0ff', color: '#253a82' }}>
                    <div className="font-inter text-xl font-bold mb-2">
                      {selectedLanguage === 'zh' ? '💡 可以试着这样说' : '💡 Try These Improvements'}
                    </div>
                    <div className="font-inter text-xl whitespace-pre-line">
                      {localFeedback?.suggestions ? (
                        selectedLanguage === 'zh' ?
                        localFeedback.suggestions :
                        localFeedback.suggestions
                          .replace(/💡 Try These Improvements\n/g, '')
                      ) : (
                        selectedLanguage === 'zh' ?
                        getTemplateFeedback(selectedLanguage).suggestions :
                        getTemplateFeedback(selectedLanguage).suggestions
                          .replace(/💡 Try These Improvements\n/g, '')
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stamp */}
            <div className="absolute top-6 right-6 w-28 h-32">
              <img 
                src={`/img_post/img_post_0${Math.floor(Math.random() * 6) + 1}.png`} 
                alt="Stamp" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReviewPostcard;