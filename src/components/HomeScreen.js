import React, { useState, useEffect } from 'react';

// 定义背景图片资源
const BACKGROUND_IMAGES = [
  '/design/background1.png',
  '/design/background2.png',
  '/design/background3.png',
  '/design/background4.png'
];

// 获取随机背景图片路径
const getRandomBackground = () => {
  const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
  return BACKGROUND_IMAGES[randomIndex];
};

// 工具函数：生成图片路径
const getImagePath = (level, imageId) => {
  return `/Level${level}/${imageId}.png`;
};

const HomeScreen = ({ onStartDialogue, onOpenMapReview, selectedLanguage, setSelectedLanguage }) => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [availableImages, setAvailableImages] = useState([]);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/design/background1.png');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // true for login, false for signup
  const [authForm, setAuthForm] = useState({
    email: '',
    nickname: '',
    password: ''
  });

  // Load saved language preference from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, [setSelectedLanguage]);

  // Set random background on component mount
  useEffect(() => {
    const randomBackground = getRandomBackground();
    setBackgroundImage(randomBackground);
    
    // 创建一个Image对象预加载背景图
    const img = new Image();
    img.src = randomBackground;
    
    // 返回清理函数
    return () => {
      // 可以在这里添加清理逻辑，如取消未完成的请求等
    };
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
    // 这些是每个级别中可用的图片ID列表
    const level1Images = [
      'img_01', 'img_02', 'img_03', 'img_04', 'img_05', 'img_06', 'img_07', 'img_08',
      'img_09', 'img_10', 'img_11', 'img_12', 'img_13', 'img_14', 'img_15', 'img_16'
    ];
    
    const level2Images = [
      'img_01', 'img_02', 'img_03', 'img_04', 'img_05', 'img_06', 'img_07', 'img_08',
      'img_09', 'img_10', 'img_11', 'img_12', 'img_13', 'img_14', 'img_15', 'img_16'
    ];
    
    const level3Images = [
      'img_01', 'img_02', 'img_03', 'img_04', 'img_05', 'img_06'
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
        const response = await fetch(`/Level${selectedLevel}/descriptions.json`);
        const descriptions = await response.json();
        const allImageIds = Object.keys(descriptions);
        
        console.log('Loaded descriptions for level', selectedLevel, ':', allImageIds);
        
        // Filter images based on selected level
        let levelImages = [];
        switch (selectedLevel) {
          case 1:
            // Filter images that exist in Level1 folder
            const level1Checks = allImageIds.map(id => checkImageExistsInLevel(id, 1));
            const level1Results = await Promise.all(level1Checks);
            levelImages = allImageIds.filter((id, index) => level1Results[index]);
            break;
          case 2:
            // Filter images that exist in Level2 folder
            const level2Checks = allImageIds.map(id => checkImageExistsInLevel(id, 2));
            const level2Results = await Promise.all(level2Checks);
            levelImages = allImageIds.filter((id, index) => level2Results[index]);
            break;
          case 3:
            // Filter images that exist in Level3 folder
            const level3Checks = allImageIds.map(id => checkImageExistsInLevel(id, 3));
            const level3Results = await Promise.all(level3Checks);
            levelImages = allImageIds.filter((id, index) => level3Results[index]);
            break;
          default:
            levelImages = allImageIds;
        }
        
        console.log('Level', selectedLevel, 'images:', levelImages);
        setAvailableImages(levelImages);
      } catch (error) {
        console.error('Error loading image descriptions:', error);
        // Fallback to hardcoded list if fetch fails
        const images = getLevelImages(selectedLevel);
        console.log('Using fallback images for level', selectedLevel, ':', images);
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

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
    // Save level to localStorage
    localStorage.setItem('selectedLevel', level);
    // Start dialogue immediately when level is selected
    setTimeout(() => {
      const randomImage = getRandomImage();
      console.log('Starting dialogue with level:', level, 'image:', randomImage);
      onStartDialogue(randomImage, selectedLanguage, level);
    }, 300);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // Save language preference to localStorage
    localStorage.setItem('selectedLanguage', language);
    setShowLanguageDropdown(false);
  };

  // Handle authentication form input changes
  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle authentication form submission
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isLoginMode) {
      // Login logic
      console.log('Login with:', authForm);
      // 这里应该调用登录API
      // 为了演示目的，我们直接关闭模态框
      setShowAuthModal(false);
      setAuthForm({ email: '', nickname: '', password: '' });
    } else {
      // Signup logic
      console.log('Signup with:', authForm);
      // 这里应该调用注册API
      // 为了演示目的，我们直接关闭模态框
      setShowAuthModal(false);
      setAuthForm({ email: '', nickname: '', password: '' });
    }
  };

  // Handle guest mode (直接开始体验)
  const handleGuestMode = () => {
    // 直接开始对话，无需登录
    const randomImage = getRandomImage();
    onStartDialogue(randomImage, selectedLanguage, selectedLevel);
  };

  // Switch between login and signup modes
  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode);
    setAuthForm({ email: '', nickname: '', password: '' });
  };

  return (
    <div 
      className="min-h-screen flex flex-col relative"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', // 防止滚动时背景移动
        transition: 'background-image 0.5s ease-in-out' // 添加背景切换动画
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-0">
        {/* 登录/注册按钮在左上角 */}
        <div className="absolute top-6 left-6">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 bg-white rounded-lg font-inter font-bold text-base focus:outline-none flex items-center shadow-lg"
            style={{ 
              border: '2px solid #003153',
              color: '#003153'
            }}
          >
            {selectedLanguage === 'zh' ? '注册/登录' : 'Sign Up / Login'}
          </button>
        </div>

        {/* Language Selector at top right */}
        <div className="absolute top-6 right-6">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="px-4 py-2 bg-white rounded-lg font-inter font-bold text-base focus:outline-none flex items-center shadow-lg"
              style={{ 
                border: '2px solid #003153',
                color: '#003153'
              }}
            >
              🌐
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {showLanguageDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10" style={{ border: '2px solid #003153' }}>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <span className="mr-2">🇺🇸</span>
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <span className="mr-2">🇨🇳</span>
                  中文
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center text-center" style={{ transform: 'translateY(-10px)' }}>
          {/* PicEcho Title with Earth Overlay */}
          <div className="relative mb-2 flex items-center justify-center">
            <h1 className="text-10xl font-gloria-hallelujah text-gray-800 relative flex items-center">
              PicEch
              <span className="relative inline-block" style={{ width: '1.3em', height: '1.3em' }}>
                <span className="opacity-0">o</span>
                <img 
                  src="/design/earth.png" 
                  alt="Earth" 
                  className="absolute inset-0 w-full h-full object-contain earth-animation"
                  style={{ transform: 'translate(-20%, 5%)', zIndex: 10 }}
                />
              </span>
            </h1>
          </div>

          {/* Subtitle - English and Chinese on separate lines */}
          <div className="text-xl font-inter text-black mb-6 max-w-2xl">
            {selectedLanguage === 'zh' ? (
              <>
                <p className="mb-1">看图聊天，寄出世界</p>
                <p>Chat with the world, one picture at a time.</p>
              </>
            ) : (
              <>
                <p className="mb-1">Chat with the world, one picture at a time.</p>
                <p>看图聊天，寄出世界</p>
              </>
            )}
          </div>

          {/* Level Buttons */}
          <div className="flex flex-wrap justify-center gap-8 mt-2">
            <button
              className="px-8 py-4 rounded-lg font-inter font-bold text-2xl text-white focus:outline-none shadow-lg transform transition duration-300 hover:scale-110"
              style={{ backgroundColor: '#7ecc8f' }}
              onClick={() => handleLevelChange(1)}
            >
              {selectedLanguage === 'zh' ? '等级 1' : 'Level 1'}
            </button>
            
            <button
              className="px-8 py-4 rounded-lg font-inter font-bold text-2xl text-white focus:outline-none shadow-lg transform transition duration-300 hover:scale-110"
              style={{ backgroundColor: '#558e23' }}
              onClick={() => handleLevelChange(2)}
            >
              {selectedLanguage === 'zh' ? '等级 2' : 'Level 2'}
            </button>
            
            <button
              className="px-8 py-4 rounded-lg font-inter font-bold text-2xl text-white focus:outline-none shadow-lg transform transition duration-300 hover:scale-110"
              style={{ backgroundColor: '#337d2f' }}
              onClick={() => handleLevelChange(3)}
            >
              {selectedLanguage === 'zh' ? '等级 3' : 'Level 3'}
            </button>
          </div>
        </div>
        
        {/* View Map and Language Selector in top right corner */}
        <div className="absolute top-6 right-6 flex space-x-2">
          {/* View Map button */}
          <div className="mr-2">
            <button
              onClick={onOpenMapReview}
              className="px-4 py-2 rounded-lg font-inter font-bold text-base focus:outline-none flex items-center justify-center shadow-lg"
              style={{ 
                backgroundColor: '#3fbdc7',
                color: 'white'
              }}
            >
              {selectedLanguage === 'zh' ? '查看地图' : 'View Map'}
            </button>
          </div>
          
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="px-4 py-2 bg-white rounded-lg font-inter font-bold text-base focus:outline-none flex items-center shadow-lg"
              style={{ 
                border: '2px solid #003153',
                color: '#003153'
              }}
            >
              🌐
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {showLanguageDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10" style={{ border: '2px solid #003153' }}>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <span className="mr-2">🇺🇸</span>
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('zh')}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <span className="mr-2">🇨🇳</span>
                  中文
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
        
        {/* Authentication Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {isLoginMode 
                    ? (selectedLanguage === 'zh' ? '用户登录' : 'User Login') 
                    : (selectedLanguage === 'zh' ? '用户注册' : 'User Signup')}
                </h2>
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleAuthSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    {selectedLanguage === 'zh' ? '邮箱' : 'Email'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={authForm.email}
                    onChange={handleAuthInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                {!isLoginMode && (
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">
                      {selectedLanguage === 'zh' ? '昵称' : 'Nickname'}
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      name="nickname"
                      value={authForm.nickname}
                      onChange={handleAuthInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!isLoginMode}
                    />
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                    {selectedLanguage === 'zh' ? '密码' : 'Password'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={authForm.password}
                    onChange={handleAuthInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    {isLoginMode 
                      ? (selectedLanguage === 'zh' ? '登录' : 'Login') 
                      : (selectedLanguage === 'zh' ? '注册' : 'Sign Up')}
                  </button>
                </div>
                
                {/* Third-party login options */}
                <div className="mb-4">
                  <p className="text-center text-gray-600 mb-2">
                    {selectedLanguage === 'zh' ? '或使用第三方登录' : 'Or login with'}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      type="button"
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Google
                    </button>
                    <button
                      type="button"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Facebook
                    </button>
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleAuthMode}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    {isLoginMode 
                      ? (selectedLanguage === 'zh' ? '没有账户？注册' : 'No account? Sign Up') 
                      : (selectedLanguage === 'zh' ? '已有账户？登录' : 'Have an account? Login')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Add global styles for the earth animation */}
        <style jsx>{`
          @keyframes rotate {
            from {
              transform: translate(-20%, 5%) rotate(0deg);
            }
            to {
              transform: translate(-20%, 5%) rotate(360deg);
            }
          }
          
          .earth-animation {
            animation: rotate 20s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default HomeScreen;