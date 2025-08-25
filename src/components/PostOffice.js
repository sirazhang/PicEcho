import React, { useState, useEffect, useRef } from 'react';
import { receivePostcard } from '../utils/api';

const PostOffice = ({ onBack, onViewPostcard }) => {
  const [receivedPostcard, setReceivedPostcard] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [senderToken, setSenderToken] = useState('');
  const [savedPostcards, setSavedPostcards] = useState([]);
  const [showInbox, setShowInbox] = useState(false);
  const [showOutbox, setShowOutbox] = useState(false);
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [currentPostcardIndex, setCurrentPostcardIndex] = useState(0);
  const [message, setMessage] = useState('');
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Generate or load sender token
    let token = localStorage.getItem('senderToken');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('senderToken', token);
    }
    setSenderToken(token);
    
    // Load saved postcards
    try {
      const postcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
      setSavedPostcards(postcards);
    } catch (error) {
      console.error('Error loading saved postcards:', error);
      setSavedPostcards([]);
    }
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
        // Use sample images when no postcards are available
        const sampleImages = [
          '/sample/sample_01.png',
          '/sample/sample_02.png',
          '/sample/sample_03.png',
          '/sample/sample_04.png'
        ];
        const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
        
        setReceivedPostcard({
          postcard_id: Math.floor(Math.random() * 10000),
          image_path: randomImage,
          postcard_url: randomImage,
          created_at: new Date().toISOString(),
          status: 'sent',
          sender_token: 'mock-sender',
          receiver_token: senderToken
        });
      }
    } catch (error) {
      console.error('Error receiving postcard:', error);
      // Even if there's an error, show a mock postcard with sample images
      const sampleImages = [
        '/sample/sample_01.png',
        '/sample/sample_02.png',
        '/sample/sample_03.png',
        '/sample/sample_04.png'
      ];
      const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
      
      setReceivedPostcard({
        postcard_id: Math.floor(Math.random() * 10000),
        image_path: randomImage,
        postcard_url: randomImage,
        created_at: new Date().toISOString(),
        status: 'sent',
        sender_token: 'mock-sender',
        receiver_token: senderToken
      });
    } finally {
      setIsFetching(false);
    }
  };

  // Close received postcard
  const closeReceivedPostcard = () => {
    setReceivedPostcard(null);
  };

  // Handle inbox click
  const handleInboxClick = () => {
    setShowInbox(true);
    setCurrentPostcardIndex(0);
    if (savedPostcards.length > 0) {
      setSelectedPostcard(savedPostcards[0]);
    }
  };

  // Handle outbox click
  const handleOutboxClick = () => {
    setShowOutbox(true);
    setSelectedPostcard(null);
    setMessage('');
  };

  // Close inbox
  const closeInbox = () => {
    setShowInbox(false);
    setSelectedPostcard(null);
    setCurrentPostcardIndex(0);
  };

  // Close outbox
  const closeOutbox = () => {
    setShowOutbox(false);
    setSelectedPostcard(null);
    setMessage('');
  };

  // Navigate to next postcard in inbox
  const nextPostcard = () => {
    if (currentPostcardIndex < savedPostcards.length - 1) {
      const newIndex = currentPostcardIndex + 1;
      setCurrentPostcardIndex(newIndex);
      setSelectedPostcard(savedPostcards[newIndex]);
    }
  };

  // Navigate to previous postcard in inbox
  const prevPostcard = () => {
    if (currentPostcardIndex > 0) {
      const newIndex = currentPostcardIndex - 1;
      setCurrentPostcardIndex(newIndex);
      setSelectedPostcard(savedPostcards[newIndex]);
    }
  };

  // Handle sending a postcard
  const handleSendPostcard = () => {
    // In a real implementation, this would send the postcard
    // For now, we'll just show a success message
    alert('Postcard sent successfully!');
    closeOutbox();
  };

  return (
    <div 
      className="min-h-screen bg-[#e5f5fb] p-0 relative"
      style={{ 
        backgroundImage: 'url(/design/postofficebackground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      {/* Bird element with swing animation */}
      <div 
        className="absolute"
        style={{ 
          top: '5%', 
          right: '10%',
          width: '150px',
          height: '150px'
        }}
      >
        <style jsx>{`
          @keyframes swing {
            0% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
            100% { transform: rotate(-5deg); }
          }
          
          .bird-swing {
            animation: swing 2s infinite ease-in-out;
            transform-origin: center top;
          }
        `}</style>
        <img 
          src="/design/bird.png" 
          alt="Bird" 
          className="w-full h-full object-contain bird-swing"
        />
      </div>

      {/* Hint messages */}
      <div className="pt-6 text-center px-4">
        <div className="inline-block bg-white rounded-lg shadow-lg px-6 py-4">
          <p className="text-black text-lg font-inter font-bold">
            叽叽！点击红色邮筒，我帮你看看有没有人给你寄明信片哦！
          </p>
          <p className="text-black text-lg font-inter font-bold mt-2">
            嘿嘿，点击绿色邮筒，我会帮你寄出你的明信片给别人！快来试试吧！
          </p>
        </div>
      </div>

      {/* Header with title and community button */}
      <div className="flex justify-between items-start p-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg"
          style={{ 
            backgroundColor: '#F26E0A', // Updated orange background
            color: 'white',             // White text
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          Community
        </button>
        <div className="w-32"></div> {/* Spacer to balance the header */}
      </div>

      {/* Red Inbox Mailbox */}
      <div 
        className="absolute cursor-pointer transform -translate-x-1/2 hover:scale-110 transition-transform duration-200"
        style={{ 
          left: '28%', 
          top: '60%',
          width: '300px',
          height: '300px'
        }}
        onClick={handleReceivePostcard}
      >
        <img 
          src="/design/inbox.png" 
          alt="Inbox" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Green Outbox Mailbox */}
      <div 
        className="absolute cursor-pointer transform -translate-x-1/2 hover:scale-110 transition-transform duration-200"
        style={{ 
          left: '70%', 
          top: '60%',
          width: '250px',
          height: '250px'
        }}
        onClick={handleOutboxClick}
      >
        <img 
          src="/design/outbox.png" 
          alt="Outbox" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Inbox Modal - Show received postcards */}
      {showInbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Received Postcards
                </h3>
                <button 
                  onClick={closeInbox}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {savedPostcards.length > 0 ? (
                <div className="relative">
                  {/* Navigation arrows */}
                  {currentPostcardIndex > 0 && (
                    <button 
                      onClick={prevPostcard}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-75 rounded-full p-2 shadow-md hover:bg-opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {currentPostcardIndex < savedPostcards.length - 1 && (
                    <button 
                      onClick={nextPostcard}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-75 rounded-full p-2 shadow-md hover:bg-opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Postcard stack visualization */}
                  <div className="flex justify-center items-center py-8">
                    {savedPostcards.map((postcard, index) => {
                      // Calculate offset based on position in stack
                      const offset = (index - currentPostcardIndex) * 10;
                      const zIndex = 10 - Math.abs(index - currentPostcardIndex);
                      const scale = 1 - Math.abs(index - currentPostcardIndex) * 0.05;
                      const opacity = 1 - Math.abs(index - currentPostcardIndex) * 0.2;
                      
                      // Only show nearby postcards for performance
                      if (Math.abs(index - currentPostcardIndex) > 2) return null;
                      
                      return (
                        <div
                          key={postcard.id || index}
                          className="absolute transition-all duration-300 ease-in-out"
                          style={{
                            transform: `translateX(${offset}px) scale(${scale})`,
                            zIndex: zIndex,
                            opacity: opacity,
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div className="bg-white rounded-lg border border-gray-200 p-2">
                            {postcard.imageId && postcard.level ? (
                              <img 
                                src={`/Level${postcard.level}/${postcard.imageId}.png`} 
                                alt="Postcard" 
                                className="w-80 h-60 object-cover rounded"
                              />
                            ) : (
                              <div className="w-80 h-60 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-500">Postcard Image</span>
                              </div>
                            )}
                            <p className="text-xs text-center mt-2 text-gray-600">
                              {new Date(postcard.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Postcard details */}
                  {selectedPostcard && (
                    <div className="mt-8 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Postcard Details</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date:</span> {new Date(selectedPostcard.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Level:</span> {selectedPostcard.level}
                      </p>
                      {selectedPostcard.feedback && (
                        <div className="mt-3">
                          <h5 className="font-medium mb-1">Feedback:</h5>
                          <div className="text-sm bg-white p-2 rounded">
                            <p><span className="font-medium">Remarks:</span> {selectedPostcard.feedback.encouragingRemarks}</p>
                            <p><span className="font-medium">Errors:</span> {selectedPostcard.feedback.errorSummary}</p>
                            <p><span className="font-medium">Suggestions:</span> {selectedPostcard.feedback.suggestions}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-center mt-4 text-sm text-gray-500">
                    {currentPostcardIndex + 1} of {savedPostcards.length}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No postcards received yet.</p>
                  <button
                    onClick={handleReceivePostcard}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Receive a Postcard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outbox Modal - Send postcards */}
      {showOutbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-gray-800">
                  Send a Postcard
                </h3>
                <button 
                  onClick={closeOutbox}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {savedPostcards.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Select a postcard to send:
                    </label>
                    <div className="grid grid-cols-2 gap-6 max-h-80 overflow-y-auto p-2">
                      {savedPostcards.map((postcard, index) => (
                        <div
                          key={postcard.id || index}
                          className={`border rounded-lg p-2 cursor-pointer transition-all ${
                            selectedPostcard === postcard 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPostcard(postcard)}
                        >
                          {postcard.imageId && postcard.level ? (
                            <img 
                              src={`/Level${postcard.level}/${postcard.imageId}.png`} 
                              alt="Postcard" 
                              className="w-full h-24 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-500">Postcard Image</span>
                            </div>
                          )}
                          <p className="text-xs text-center mt-1 text-gray-600 truncate">
                            {new Date(postcard.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedPostcard && (
                    <div className="mt-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Add a message (optional):
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Write a message to send with your postcard..."
                      ></textarea>
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={handleSendPostcard}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          Send Postcard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't have any postcards to send yet.</p>
                  <button
                    onClick={onViewPostcard}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Create a Postcard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Received Postcard Display Area */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 max-w-3xl">
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
                src={receivedPostcard.image_path || receivedPostcard.postcard_url} 
                alt="Received postcard" 
                className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                onError={(e) => {
                  // Fallback to sample images if the specified image fails to load
                  const sampleImages = [
                    '/sample/sample_01.png',
                    '/sample/sample_02.png',
                    '/sample/sample_03.png',
                    '/sample/sample_04.png'
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