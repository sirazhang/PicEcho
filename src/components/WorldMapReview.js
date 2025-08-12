import React, { useState, useEffect } from 'react';

const WorldMapReview = ({ onBack, onReviewPostcard }) => {
  const [savedPostcards, setSavedPostcards] = useState([]);
  const [selectedPostcard, setSelectedPostcard] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Load saved postcards from localStorage
    const postcards = JSON.parse(localStorage.getItem('chatpicPostcards') || '[]');
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
      onReviewPostcard(selectedPostcard);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Learning Journey Map</h1>
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            Back to Home
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Click on the markers to review your learning progress. You've completed {savedPostcards.length} activities so far.
            </p>
            
            <div className="relative bg-blue-50 rounded-xl overflow-hidden" style={{ height: '70vh' }}>
              {/* World Map SVG */}
              <svg viewBox="0 0 100 50" className="w-full h-full">
                {/* Simplified world map representation */}
                <path d="M15,25 L20,20 L25,22 L30,18 L35,20 L40,15 L45,18 L50,16 L55,14 L60,15 L65,12 L70,14 L75,10 L80,12 L85,8" 
                      stroke="#4B5563" strokeWidth="0.5" fill="none" />
                <path d="M10,30 L15,32 L20,30 L25,33 L30,31 L35,34 L40,32 L45,35 L50,33 L55,36 L60,34 L65,37 L70,35 L75,38 L80,36 L85,39" 
                      stroke="#4B5563" strokeWidth="0.5" fill="none" />
                <path d="M20,40 L25,42 L30,40 L35,43 L40,41 L45,44 L50,42 L55,45 L60,43 L65,46 L70,44 L75,47" 
                      stroke="#4B5563" strokeWidth="0.5" fill="none" />
                
                {/* Continents */}
                <ellipse cx="20" cy="25" rx="8" ry="5" fill="#10B981" opacity="0.3" />
                <ellipse cx="50" cy="25" rx="12" ry="8" fill="#10B981" opacity="0.3" />
                <ellipse cx="75" cy="30" rx="10" ry="6" fill="#10B981" opacity="0.3" />
                <ellipse cx="65" cy="40" rx="6" ry="4" fill="#10B981" opacity="0.3" />
                <ellipse cx="30" cy="35" rx="8" ry="5" fill="#10B981" opacity="0.3" />
                
                {/* Location markers */}
                {postcardLocations.map((location) => (
                  <g key={location.id} onClick={() => handleLocationClick(location)} className="cursor-pointer">
                    <circle 
                      cx={location.x} 
                      cy={location.y} 
                      r="1.5" 
                      fill="#EF4444" 
                      stroke="#FFFFFF" 
                      strokeWidth="0.5"
                      className="hover:r-2 transition-all duration-200"
                    />
                    <circle 
                      cx={location.x} 
                      cy={location.y} 
                      r="3" 
                      fill="none" 
                      stroke="#EF4444" 
                      strokeWidth="0.5"
                      className="opacity-0 hover:opacity-50 transition-opacity duration-200"
                    />
                  </g>
                ))}
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-80 rounded-lg p-3 shadow-md">
                <div className="flex items-center mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm">Completed Activities</span>
                </div>
                <div className="text-xs text-gray-600">Click on markers to review</div>
              </div>
            </div>
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
                    src={`/img/${selectedPostcard.imageId}.png`} 
                    alt="Conversation" 
                    className="w-24 h-24 object-cover rounded-lg mr-4"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100?text=Image+Not+Found';
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
    </div>
  );
};

export default WorldMapReview;