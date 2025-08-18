import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { sendPostcard } from '../utils/api';

// 工具函数：生成图片路径
const getImagePath = (propsLevel, imageId) => {
  return `/Level${propsLevel}/${imageId}.png`;
};

const ReviewPostcard = ({ feedback, onNextPicture, level, imageId, onClose, selectedLanguage, conversationHistory, onSave, onBack, isLoading, error }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [localFeedback, setLocalFeedback] = useState(feedback || {
    encouragingRemarks: selectedLanguage === 'zh' ? '做得很好！继续努力！' : 'Well done! Keep up the good work!',
    errorSummary: selectedLanguage === 'zh' ? '没有发现明显错误' : 'No significant errors found',
    suggestions: selectedLanguage === 'zh' ? '保持当前水平，继续练习！' : 'Maintain your current level and keep practicing!'
  });
  const [postalCode, setPostalCode] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(''); // '' | 'success' | 'error'
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
  }, [imageId]);

  // Update local feedback when feedback prop changes
  useEffect(() => {
    setLocalFeedback(feedback);
  }, [feedback]);

  // Handle save postcard button click
  const handleSavePostcard = async () => {
    if (isSaved) return;
    
    try {
      // Generate the postcard image using html2canvas
      const imageData = await generatePostcardImage();
      
      const postcardData = {
        id: Date.now().toString(),
        imageId: imageId,
        level: level,
        imageData, // Use the generated image data
        timestamp: new Date().toISOString(),
        postalCode: postalCode,
        conversationHistory: conversationHistory || [] // Include conversation history if available
      };
      
      onSave(postcardData);
      setIsSaved(true);
      setSaveMessage(selectedLanguage === 'zh' ? '明信片已保存！' : 'Postcard saved!');
      
      // Clear save message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving postcard:', error);
      setSaveMessage(selectedLanguage === 'zh' ? '保存失败，请重试' : 'Failed to save, please try again');
      
      // Clear save message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    }
  };

  // Handle send postcard button click
  const handleSendPostcard = async () => {
    // Show confirmation modal first
    setShowSendModal(true);
  };

  // Handle confirmation of send postcard
  const handleConfirmSendCard = async () => {
    setIsSending(true);
    setSendStatus('');
    
    try {
      // Generate the postcard image using our canvas method
      const imageData = await generatePostcardImage();
      setPostcardImage(imageData);
      
      // Show preview modal
      setShowPreviewModal(true);
      setShowSendModal(false);
    } catch (error) {
      console.error('Error generating postcard image:', error);
      setSendStatus('error');
      setIsSending(false);
    }
  };

  // Send the postcard to backend
  const sendPostcardToBackend = async () => {
    setIsSending(true);
    setSendStatus('');
    
    try {
      console.log('Starting to send postcard...');
      
      // Make sure we have a postcard image
      if (!postcardImage) {
        throw new Error('No postcard image available');
      }
      
      console.log('Postcard image length:', postcardImage.length);
      
      // Send the postcard
      const response = await sendPostcard({
        senderId: 'user_' + Math.random().toString(36).substr(2, 9), // Generate a simple sender ID
        imageUrl: postcardImage, // This will be the base64 image data
        feedbackText: localFeedback,
        postalCode
      });
      
      console.log('Postcard send response:', response);
      
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
      
      if (error.message && error.message.includes('Network error')) {
        setSendStatus(selectedLanguage === 'zh' ? '网络错误：请检查您的互联网连接' : 'Network error: Please check your internet connection');
      } else if (error.message && error.message.includes('Server error')) {
        setSendStatus(selectedLanguage === 'zh' ? '服务器错误：请稍后重试' : 'Server error: Please try again later');
      } else {
        setSendStatus(selectedLanguage === 'zh' ? '未知错误：请稍后重试' : 'Unknown error: Please try again later');
      }
      
      // Keep modal open so user can try again
    } finally {
      setIsSending(false);
    }
  };

  // Handle confirmed send postcard
  const handleSendConfirmed = async () => {
    await sendPostcardToBackend();
  };

  // Generate postcard image for preview
  const generatePostcardImage = async () => {
    try {
      // Use html2canvas to capture the postcard ref directly
      if (!postcardRef.current) {
        throw new Error('Postcard reference is not available');
      }
      
      const canvas = await html2canvas(postcardRef.current, {
        scale: 2, // Higher quality
        useCORS: true, // Enable cross-origin resource sharing
        logging: false, // Disable logging
        backgroundColor: '#ffffff' // Ensure white background
      });
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setPostcardImage(dataUrl);
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating postcard image with html2canvas:', error);
      throw error; // Re-throw to be handled by caller
    }
  };


  // Handle next picture button click
  const handleNextPicture = () => {
    if (onNextPicture) {
      onNextPicture(level);  // 只告诉父组件：用户点了"下一张"
    }
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
                  onClick={handleConfirmSendCard}
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
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {textContent.sendYes}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">{textContent.send}</h3>
                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-col items-center">
                  {postcardImage ? (
                    <img 
                      src={postcardImage} 
                      alt="Postcard preview" 
                      className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                    />
                  ) : (
                    <div className="text-gray-500">No image available</div>
                  )}
                  <p className="text-gray-600 mb-6 text-center">{textContent.sendPreviewConfirm}</p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    {textContent.sendNo}
                  </button>
                  <button
                    onClick={handleSendConfirmed}
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
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        {textContent.sendYes}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content - Postcard display area */}
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
            {/* Postal code - positioned at top left */}
            <div className="absolute top-4 left-4 bg-white px-2 py-1 border-2 border-black z-10">
              <span className="font-gloria-hallelujah text-2xl">{postalCode}</span>
            </div>
            
            {/* Main content area - flex row with two columns */}
            <div className="flex h-full">
              {/* Left side - Image (50% width) */}
              <div className="w-1/2 flex items-center justify-center p-4 relative border-r-4 border-gray-400">
                <div className="flex items-center justify-center h-full w-full">
                  <img 
                    src={getImagePath(level, imageId)}
                    alt="Selected"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      // Fallback to Level 1 image if current level image doesn't exist
                      e.target.src = getImagePath(1, imageId);
                      // Remove the onError handler to prevent infinite loop
                      e.target.onerror = null;
                    }}
                  />
                </div>
              </div>
            
              {/* Right side - Feedback (50% width) */}
              <div className="w-1/2 flex flex-col relative"> {/* 移除pr-32，使用相对定位 */}
                {/* Stamp - moved to top right corner above feedback */}
                <div className="absolute top-4 right-4 w-1/5"> {/* 调整邮票尺寸和位置 */}
                  <img 
                    src={`/img_post/img_post_0${Math.floor(Math.random() * 6) + 1}.png`} 
                    alt="Stamp" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Feedback content - aligned to top right */}
                <div className="flex-grow overflow-y-auto p-4 pt-16"> {/* 添加顶部内边距为邮票留空间 */}
                  {/* Feedback title */}
                  <div className="mb-4">
                    <h2 className="font-inter font-bold text-xl">{textContent.feedback}</h2>
                  </div>
                  
                  {/* Feedback content */}
                  {/* Encouraging Remarks */}
                  <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#e1fcc0', color: '#2c677b' }}>
                    <div className="font-inter font-bold mb-1">
                      {selectedLanguage === 'zh' ? '✅ 很棒的努力！🌟' : '✅ Excellent Effort! 🌟'}
                    </div>
                    <div className="font-inter whitespace-pre-line text-sm">
                      {localFeedback?.encouragingRemarks}
                    </div>
                  </div>
                
                  {/* Error Summary */}
                  <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#f5e7B2', color: '#973131' }}>
                    <div className="font-inter font-bold mb-1">
                      {selectedLanguage === 'zh' ? '❗ 小修正' : '❗️ Small Fixes'}
                    </div>
                    <div className="font-inter text-sm">
                      {localFeedback?.errorSummary ? (
                        <pre className="whitespace-pre-wrap font-sans m-0 p-0">
                          {localFeedback.errorSummary}
                        </pre>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans m-0 p-0">
                          {selectedLanguage === 'zh' ? 
                            "* ❌ \"小狗在跑步步。\" → ✅ \"小狗在跑。\"\n* ❌ \"他们在吃苹果子。\" → ✅ \"他们在吃苹果。\"" :
                            "❌ \"I no know this word.\" → ✅ \"I don't know this word.\"\n❌ \"She is more higher than me.\" → ✅ \"She is higher than me.\""
                          }
                        </pre>
                      )}
                    </div>
                  </div>
                
                  {/* Suggestions */}
                  <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#c0e0ff', color: '#253a82' }}>
                    <div className="font-inter font-bold mb-1">
                      {selectedLanguage === 'zh' ? '💡 可以试着这样说' : '💡 Try These Improvements'}
                    </div>
                    <div className="font-inter whitespace-pre-line text-sm">
                      {localFeedback?.suggestions}
                    </div>
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