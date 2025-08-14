import React, { useState, useEffect } from 'react';

const HomeScreen = ({ onStartDialogue, onOpenMapReview }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [availableImages, setAvailableImages] = useState([]);

  // Load saved language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  // Load available images from descriptions.json
  useEffect(() => {
    const loadAvailableImages = async () => {
      try {
        const response = await fetch('/descriptions.json');
        const descriptions = await response.json();
        const imageIds = Object.keys(descriptions);
        setAvailableImages(imageIds);
      } catch (error) {
        console.error('Error loading image descriptions:', error);
        // Fallback to hardcoded list if fetch fails (now includes all 26 images)
        const images = Array.from({length: 26}, (_, i) => `img_${String(i+1).padStart(2, '0')}`);
        setAvailableImages(images);
      }
    };

    loadAvailableImages();
  }, []);

  // Get a random image from the available images
  const getRandomImage = () => {
    if (availableImages.length === 0) {
      // Fallback if images haven't loaded yet (now includes all 26 images)
      const images = Array.from({length: 26}, (_, i) => `img_${String(i+1).padStart(2, '0')}`);
      const randomIndex = Math.floor(Math.random() * images.length);
      return images[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    return availableImages[randomIndex];
  };

  const handleStart = () => {
    const randomImage = getRandomImage();
    onStartDialogue(randomImage, selectedLanguage);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // Save language preference to localStorage
    localStorage.setItem('selectedLanguage', language);
  };

  // Define text content for different languages
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        title: 'ChatPic',
        subtitle: '通过图片对话练习英语口语',
        selectLanguage: '选择语言',
        startDialogue: '开始对话',
        reviewMode: '回顾模式',
        howItWorks: '使用方法',
        step1: '基于图片与AI导师开始对话',
        step2: '用英语回答4个关于图片的问题',
        step3: '获得反馈并提高英语技能',
        step1Number: '1',
        step2Number: '2',
        step3Number: '3'
      };
    } else {
      return {
        title: 'ChatPic',
        subtitle: 'Practice your English speaking skills through image-based conversations',
        selectLanguage: 'Select Language',
        startDialogue: 'Start Dialogue',
        reviewMode: 'Review Mode',
        howItWorks: 'How it works',
        step1: 'Start a conversation with an AI tutor based on an image',
        step2: 'Answer 4 questions about the image in English',
        step3: 'Get feedback and improve your English skills',
        step1Number: '1',
        step2Number: '2',
        step3Number: '3'
      };
    }
  };

  const textContent = getTextContent();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">{textContent.title}</h1>
        <p className="text-lg text-gray-600 mb-10">
          {textContent.subtitle}
        </p>
        
        {/* Language Selection Component */}
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">{textContent.selectLanguage}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleLanguageChange('zh')}
              className={`flex items-center justify-center px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none ${
                selectedLanguage === 'zh'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ minWidth: '140px' }}
            >
              <span className="mr-2 text-2xl">🇨🇳</span>
              <span>中文</span>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center justify-center px-6 py-3 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 focus:outline-none ${
                selectedLanguage === 'en'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ minWidth: '140px' }}
            >
              <span className="mr-2 text-2xl">🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={handleStart}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {textContent.startDialogue}
          </button>
          <button
            onClick={onOpenMapReview}
            className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            {textContent.reviewMode}
          </button>
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{textContent.howItWorks}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-500 font-bold text-2xl mb-2">{textContent.step1Number}</div>
              <p className="text-gray-700">{textContent.step1}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-indigo-500 font-bold text-2xl mb-2">{textContent.step2Number}</div>
              <p className="text-gray-700">{textContent.step2}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-500 font-bold text-2xl mb-2">{textContent.step3Number}</div>
              <p className="text-gray-700">{textContent.step3}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;