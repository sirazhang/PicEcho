import React, { useState, useEffect } from 'react';
import { receivePostcard } from '../utils/api';

const WorldMapReview = ({ onBack, onViewPostcard }) => {
  const [savedPostcards, setSavedPostcards] = useState([]);
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReceivedPostcard, setShowReceivedPostcard] = useState(false);
  const [receivedPostcard, setReceivedPostcard] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [senderToken, setSenderToken] = useState(''); // Add sender token state

  useEffect(() => {
    // Load saved postcards from localStorage
    const postcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
    setSavedPostcards(postcards);
    
    // Generate or load sender token
    let token = localStorage.getItem('senderToken');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('senderToken', token);
    }
    setSenderToken(token);
  }, []);

  // Sample locations for demonstration
  const sampleLocations = [
    { id: 1, name: "New York", x: 22, y: 35, country: "USA" },
    { id: 2, name: "London", x: 48, y: 30, country: "UK" },
    { id: 3, name: "Tokyo", x: 82, y: 38, country: "Japan" },
    { id: 4, name: "Sydney", x: 85, y: 75, country: "Australia" },
    { id: 5, name: "Paris", x: 49, y: 32, country: "France" },
    { id: 6, name: "Rio de Janeiro", x: 32, y: 65, country: "Brazil" },
    { id: 7, name: "Cairo", x: 54, y: 42, country: "Egypt" },
    { id: 8, name: "Moscow", x: 58, y: 25, country: "Russia" },
  ];

  // Map saved postcards to locations
  const postcardLocations = savedPostcards.map((postcard, index) => {
    // Use sample locations cyclically for demonstration
    const location = sampleLocations[index % sampleLocations.length];
    return {
      ...location,
      id: index,
      postcard: postcard,
      timestamp: postcard.timestamp
    };
  });

  const handleLocationClick = (location) => {
    setSelectedPostcard(location.postcard);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPostcard(null);
  };

  // Handle receiving a postcard
  const handleReceivePostcard = async () => {
    setIsFetching(true);
    try {
      // Use the sender token to receive a postcard
      const postcardData = await receivePostcard(senderToken);
      
      if (postcardData) {
        setReceivedPostcard(postcardData);
        setShowReceivedPostcard(true);
      } else {
        // Handle case where no postcard is available
        alert('No postcards available at the moment. Please try again later.');
      }
    } catch (error) {
      console.error('Error receiving postcard:', error);
      alert('Failed to receive postcard. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  // Define text content
  const getTextContent = () => {
    return {
      title: 'Learning Journey Map',
      subtitle: 'Click on the markers to review your learning progress. ',
      completedText: 'You\'ve completed',
      activitiesText: 'activities so far.',
      homeButton: 'Home',
      receiveButton: 'Receive Postcard', // Add receive button text
      close: 'Close',
      noPostcards: 'No postcards available at the moment.',
      view: 'View'
    };
  };

  const textContent = getTextContent();

  return (
    <div className="min-h-screen bg-[#e5f5fb] p-0">
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
        {/* Receive Postcard button */}
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

      {/* Progress text */}
      <div className="text-center px-6 mb-4 -mt-2">
        <p className="text-base font-inter leading-tight">
          {textContent.subtitle}{' '}
          <span className="font-bold text-base">
            {textContent.completedText} {savedPostcards.length} {textContent.activitiesText}
          </span>
        </p>
      </div>

      {/* World map container */}
      <div className="relative mx-auto" style={{ width: '95%', height: '75vh' }}>
        <img 
          src="/map.png" 
          alt="World Map" 
          className="w-full h-full object-contain"
        />
        
        {/* Saved postcard markers */}
        {postcardLocations.map((location) => (
          <div
            key={location.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${location.x}%`, top: `${location.y}%` }}
            onClick={() => handleLocationClick(location)}
          >
            {/* Marker dot */}
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {location.name}, {location.country}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black border-opacity-75"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-4 mb-4">
        <div className="flex items-center mr-6">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="font-inter text-xl">Completed Activities</span>
        </div>
      </div>

      {/* Saved Postcard Modal */}
      {showModal && selectedPostcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Saved Postcard</h3>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                <img 
                  src={selectedPostcard.imageData} 
                  alt="Saved postcard" 
                  className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                />
                <p className="text-gray-600 text-center">{new Date(selectedPostcard.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Received Postcard Modal */}
      {showReceivedPostcard && receivedPostcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Received Postcard</h3>
                <button 
                  onClick={() => setShowReceivedPostcard(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                {/* Display received postcard image from local path */}
                <img 
                  src={`/static/${receivedPostcard.image_path}`} 
                  alt="Received postcard" 
                  className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                />
                <p className="text-gray-600 text-center mb-4">
                  Received at: {new Date(receivedPostcard.created_at).toLocaleString()}
                </p>
                {receivedPostcard.feedback_text && (
                  <div className="w-full">
                    <h4 className="font-semibold mb-2">Feedback:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {typeof receivedPostcard.feedback_text === 'string' ? (
                        <pre className="whitespace-pre-wrap">{receivedPostcard.feedback_text}</pre>
                      ) : (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(receivedPostcard.feedback_text, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldMapReview;