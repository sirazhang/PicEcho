import React, { useState, useEffect, useRef } from 'react';
import { sendPostcard } from '../utils/api';

const ReviewPostcard = ({ imageId, conversationHistory, feedback, onSave, onBack, isLoading, error, selectedLanguage }) => {
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
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const nums = '0123456789';
      let result = '';
      
      // Generate format like A1B 2C3
      for (let i = 0; i < 3; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
        result += nums.charAt(Math.floor(Math.random() * nums.length));
      }
      
      return result.substring(0, 3) + ' ' + result.substring(3);
    };
    
    setPostalCode(generatePostalCode());
  }, []);

  // Get level from localStorage or default to 1
  useEffect(() => {
    const savedLevel = localStorage.getItem('selectedLevel');
    if (savedLevel) {
      setLevel(parseInt(savedLevel, 10));
    } else {
      setLevel(1);
    }
  }, []);

  // Load image description
  useEffect(() => {
    const loadImageDescription = async () => {
      try {
        const response = await fetch('/descriptions.json');
        
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
  }, [imageId]);

  // Check if postcard is already saved
  useEffect(() => {
    if (!feedback) return;
    
    const savedPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
    const exists = savedPostcards.some(
      card => card.imageId === imageId && card.timestamp === feedback.timestamp
    );
    setIsSaved(exists);
  }, [feedback, imageId]);

  const handleSave = () => {
    if (!feedback) return;
    
    const postcardData = {
      imageId,
      imageDescription,
      conversationHistory,
      feedback,
      timestamp: feedback.timestamp || new Date().toISOString(),
      isSaved: true
    };

    try {
      // 尝试保存到localStorage
      try {
        const savedPostcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
        const updatedPostcards = [...savedPostcards, postcardData];
        localStorage.setItem('savedPostcards', JSON.stringify(updatedPostcards));
      } catch (storageError) {
        console.warn('LocalStorage error:', storageError);
        // 非致命错误，继续执行内存保存
      }
      
      // 触发onSave回调
      onSave(postcardData);
      setIsSaved(true);
      
      // 显示成功消息
      const successMessage = selectedLanguage === 'zh' ? '明信片已保存!' : 'Postcard saved!';
      setSaveMessage(successMessage);
      setTimeout(() => setSaveMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving postcard:', error);
      
      // 显示更具体的错误消息
      let errorMessage;
      if (error instanceof TypeError) {
        errorMessage = selectedLanguage === 'zh' 
          ? '类型错误：保存数据无效' 
          : 'Type error: Invalid data to save';
      } else if (error.code === 22 || error.code === 12) {
        errorMessage = selectedLanguage === 'zh' 
          ? '存储已满：请清除浏览器缓存后重试' 
          : 'Storage full: Please clear browser cache and try again';
      } else {
        errorMessage = selectedLanguage === 'zh' 
          ? '保存失败，请检查网络后重试' 
          : 'Failed to save, please check your network and try again';
      }
      
      setSaveMessage(errorMessage);
      setTimeout(() => setSaveMessage(''), 5000);
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
      
      // 绘制邮编
      ctx.fillStyle = 'white';
      ctx.fillRect(40, 40, 140, 60);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(40, 40, 140, 60);
      ctx.fillStyle = 'black';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(textContent.postalCode, 50, 65);
      ctx.font = '22px monospace';
      ctx.fillText(postalCode, 50, 95);
      
      // 绘制邮票
      const stampImg = new Image();
      stampImg.crossOrigin = 'Anonymous';
      stampImg.src = '/img_post/img_post_01.png';
      
      // 等待邮票加载完成
      await new Promise((resolve) => {
        stampImg.onload = resolve;
        stampImg.onerror = resolve; // 即使加载失败也继续
        // 添加超时处理，防止图片加载阻塞
        setTimeout(resolve, 3000);
      });
      
      // 绘制邮票（右上角，不压缩）
      ctx.drawImage(stampImg, canvas.width - 180, 40, 140, 160);
      
      // 绘制分隔线（模拟grid布局）
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 150);
      ctx.lineTo(canvas.width / 2, canvas.height - 50);
      ctx.strokeStyle = '#ddd';
      ctx.stroke();
      
      // 绘制图片（左侧，放大）
      const postcardImg = new Image();
      postcardImg.crossOrigin = 'Anonymous';
      postcardImg.src = `/img_Level${level}/${imageId}.png`;
      
      // 等待图片加载完成
      await new Promise((resolve) => {
        postcardImg.onload = () => {
          // 绘制图片到canvas上（左侧区域）
          const maxWidth = 500;
          const maxHeight = 500;
          let width = postcardImg.width;
          let height = postcardImg.height;
          
          // 按比例缩放
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
          
          // 居中绘制在左侧区域
          const leftAreaCenterX = canvas.width / 4;
          const leftAreaCenterY = (canvas.height + 150) / 2;
          ctx.drawImage(
            postcardImg, 
            leftAreaCenterX - width / 2, 
            leftAreaCenterY - height / 2, 
            width, 
            height
          );
          resolve();
        };
        postcardImg.onerror = () => resolve(); // 即使加载失败也继续
        // 添加超时处理，防止图片加载阻塞
        setTimeout(resolve, 3000);
      });
      
      // 绘制反馈标题
      const feedbackStartX = canvas.width / 2 + 50;
      let currentY = 180;
      
      ctx.fillStyle = 'black';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(textContent.feedback, feedbackStartX, currentY);
      currentY += 60;
      
      // 绘制鼓励评价
      ctx.fillStyle = '#2d7d49';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(textContent.encouragingRemarks, feedbackStartX, currentY);
      currentY += 40;
      
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      const encouragingRemarksLines = wrapTextForCanvas(ctx, localFeedback.encouragingRemarks || '', feedbackStartX, currentY, 500, 30);
      currentY += encouragingRemarksLines * 30 + 30;
      
      // 绘制错误总结
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(textContent.errorSummary, feedbackStartX, currentY);
      currentY += 40;
      
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      const errorSummaryLines = wrapTextForCanvas(ctx, localFeedback.errorSummary || '', feedbackStartX, currentY, 500, 30);
      currentY += errorSummaryLines * 30 + 30;
      
      // 绘制改进建议
      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(textContent.suggestions, feedbackStartX, currentY);
      currentY += 40;
      
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      wrapTextForCanvas(ctx, localFeedback.suggestions || '', feedbackStartX, currentY, 500, 30);
      
      // 将canvas转换为图片数据URL
      const imageData = canvas.toDataURL('image/png');
      setPostcardImage(imageData);
      setShowPreviewModal(true);
    } catch (err) {
      console.error('Error generating postcard image:', err);
      // 如果生成失败，显示错误消息
      setSendStatus(selectedLanguage === 'zh' ? '生成明信片预览失败' : 'Failed to generate postcard preview');
      setTimeout(() => setSendStatus(''), 3000);
    }
  };

  // 辅助函数：计算文本行数
  const countTextLines = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    let line = '';
    let lines = 1;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lines++;
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    
    return lines;
  };

  // 辅助函数：绘制自动换行文本并返回行数
  const wrapTextForCanvas = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let lines = 0;
    
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
    return lines + 1;
  };

  // 辅助函数：绘制自动换行文本
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, currentY);
  };

  const confirmSendPostcard = async () => {
    setIsSending(true);
    setSendStatus('');
    
    try {
      const postcardData = {
        senderId: 'user-' + Date.now(), // In a real app, this would come from authentication
        imageUrl: `/img_Level${level}/${imageId}.png`,
        feedbackText: JSON.stringify(feedback),
        postalCode
      };

      // Check if browser is offline
      if (!navigator.onLine) {
        throw new Error('network');
      }

      const response = await sendPostcard(postcardData);

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

  // 定义文本内容
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        back: '返回',
        save: isSaved ? '已保存' : '保存明信片',
        send: '发送明信片',
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
        back: 'Back',
        save: isSaved ? 'Saved' : 'Save Postcard',
        send: 'Send Postcard',
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
                  <li>检查您的互联网连接并重试</li>
                  <li>返回上一步并重新生成反馈</li>
                  <li>稍后重试，服务器可能暂时不可用</li>
                </>
              ) : (
                <>
                  <li>Check your internet connection and try again</li>
                  <li>Go back and regenerate the feedback</li>
                  <li>Try again later, the server may be temporarily unavailable</li>
                </>
              )}
            </ul>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg text-left mb-6 max-w-lg mx-auto">
            <p className="text-red-700 font-medium">
              {selectedLanguage === 'zh' ? '错误详情:' : 'Error details:'}
            </p>
            <p className="text-red-600 mt-2 break-words">{error}</p>
          </div>
          
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
          >
            {textContent.back}
          </button>
        </div>
      </div>
    );
  }

  if (!localFeedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-2xl w-full">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {selectedLanguage === 'zh' ? '未找到反馈数据' : 'No feedback data found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {selectedLanguage === 'zh' 
              ? '抱歉，我们无法找到反馈数据。' 
              : 'Sorry, we couldn\'t find any feedback data.'}
          </p>
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg"
          >
            {textContent.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" ref={postcardRef}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-lg flex items-center"
          >
            ← {textContent.back}
          </button>
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`font-medium py-2 px-6 rounded-lg flex items-center ${
                isSaved
                  ? 'bg-green-500 text-white cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSaved ? '✓ ' : ''}{textContent.save}
            </button>
            <button
              onClick={handleSendPostcard}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-lg flex items-center"
            >
              📬 {textContent.send}
            </button>
          </div>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50">
            {saveMessage}
          </div>
        )}

        {/* Send status messages */}
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

        {/* 发送确认模态框 */}
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

        {/* 预览模态框 */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
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

        {/* Postcard */}
        <div className="bg-[#F5F5F5] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden">
          {/* Postcard header with postal code and stamp */}
          <div className="relative p-8">
            {/* Postal code in top-left corner */}
            <div className="absolute top-6 left-6 bg-white px-4 py-2 rounded border border-gray-300">
              <div className="text-xs font-bold text-gray-700">{textContent.postalCode}</div>
              <div className="text-base font-mono">{postalCode}</div>
            </div>
            
            {/* Stamp in top-right corner */}
            <div className="absolute top-6 right-6 w-32 h-36">
              <img 
                src="/img_post/img_post_01.png" 
                alt="Stamp" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Image Section */}
            <div className="flex items-center justify-center">
              <img
                src={`/img_Level${level}/${imageId}.png`}
                alt={selectedLanguage === 'zh' ? '对话图片' : 'Conversation image'}
                className="max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  // Try fallback to default img folder if level-specific image not found
                  if (!e.target.src.includes('/img/')) {
                    e.target.src = `/img/${imageId}.png`;
                  } else {
                    // If default image also not found, show placeholder
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                  }
                }}
              />
            </div>

            {/* Right Column - Feedback */}
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-300">
                {textContent.feedback}
              </h2>

              {/* Encouraging Remarks */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                  💬 {textContent.encouragingRemarks}
                </h3>
                <p className="text-green-700 whitespace-pre-line text-lg">{localFeedback.encouragingRemarks}</p>
              </div>

              {/* Error Summary */}
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <h3 className="text-xl font-semibold text-amber-800 mb-4 flex items-center">
                  ❗ {textContent.errorSummary}
                </h3>
                <pre className="text-amber-700 whitespace-pre-line font-sans text-lg">{localFeedback.errorSummary}</pre>
              </div>

              {/* Suggestions */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                  💡 {textContent.suggestions}
                </h3>
                <pre className="text-blue-700 whitespace-pre-line font-sans text-lg">{localFeedback.suggestions}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPostcard;