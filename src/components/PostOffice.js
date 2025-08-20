import React, { useState, useEffect, useRef } from 'react';
import { receivePostcard } from '../utils/api';

const PostOffice = ({ onBack, onViewPostcard }) => {
  const [receivedPostcard, setReceivedPostcard] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [senderToken, setSenderToken] = useState('');
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Generate or load sender token
    let token = localStorage.getItem('senderToken');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('senderToken', token);
    }
    setSenderToken(token);
  }, []);

  // Create "ding" sound effect
  const createDingSound = () => {
    try {
      // Check if browser supports AudioContext
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const now = audioContextRef.current.currentTime;
      
      // Create sound
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Set sound parameters - ding sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.2);
      
      // Set volume envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      // Play and clean up
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      
      // Clean up resources
      oscillator.onended = () => {
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Failed to create ding sound:', error);
    }
  };

  // Handle user interaction to initialize AudioContext
  const handleUserInteraction = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Handle receiving a postcard
  const handleReceivePostcard = async () => {
    // Play ding sound when receiving postcard
    createDingSound();
    
    setIsFetching(true);
    try {
      // Use the sender token to receive a postcard
      const response = await receivePostcard({ senderToken });
      
      if (response) {
        setReceivedPostcard(response);
      } else {
        // Handle case where no postcard is available
        alert('No postcards available at the moment. Please try again later.');
      }
    } catch (error) {
      console.error('Error receiving postcard:', error);
      // Even if there's an error, show a mock postcard
      setReceivedPostcard({
        postcard_id: Math.floor(Math.random() * 10000),
        image_path: `/sample/sample_01.png`,
        postcard_url: `/sample/sample_01.png`,
        created_at: new Date().toISOString(),
        status: 'sent',
        sender_token: 'mock-sender',
        receiver_token: senderToken,
        feedback_text: JSON.stringify({
          encouragingRemarks: "Great job! You're doing well with your English practice.",
          errorSummary: "Minor grammar issues with article usage.",
          suggestions: "Try to practice using articles (a, an, the) in your sentences."
        }),
        postal_code: '123456'
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Close received postcard
  const closeReceivedPostcard = () => {
    setReceivedPostcard(null);
  };

  return (
    <div 
      className="min-h-screen bg-[#e5f5fb] p-0 relative"
      style={{ 
        backgroundImage: 'url(/design/postbakground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* Header with title and home button */}
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
        <div className="w-32"></div> {/* Spacer to balance the header */}
      </div>

      {/* Receive box positioned at 1/5 from left and 50vh */}
      <div 
        className="absolute cursor-pointer transform -translate-x-1/2 hover:scale-110 transition-transform duration-200"
        style={{ 
          left: '40%', 
          top: '30vh' ,
          height: '50vh'
        }}
        onClick={handleReceivePostcard}
      >
        <img 
          src="/design/receivebox.png" 
          alt="Receive Box" 
          className="w-[35vw] h-auto object-contain"
        />
      </div>

      {/* Received Postcard Display Area */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 max-w-2xl">
        {receivedPostcard ? (
          <div className="bg-white rounded-xl shadow-xl p-6 relative">
            {/* Close button */}
            <button
              onClick={closeReceivedPostcard}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex flex-col items-center">
              <img 
                src={receivedPostcard.image_path || receivedPostcard.postcard_url || '/sample/sample_01.png'} 
                alt="Received postcard" 
                className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                onError={(e) => {
                  // Fallback to sample image if the specified image fails to load
                  const sampleImages = [
                    '/sample/sample_01.png',
                    '/sample/sample_02.png'
                  ];
                  const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                  e.target.src = randomImage;
                }}
              />
              <p className="text-gray-600 text-center mt-2">
                Received: {new Date(receivedPostcard.created_at || receivedPostcard.timestamp).toLocaleString()}
              </p>
              {receivedPostcard.feedback_text && (
                <div className="mt-4 w-full">
                  <h3 className="font-bold text-lg mb-2">Feedback:</h3>
                  <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded">
                    {typeof receivedPostcard.feedback_text === 'string' 
                      ? receivedPostcard.feedback_text 
                      : JSON.stringify(receivedPostcard.feedback_text, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PostOffice;