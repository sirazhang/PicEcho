import React, { useState, useEffect } from 'react';

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

  // Helper function to check if image exists in a level folder (simulated)
  const checkImageExistsInLevel = (imageId, level) => {
    // In a real implementation, this would check actual file existence
    // For now, we'll use predefined lists based on the folder contents we saw
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
      case 1: return level1Images.includes(imageId);
      case 2: return level2Images.includes(imageId);
      case 3: return level3Images.includes(imageId);
      default: return true;
    }
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
    const loadAvailableImages = async () => {
      try {
        // Load image descriptions
        const response = await fetch('/descriptions.json');
        const descriptions = await response.json();
        const allImageIds = Object.keys(descriptions);
        
        // Filter images based on selected level
        let levelImages = [];
        switch (selectedLevel) {
          case 1:
            // Filter images that exist in img_Level1 folder
            levelImages = allImageIds.filter(id => 
              checkImageExistsInLevel(id, 1)
            );
            break;
          case 2:
            // Filter images that exist in img_Level2 folder
            levelImages = allImageIds.filter(id => 
              checkImageExistsInLevel(id, 2)
            );
            break;
          case 3:
            // Filter images that exist in img_Level3 folder
            levelImages = allImageIds.filter(id => 
              checkImageExistsInLevel(id, 3)
            );
            break;
          default:
            levelImages = allImageIds;
        }
        
        setAvailableImages(levelImages);
      } catch (error) {
        console.error('Error loading image descriptions:', error);
        // Fallback to hardcoded list if fetch fails
        const images = getLevelImages(selectedLevel);
        setAvailableImages(images);
      }
    };

    loadAvailableImages();
  }, [selectedLevel]);

  // Get a random image from the available images based on selected level
  const getRandomImage = () => {
    if (availableImages.length === 0) {
      // Fallback to level-specific images if none loaded
      const images = getLevelImages(selectedLevel);
      const randomIndex = Math.floor(Math.random() * images.length);
      return images[randomIndex];
    }
    
    const randomIndex = Math.floor(Math.random() * availableImages.length);
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
    // Start dialogue immediately when level is selected
    setTimeout(() => {
      const randomImage = getRandomImage();
      onStartDialogue(randomImage, selectedLanguage, level);
    }, 300);
  };

  // Define text content for different languages
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        title: 'PicEcho',
        subtitle1: 'Chat with the world, one picture at a time',
        subtitle2: '看图聊天，寄出世界',
        level1: 'Level 1',
        level2: 'Level 2',
        level3: 'Level 3'
      };
    } else {
      return {
        title: 'PicEcho',
        subtitle1: 'Chat with the world, one picture at a time',
        subtitle2: '看图聊天，寄出世界',
        level1: 'Level 1',
        level2: 'Level 2',
        level3: 'Level 3'
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