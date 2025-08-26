import React, { useState, useEffect, useRef } from 'react';

const Community = ({ onBack, onNavigateToPostOffice, onNavigateToRanking, selectedLanguage }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const audioRef = useRef(null);

  // Play background music when component mounts
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/music.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    // Play the audio
    const playAudio = async () => {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.log('Audio play failed:', error);
      }
    };
    
    playAudio();
    
    // Cleanup function to stop audio when component unmounts
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Define text content based on selected language
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        homeButton: '主页',
        title: '社区',
        postOffice: '邮局',
        snowMountain: '雪山',
        cat: '猫',
        bird: '鸟'
      };
    } else if (selectedLanguage === 'es') {
      return {
        homeButton: 'Inicio',
        title: 'Comunidad',
        postOffice: 'Oficina de Correos',
        snowMountain: 'Montaña Nevada',
        cat: 'Gato',
        bird: 'Pájaro'
      };
    } else if (selectedLanguage === 'fr') {
      return {
        homeButton: 'Accueil',
        title: 'Communauté',
        postOffice: 'Bureau de Poste',
        snowMountain: 'Montagne Enneigée',
        cat: 'Chat',
        bird: 'Oiseau'
      };
    } else {
      return {
        homeButton: 'Home',
        title: 'Community',
        postOffice: 'Post Office',
        snowMountain: 'Snow Mountain',
        cat: 'Cat',
        bird: 'Bird'
      };
    }
  };

  const textContent = getTextContent();

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ 
      backgroundImage: "url('/design/communitybackground.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Header with home button */}
      <div className="flex justify-between items-center p-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg"
          style={{ 
            backgroundColor: '#003153',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {textContent.homeButton}
        </button>
        <div className="w-32"></div> {/* Spacer for balance */}
      </div>

      {/* Main content with interactive elements */}
      <div className="relative" style={{ height: '80vh' }}>
        {/* Post Office element with glow effect */}
        <div 
          className="absolute cursor-pointer transform hover:scale-110 transition-transform duration-150"
          style={{ 
            top: '62%', 
            left: '78%',
            width: '360px',
            height: '360px'
          }}
          onClick={onNavigateToPostOffice}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-yellow-200 filter blur-xl opacity-30 animate-pulse"></div>
            <img 
              src="/design/postoffice.png" 
              alt={textContent.postOffice} 
              className="relative w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Bird element with floating animation */}
        <div 
          className="absolute"
          style={{ 
            top: '25%', 
            left: '88%',
            width: '120px',
            height: '120px'
          }}
        >
          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            
            .bird-float {
              animation: float 3s infinite ease-in-out;
            }
          `}</style>
          <img 
            src="/design/bird.png" 
            alt={textContent.bird} 
            className="w-full h-full object-contain bird-float"
          />
        </div>

        {/* Snow Mountain 1 with glow and shadow effects */}
        <div 
          className="absolute cursor-pointer transform hover:scale-110 transition-transform duration-150"
          style={{ 
            top: '1%', 
            left: '30%',
            width: '350px',
            height: '350px'
          }}
          onClick={onNavigateToRanking}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-100 filter blur-xl opacity-50"></div>
            <div className="absolute top-4 left-4 w-full h-full bg-gray-300 filter blur-2xl opacity-10"></div>
            <img 
              src="/design/snow1.png" 
              alt={textContent.snowMountain} 
              className="relative w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Snow Mountain 2 with glow and shadow effects */}
        <div 
          className="absolute cursor-pointer transform hover:scale-110 transition-transform duration-150"
          style={{ 
            top: '3%', 
            left: '32%',
            width: '350px',
            height: '350px'
          }}
          onClick={onNavigateToRanking}
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-blue-100 filter blur-xl opacity-50"></div>
            <div className="absolute top-4 left-4 w-full h-full bg-gray-800 filter blur-2xl opacity-20"></div>
            <img 
              src="/design/snow2.png" 
              alt={textContent.snowMountain} 
              className="relative w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Cat element with jump animation */}
        <div 
          className="absolute"
          style={{ 
            top: '50%', 
            left: '30%',
            width: '100px',
            height: '100px'
          }}
        >
          <style jsx>{`
            @keyframes jump {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            
            .cat-jump {
              animation: jump 2s infinite ease-in-out;
            }
          `}</style>
          <img 
            src="/design/cat.png" 
            alt={textContent.cat} 
            className="w-full h-full object-contain cat-jump"
          />
        </div>
      </div>

      {/* Feature modal */}
      {activeFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {activeFeature === 'inbox' ? 'Inbox' : 'Outbox'}
              </h2>
              <button 
                onClick={() => setActiveFeature(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center py-8">
              {activeFeature === 'inbox' ? (
                <div>
                  <p className="mb-4">{selectedLanguage === 'zh' ? '查看您收到的明信片！' : selectedLanguage === 'es' ? '¡Revisa tus postales recibidas!' : selectedLanguage === 'fr' ? 'Consultez vos cartes postales reçues !' : 'Check your received postcards!'}</p>
                  <button
                    onClick={() => {
                      setActiveFeature(null);
                      onNavigateToPostOffice();
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {selectedLanguage === 'zh' ? '前往邮局' : selectedLanguage === 'es' ? 'Ir a la Oficina de Correos' : selectedLanguage === 'fr' ? 'Aller au Bureau de Poste' : 'Go to Post Office'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-4">{selectedLanguage === 'zh' ? '发送您的明信片给其他人！' : selectedLanguage === 'es' ? '¡Envía tus postales a otros!' : selectedLanguage === 'fr' ? 'Envoyez vos cartes postales aux autres !' : 'Send your postcards to others!'}</p>
                  <button
                    onClick={() => {
                      setActiveFeature(null);
                      onNavigateToPostOffice();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    {selectedLanguage === 'zh' ? '前往邮局' : selectedLanguage === 'es' ? 'Ir a la Oficina de Correos' : selectedLanguage === 'fr' ? 'Aller au Bureau de Poste' : 'Go to Post Office'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;