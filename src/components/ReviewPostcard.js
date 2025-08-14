import React, { useState, useEffect, useRef } from 'react';
import { sendPostcard } from '../utils/api';

const ReviewPostcard = ({ imageId, conversationHistory, feedback, onSave, onBack, isLoading, error, selectedLanguage }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [localFeedback, setLocalFeedback] = useState(feedback);
  const [imageDescription, setImageDescription] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [postmark, setPostmark] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(''); // '' | 'success' | 'error'
  const printRef = useRef();

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

  // Generate random postmark
  useEffect(() => {
    const generatePostmark = () => {
      const cities = ['NEW YORK', 'LONDON', 'TOKYO', 'SYDNEY', 'PARIS', 'BERLIN', 'MOSCOW', 'TORONTO'];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const date = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: '2-digit' 
      }).replace(',', '');
      
      return `${randomCity} ${date}`;
    };
    
    setPostmark(generatePostmark());
  }, []);

  // Load image description
  useEffect(() => {
    const loadImageDescription = async () => {
      try {
        const response = await fetch('/descriptions.json');
        const descriptions = await response.json();
        const description = descriptions[imageId] || 'A beautiful image';
        setImageDescription(description);
      } catch (error) {
        console.error('Error loading image description:', error);
        setImageDescription('A beautiful image');
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
      onSave(postcardData);
      setIsSaved(true);
      setSaveMessage(selectedLanguage === 'zh' ? '明信片已保存!' : 'Postcard saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving postcard:', error);
      setSaveMessage(selectedLanguage === 'zh' ? '保存失败，请重试' : 'Failed to save, please try again');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendPostcard = () => {
    setShowSendModal(true);
  };

  const confirmSendPostcard = async () => {
    setIsSending(true);
    setSendStatus('');
    
    try {
      const postcardData = {
        senderId: 'user-' + Date.now(), // In a real app, this would come from authentication
        imageUrl: `/img/${imageId}.png`,
        feedbackText: JSON.stringify(feedback),
        postalCode
      };

      const response = await sendPostcard(postcardData);

      if (response) {
        setSendStatus('success');
        setTimeout(() => {
          setShowSendModal(false);
          setSendStatus('');
        }, 2000);
      } else {
        setSendStatus('error');
      }
    } catch (error) {
      console.error('Error sending postcard:', error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  // Define text content for different languages
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        back: '返回',
        save: isSaved ? '已保存' : '保存明信片',
        print: '打印',
        send: '发送明信片',
        sendConfirm: '您想发送这张明信片与另一位学习者交换吗？',
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
        postmark: '邮戳'
      };
    } else {
      return {
        back: 'Back',
        save: isSaved ? 'Saved' : 'Save Postcard',
        print: 'Print',
        send: 'Send Postcard',
        sendConfirm: 'Do you want to send this postcard and exchange with another learner?',
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
        postmark: 'Postmark'
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
          <p className="text-gray-600 mb-6">{error}</p>
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
    <div className="min-h-screen bg-gray-50 p-4 print:bg-white print:p-0" ref={printRef}>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-postcard {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .postcard-content {
            break-inside: avoid;
          }
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 print:hidden">
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
            <button
              onClick={handlePrint}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-6 rounded-lg flex items-center"
            >
              🖨️ {textContent.print}
            </button>
          </div>
        </div>

        {/* Save message */}
        {saveMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 print:hidden">
            {saveMessage}
          </div>
        )}

        {/* Send status messages */}
        {sendStatus === 'success' && (
          <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 print:hidden">
            {textContent.sendSuccess}
          </div>
        )}
        {sendStatus === 'error' && (
          <div className="fixed top-4 right-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 print:hidden">
            {textContent.sendError}
          </div>
        )}

        {/* Send Confirmation Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
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

        {/* Postcard */}
        <div className="bg-[#F5F5F5] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden print:shadow-none print:rounded-none print-postcard">
          {/* Postcard header with postal code and postmark */}
          <div className="relative p-6">
            {/* Postal code in top-left corner */}
            <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded border border-gray-300 print:border-black">
              <div className="text-xs font-bold text-gray-700">{textContent.postalCode}</div>
              <div className="text-sm font-mono">{postalCode}</div>
            </div>
            
            {/* Postmark in top-right corner */}
            <div className="absolute top-4 right-4 w-20 h-12 border-2 border-red-500 rotate-12 print:border-black">
              <div className="bg-red-500 text-white text-[8px] font-bold p-1 print:bg-white print:text-black">
                {textContent.postmark}
              </div>
              <div className="text-[8px] font-mono p-1 truncate">{postmark}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Image Section */}
            <div className="flex items-center justify-center">
              <img
                src={`/img/${imageId}.png`}
                alt={selectedLanguage === 'zh' ? '对话图片' : 'Conversation image'}
                className="max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                }}
              />
            </div>

            {/* Right Column - Feedback */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                {textContent.feedback}
              </h2>

              {/* Encouraging Remarks */}
              <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                  💬 {textContent.encouragingRemarks}
                </h3>
                <p className="text-green-700 whitespace-pre-line">{localFeedback.encouragingRemarks}</p>
              </div>

              {/* Error Summary */}
              <div className="bg-amber-50 p-5 rounded-lg border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
                  ❗ {textContent.errorSummary}
                </h3>
                <pre className="text-amber-700 whitespace-pre-line font-sans">{localFeedback.errorSummary}</pre>
              </div>

              {/* Suggestions */}
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  💡 {textContent.suggestions}
                </h3>
                <pre className="text-blue-700 whitespace-pre-line font-sans">{localFeedback.suggestions}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPostcard;