import React, { useEffect } from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ 
      backgroundImage: 'url(/design/loading.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div 
        className="absolute bottom-10 left-10 w-16 h-16"
        style={{
          animation: 'fly 2s linear infinite'
        }}
      >
        <img 
          src="/design/plane.png" 
          alt="Paper Plane" 
          className="w-full h-full object-contain"
        />
      </div>
      
      <style jsx>{`
        @keyframes fly {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            transform: translate(calc(100vw - 150px), calc(-100vh + 150px)) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;