import React, { useState, useEffect } from 'react';

const Community = ({ onBack, onNavigateToPostOffice, onNavigateToRanking }) => {
  const [activeFeature, setActiveFeature] = useState(null);

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
          Home
        </button>
        <div className="w-32"></div> {/* Spacer for balance */}
      </div>

      {/* Main content with interactive elements */}
      <div className="relative" style={{ height: '80vh' }}>
        {/* Post Office element */}
        <div 
          className="absolute cursor-pointer transform hover:scale-105 transition-transform duration-200"
          style={{ 
            top: '62%', 
            left: '78%',
            width: '360px',
            height: '360px'
          }}
          onClick={onNavigateToPostOffice}
        >
          <img 
            src="/design/postoffice.png" 
            alt="Post Office" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Bird element */}
        <div 
          className="absolute"
          style={{ 
            top: '25%', 
            left: '88%',
            width: '120px',
            height: '120px'
          }}
        >
          <img 
            src="/design/bird.png" 
            alt="Bird" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Snow Mountain 1 */}
        <div 
          className="absolute cursor-pointer transform hover:scale-105 transition-transform duration-200"
          style={{ 
            top: '1%', 
            left: '30%',
            width: '350px',
            height: '350px'
          }}
          onClick={onNavigateToRanking}
        >
          <img 
            src="/design/snow1.png" 
            alt="Snow Mountain 1" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Snow Mountain 2 */}
        <div 
          className="absolute cursor-pointer transform hover:scale-105 transition-transform duration-200"
          style={{ 
            top: '3%', 
            left: '32%',
            width: '350px',
            height: '350px'
          }}
          onClick={onNavigateToRanking}
        >
          <img 
            src="/design/snow2.png" 
            alt="Snow Mountain 2" 
            className="w-full h-full object-contain"
          />
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
            alt="Cat" 
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
                  <p className="mb-4">Check your received postcards!</p>
                  <button
                    onClick={() => {
                      setActiveFeature(null);
                      onNavigateToPostOffice();
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go to Post Office
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-4">Send your postcards to others!</p>
                  <button
                    onClick={() => {
                      setActiveFeature(null);
                      onNavigateToPostOffice();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Go to Post Office
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