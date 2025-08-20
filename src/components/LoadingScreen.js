import React, { useEffect, useRef } from 'react';

const LoadingScreen = () => {
  const audioContextRef = useRef(null);
  const nextSoundTimeRef = useRef(0);

  // 创建"咻"的音效
  const createSwooshSound = () => {
    try {
      // 检查浏览器是否支持AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const now = audioContextRef.current.currentTime;
      
      // 控制音效播放频率，避免过于频繁
      if (now < nextSoundTimeRef.current) {
        return;
      }
      
      nextSoundTimeRef.current = now + 1.5; // 至少间隔1.5秒
      
      // 创建音效
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // 设置音调 - 从高到低的滑音效果
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.3);
      
      // 设置音量包络
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      // 播放并清理
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      
      // 清理资源
      oscillator.onended = () => {
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Failed to create swoosh sound:', error);
    }
  };

  // 纸飞机飞过时播放音效
  useEffect(() => {
    // 只在动画开始时播放一次音效
    const timer = setTimeout(() => {
      createSwooshSound();
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  // 用户交互时初始化AudioContext（解决浏览器自动播放限制）
  const handleUserInteraction = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" 
      style={{ 
        backgroundImage: 'url(/design/loading.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
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
      
      <style>{`
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