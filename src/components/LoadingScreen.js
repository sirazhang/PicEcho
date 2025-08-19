import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ 
      backgroundImage: 'url(/design/loading.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div 
        className="absolute bottom-0 left-0 w-48 h-48"
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
            transform: translate(0, 0);
          }
          100% {
            transform: translate(calc(100vw - 150px), calc(-100vh + 150px));
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;