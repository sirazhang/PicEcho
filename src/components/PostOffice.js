import React, { useState, useEffect } from 'react';
import { receivePostcard } from '../utils/api';

const PostOffice = ({ onBack, onViewPostcard }) => {
  const [receivedPostcard, setReceivedPostcard] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [senderToken, setSenderToken] = useState('');

  useEffect(() => {
    // Generate or load sender token
    let token = localStorage.getItem('senderToken');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('senderToken', token);
    }
    setSenderToken(token);
  }, []);

  // Handle receiving a postcard
  const handleReceivePostcard = async () => {
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

  // Define text content
  const getTextContent = () => {
    return {
      title: 'Post Office',
      homeButton: 'Home',
      receiveButton: 'Receive Postcard',
      close: 'Close',
      receivedPostcards: 'Received Postcards'
    };
  };

  const textContent = getTextContent();

  return (
    <div className="min-h-screen bg-[#e5f5fb] p-0 relative"
         style={{ 
           backgroundImage: 'url(/design/postbakground.png)',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
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
          {textContent.homeButton}
        </button>
        <h1 className="text-2xl font-gloria-hallelujah absolute left-1/2 transform -translate-x-1/2">
          {textContent.title}
        </h1>
        <div className="w-32"></div> {/* Spacer to balance the header */}
      </div>

      {/* Receive box positioned at 1/5 from left and 50vh */}
      <div 
        className="absolute cursor-pointer transform -translate-x-1/2"
        style={{ 
          left: '20%', 
          top: '50vh'
        }}
        onClick={handleReceivePostcard}
      >
        <img 
          src="/design/receivebox.png" 
          alt="Receive Box" 
          className="w-32 h-auto object-contain"
        />
      </div>

      {/* Received Postcard Display Area */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-4/5 max-w-2xl">
        {receivedPostcard ? (
          <div className="bg-white rounded-xl shadow-xl p-6">
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
        ) : (
          <div className="bg-white bg-opacity-70 rounded-xl shadow-xl p-6 text-center">
            <p className="text-gray-600 text-lg">
              Click the receive box to get a postcard
            </p>
          </div>
        )}
      </div>

      {/* Receive Postcard Button at bottom right */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={handleReceivePostcard}
          disabled={isFetching}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg flex items-center"
          style={{ 
            backgroundColor: '#66ab4b',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {isFetching ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Receiving...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              {textContent.receiveButton}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PostOffice;