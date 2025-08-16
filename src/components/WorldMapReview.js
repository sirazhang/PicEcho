import React, { useState, useEffect } from 'react';
import { receivePostcard } from '../utils/api';

const WorldMapReview = ({ onBack, onViewPostcard }) => {
  const [savedPostcards, setSavedPostcards] = useState([]);
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReceivedPostcard, setShowReceivedPostcard] = useState(false);
  const [receivedPostcard, setReceivedPostcard] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    // Load saved postcards from localStorage
    const postcards = JSON.parse(localStorage.getItem('savedPostcards') || '[]');
    setSavedPostcards(postcards);
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

  const handleReviewClick = () => {
    if (selectedPostcard) {
      onViewPostcard(selectedPostcard);
    }
  };

  const fetchRandomPostcard = async () => {
    setIsFetching(true);
    try {
      // In a real app, this would come from authentication
      const userId = 'user-' + Date.now();
      const postcardData = await receivePostcard(userId);
      
      if (postcardData) {
        // Parse feedback text back to JSON if it's a string
        if (typeof postcardData.feedbackText === 'string') {
          try {
            postcardData.feedback = JSON.parse(postcardData.feedbackText);
          } catch (parseError) {
            console.error('Error parsing feedback text:', parseError);
            postcardData.feedback = {};
          }
        } else {
          postcardData.feedback = postcardData.feedbackText;
        }
        
        setReceivedPostcard(postcardData);
        setShowReceivedPostcard(true);
      } else {
        // No postcards available - show message to user
        setReceivedPostcard({
          message: 'No postcards available at the moment. Try sending one first!',
          isEmpty: true
        });
        setShowReceivedPostcard(true);
      }
    } catch (error) {
      console.error('Error fetching postcard:', error);
      // Show error message to user
      setReceivedPostcard({
        message: `Error: ${error.message}`,
        isError: true
      });
    } finally {
      setIsFetching(false);
    }
  };

  const closeReceivedPostcard = () => {
    setShowReceivedPostcard(false);
    setReceivedPostcard(null);
  };

  // Get image path based on level
  const getImagePath = (imageId, level) => {
    // If level is not specified, default to level 1
    const validLevel = level || 1;
    return `/img_Level${validLevel}/${imageId}.png`;
  };

  return (
    <div className="min-h-screen bg-[#e5f5fb] p-0">
      {/* Header with title and home button */}
      <div className="flex justify-between items-center p-6">
        <div></div> {/* Empty div for spacing */}
        <h1 className="text-2xl font-gloria-hallelujah absolute left-1/2 transform -translate-x-1/2">
          Learning Journey Map
        </h1>
        <button
          onClick={onBack}
          className="px-6 py-3 text-base font-inter font-bold focus:outline-none rounded-lg"
          style={{ 
            backgroundColor: '#003153',
            color: 'white',
            minWidth: '200px',
            minHeight: '80px'
          }}
        >
          Home
        </button>
      </div>

      {/* Progress text */}
      <div className="text-center px-6 mb-8">
        <p className="text-base font-inter">
          Click on the markers to review your learning progress.{' '}
          You've completed <span className="font-bold text-base">{savedPostcards.length}</span> activities so far.
        </p>
      </div>

      {/* Main content area - Map and controls */}
      <div className="flex flex-col" style={{ height: '85vh' }}>
        {/* Map Container - takes most of the space and fits the map image */}
        <div className="flex-grow relative mb-6 flex justify-center items-center">
          <div className="relative bg-blue-50 border-4 border-black flex justify-center items-center w-full h-full">
            {/* World Map PNG Background */}
            <img 
              src="/map.png" 
              alt="World Map" 
              className="h-full w-full object-contain"
            />
            
            {/* Location markers */}
            {postcardLocations.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationClick(location)}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${location.x}%`, top: `${location.y}%` }}
              >
                <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg hover:scale-125 transition-transform duration-200"></div>
                <div className="absolute inset-0 w-8 h-8 bg-red-500 rounded-full animate-ping opacity-20"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom row with legend on left and mailbox on right */}
        <div className="flex justify-between items-end pb-6 px-6">
          {/* Left Legend Panel */}
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-red-500 rounded-full mr-3"></div>
              <span className="text-sm font-inter font-bold">Completed Activities</span>
            </div>
            <div className="text-sm text-gray-600 font-inter">
              Click on markers to review
            </div>
          </div>
          
          {/* Right Panel with Mailbox */}
          <div>
            <button
              onClick={fetchRandomPostcard}
              disabled={isFetching}
              className="bg-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50"
            >
              {isFetching ? (
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="animate-spin h-12 w-12 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <img 
                  src="/design/box.png" 
                  alt="Mailbox" 
                  className="h-24 w-24 object-contain" // Changed from h-24 w-24 to maintain 8vh size
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal for postcard details */}
      {showModal && selectedPostcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Activity Review</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={getImagePath(selectedPostcard.imageId, selectedPostcard.level)} 
                    alt="Conversation" 
                    className="w-24 h-24 object-cover rounded-lg mr-4"
                    onError={(e) => {
                      // Try fallback to default img folder if level-specific image not found
                      if (!e.target.src.includes('/img/')) {
                        e.target.src = `/img/${selectedPostcard.imageId}.png`;
                      } else {
                        // If default image also not found, show placeholder
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.src = 'https://placehold.co/100x100?text=Image+Not+Found';
                      }
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Image Practice Session</h3>
                    <p className="text-gray-600">{new Date(selectedPostcard.timestamp).toLocaleDateString()}</p>
                    <p className="text-gray-600">{selectedPostcard.imageDescription}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Summary:</h4>
                  <p className="text-gray-600 line-clamp-3">
                    {selectedPostcard.feedback?.encouragingRemarks?.substring(0, 100) || 'Great job!'}...
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                >
                  Close
                </button>
                <button
                  onClick={handleReviewClick}
                  className="px-6 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition duration-200"
                >
                  View Full Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for received postcard */}
      {showReceivedPostcard && receivedPostcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Received Postcard</h2>
                <button 
                  onClick={closeReceivedPostcard}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Display message if no postcards available or error occurred */}
              {receivedPostcard.isEmpty || receivedPostcard.isError ? (
                <div className="bg-gray-50 rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.1)] p-8 text-center">
                  <div className="text-5xl mb-4">
                    {receivedPostcard.isEmpty ? '📭' : '⚠️'}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {receivedPostcard.isEmpty ? 'No Postcards Available' : 'Error'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {receivedPostcard.message}
                  </p>
                  <button
                    onClick={closeReceivedPostcard}
                    className="px-6 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition duration-200"
                  >
                    Close
                  </button>
                </div>
              ) : (
                // Postcard
                <div className="bg-[#F5F5F5] rounded-xl shadow-[0_4px_8px_rgba(0,0,0,0.1)] overflow-hidden mb-6">
                  {/* Postcard header with postal code and postmark */}
                  <div className="relative p-6">
                    {/* Postal code in top-left corner */}
                    <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded border border-gray-300">
                      <div className="text-xs font-bold text-gray-700">Postal Code</div>
                      <div className="text-sm font-mono">{receivedPostcard.postalCode || 'N/A'}</div>
                    </div>
                    
                    {/* Postmark in top-right corner */}
                    <div className="absolute top-4 right-4 w-20 h-12 border-2 border-red-500 rotate-12">
                      <div className="bg-red-500 text-white text-[8px] font-bold p-1">
                        Postmark
                      </div>
                      <div className="text-[8px] font-mono p-1 truncate">{receivedPostcard.postmark || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Left Column - Image Section */}
                    <div className="flex items-center justify-center">
                      <img
                        src={receivedPostcard.imageUrl || getImagePath(receivedPostcard.imageId, receivedPostcard.level)}
                        alt="Conversation image"
                        className="max-h-[70vh] object-contain rounded-lg"
                        onError={(e) => {
                          // Try fallback to default img folder if level-specific image not found
                          if (!e.target.src.includes('/img/')) {
                            e.target.src = `/img/${receivedPostcard.imageId}.png`;
                          } else {
                            // If default image also not found, show placeholder
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                          }
                        }}
                      />
                    </div>

                    {/* Right Column - Feedback */}
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">
                        Feedback
                      </h2>

                      {/* Encouraging Remarks */}
                      <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                        <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                          💬 Encouraging Remarks
                        </h3>
                        <p className="text-green-700 whitespace-pre-line">{receivedPostcard.feedback?.encouragingRemarks}</p>
                      </div>

                      {/* Error Summary */}
                      <div className="bg-amber-50 p-5 rounded-lg border border-amber-200">
                        <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
                          ❗ Error Summary
                        </h3>
                        <pre className="text-amber-700 whitespace-pre-line font-sans">{receivedPostcard.feedback?.errorSummary}</pre>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                          💡 Suggestions
                        </h3>
                        <pre className="text-blue-700 whitespace-pre-line font-sans">{receivedPostcard.feedback?.suggestions}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!receivedPostcard.isEmpty && !receivedPostcard.isError && (
                <div className="flex justify-end">
                  <button
                    onClick={closeReceivedPostcard}
                    className="px-6 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition duration-200"
                  >
                    Close
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

export default WorldMapReview;