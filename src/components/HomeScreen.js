import React, { useState, useEffect } from 'react';

// 工具函数：生成图片路径
const getImagePath = (level, imageId) => {
  return `/img_Level${level}/${imageId}.png`;
};

const HomeScreen = ({ onStartDialogue, onOpenMapReview }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [availableImages, setAvailableImages] = useState([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Load saved language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  // Check if an image exists in a specific level
  const checkImageExistsInLevel = (imageId, level) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log(`Image exists: ${getImagePath(level, imageId)}`);
        resolve(true);
      };
      img.onerror = () => {
        console.log(`Image does not exist: ${getImagePath(level, imageId)}`);
        resolve(false);
      };
      img.src = getImagePath(level, imageId);
    });
  };

  // Helper function to get images for a specific level (fallback)
  const getLevelImages = (level) => {
    const level1Images = [
      'img_01', 'img_02', 'img_03', 'img_04', 'img_05', 'img_06', 'img_07', 'img_08', 
      'img_09', 'img_10', 'img_11', 'img_12', 'img_13', 'img_14', 'img_16', 'img_17', 
      'img_20', 'img_23', 'img_29', 'img_30', 'img_31', 'img_33', 'img_34', 'img_40', 
      'img_41', 'img_47', 'img_48', 'img_51'
    ];
    
    const level2Images = [
      'img_15', 'img_18', 'img_19', 'img_21', 'img_22', 'img_32', 'img_35', 'img_36', 
      'img_37', 'img_38', 'img_39', 'img_42', 'img_43', 'img_44', 'img_45', 'img_46', 
      'img_49', 'img_50'
    ];
    
    const level3Images = [
      'img_24', 'img_25', 'img_26', 'img_27', 'img_28', 'img_52'
    ];
    
    switch (level) {
      case 1: return level1Images;
      case 2: return level2Images;
      case 3: return level3Images;
      default: return level1Images;
    }
  };

  // Load available images based on selected level
  useEffect(() => {
    console.log('useEffect triggered. Selected level:', selectedLevel);
    
    const loadAvailableImages = async () => {
      try {
        // Load image descriptions from the appropriate level file
        const response = await fetch(`/descriptions_level${selectedLevel}.json`);
        const descriptions = await response.json();
        const allImageIds = Object.keys(descriptions);
        
        console.log('Loaded descriptions for level', selectedLevel, ':', allImageIds);
        
        // Filter images based on selected level
        let levelImages = [];
        switch (selectedLevel) {
          case 1:
            // Filter images that exist in img_Level1 folder
            const level1Checks = allImageIds.map(id => checkImageExistsInLevel(id, 1));
            const level1Results = await Promise.all(level1Checks);
            levelImages = allImageIds.filter((id, index) => level1Results[index]);
            break;
          case 2:
            // Filter images that exist in img_Level2 folder
            const level2Checks = allImageIds.map(id => checkImageExistsInLevel(id, 2));
            const level2Results = await Promise.all(level2Checks);
            levelImages = allImageIds.filter((id, index) => level2Results[index]);
            break;
          case 3:
            // Filter images that exist in img_Level3 folder
            const level3Checks = allImageIds.map(id => checkImageExistsInLevel(id, 3));
            const level3Results = await Promise.all(level3Checks);
            levelImages = allImageIds.filter((id, index) => level3Results[index]);
            break;
          default:
            levelImages = allImageIds;
        }
        
        console.log('Level', selectedLevel, 'images:', levelImages); // 添加日志以便调试
        setAvailableImages(levelImages);
      } catch (error) {
        console.error('Error loading image descriptions:', error);
        // Fallback to hardcoded list if fetch fails
        const images = getLevelImages(selectedLevel);
        console.log('Using fallback images for level', selectedLevel, ':', images); // 添加日志以便调试
        setAvailableImages(images);
      }
    };

    loadAvailableImages();
  }, [selectedLevel]);

  // Get a random image from the available images based on selected level
  const getRandomImage = () => {
    console.log('getRandomImage called. Available images:', availableImages, 'Selected level:', selectedLevel);
    
    if (availableImages.length === 0) {
      // Fallback to level-specific images if none loaded
      const images = getLevelImages(selectedLevel);
      if (images.length > 0) {
        const randomIndex = Math.floor(Math.random() * images.length);
        console.log('Using fallback images for level', selectedLevel, 'selected image:', images[randomIndex]);
        return images[randomIndex];
      } else {
        // 最后的后备选项
        console.log('No images found for level', selectedLevel, 'using default img_01');
        return 'img_01';
      }
    }
    
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    console.log('Using available images for level', selectedLevel, 'selected image:', availableImages[randomIndex]);
    return availableImages[randomIndex];
  };

  const handleStart = () => {
    const randomImage = getRandomImage();
    onStartDialogue(randomImage, selectedLanguage, selectedLevel);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // Save language preference to localStorage
    localStorage.setItem('selectedLanguage', language);
    setShowLanguageDropdown(false);
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    // Save level to localStorage
    localStorage.setItem('selectedLevel', level);
    // Start dialogue immediately when level is selected
    setTimeout(() => {
      const randomImage = getRandomImage();
      console.log('Starting dialogue with level:', level, 'image:', randomImage); // 添加日志以便调试
      onStartDialogue(randomImage, selectedLanguage, level);
    }, 300);
  };

  // Define text content for different languages
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        title: 'PicEcho',
        subtitle: '看图聊天，寄出世界',
        start: '开始',
        level1: 'Level 1',
        level2: 'Level 2',
        level3: 'Level 3',
        language: 'Language',
        english: 'English',
        chinese: '中文',
        viewMap: '查看地图',
        placeholder: '选择语言'
      };
    } else {
      return {
        title: 'PicEcho',
        subtitle: 'Chat with the world, one picture at a time',
        start: 'Start',
        level1: 'Level 1',
        level2: 'Level 2',
        level3: 'Level 3',
        language: 'Language',
        english: 'English',
        chinese: 'Chinese',
        viewMap: 'View Map',
        placeholder: 'Select Language'
      };
    }
  };

  const textContent = getTextContent();

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen p-4 relative"
      style={{
        backgroundImage: "url('/design/background_01.svg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Language Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg"
          style={{ 
            backgroundColor: '#003153',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          Language
        </button>
        
        {showLanguageDropdown && (
          <div className="absolute mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                onClick={() => handleLanguageChange('en')}
                className="flex items-center w-full px-4 py-2 text-base font-inter font-bold text-left hover:bg-gray-100 rounded-lg"
                style={{ 
                  backgroundColor: '#faf6e8',
                  color: 'black',
                  minHeight: '40px'
                }}
              >
                <span className="mr-2">🇺🇸</span>
                <span className="w-full text-center">English</span>
              </button>
              <button
                onClick={() => handleLanguageChange('zh')}
                className="flex items-center w-full px-4 py-2 text-base font-inter font-bold text-left hover:bg-gray-100 rounded-lg"
                style={{ 
                  backgroundColor: '#faf6e8',
                  color: 'black',
                  minHeight: '40px'
                }}
              >
                <span className="mr-2">🇨🇳</span>
                <span className="w-full text-center">中文</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Review Button - Top Right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={onOpenMapReview}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg"
          style={{ 
            backgroundColor: '#4bc1eb',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {selectedLanguage === 'zh' ? '回顾' : 'Review'}
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col items-center justify-start flex-grow pt-12">
        <div className="flex flex-col items-center justify-center">
          {/* Logo with Earth replacing 'o' */}
          <div className="relative mb-4 flex items-center justify-center">
            <h1 className="text-10xl font-gloria-hallelujah text-center inline-block">
              PicEch
            </h1>
            <div className="inline-block relative" style={{ width: '240px', height: '240px', marginLeft: '-45px', marginRight: '-45px' }}>
              <img 
                src="/design/earth.png" 
                alt="Earth" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          {/* Subtitle - Centered */}
          <div className="text-xl font-roboto text-center mb-6 leading-relaxed">
            <div style={{ display: 'block' }}>{textContent.subtitle1}</div>
            <div style={{ display: 'block' }}>{textContent.subtitle2}</div>
          </div>
          
          {/* Level Buttons - Centered */}
          <div className="flex gap-8 mt-4">
            <button
              onClick={() => handleLevelChange(1)}
              className={`px-6 py-4 text-2xl font-inter font-bold focus:outline-none transform hover:scale-105 transition-transform rounded-lg ${
                selectedLevel === 1 ? 'ring-4 ring-blue-300' : ''
              }`}
              style={{ 
                backgroundColor: '#7ecc8f',
                color: 'white',
                minWidth: '180px',
                minHeight: '70px'
              }}
            >
              {textContent.level1}
            </button>
            <button
              onClick={() => handleLevelChange(2)}
              className={`px-6 py-4 text-2xl font-inter font-bold focus:outline-none transform hover:scale-105 transition-transform rounded-lg ${
                selectedLevel === 2 ? 'ring-4 ring-blue-300' : ''
              }`}
              style={{ 
                backgroundColor: '#558e23',
                color: 'white',
                minWidth: '180px',
                minHeight: '70px'
              }}
            >
              {textContent.level2}
            </button>
            <button
              onClick={() => handleLevelChange(3)}
              className={`px-6 py-4 text-2xl font-inter font-bold focus:outline-none transform hover:scale-105 transition-transform rounded-lg ${
                selectedLevel === 3 ? 'ring-4 ring-blue-300' : ''
              }`}
              style={{ 
                backgroundColor: '#337d2f',
                color: 'white',
                minWidth: '180px',
                minHeight: '70px'
              }}
            >
              {textContent.level3}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;