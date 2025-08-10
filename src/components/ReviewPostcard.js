import React, { useState, useEffect } from 'react';
import { generateKimiFeedback } from '../utils/kimiApi';

const ReviewPostcard = ({ imageId, conversation, onPracticeAnother }) => {
  const [feedback, setFeedback] = useState(null);
  const [imageDescription, setImageDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Generate feedback based on conversation
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        // Get image description
        const response = await fetch('/descriptions.json');
        const descriptions = await response.json();
        const description = descriptions[imageId] || 'A beautiful image';
        setImageDescription(description);
        
        // Generate feedback using Kimi API
        const generatedFeedback = await generateKimiFeedback(conversation, description);
        setFeedback(generatedFeedback);
      } catch (error) {
        console.error('Error generating feedback:', error);
        // Fallback to sample feedback
        setFeedback({
          encouragingRemarks: "Great job! You did very well in describing the image and answering all questions. Your English skills are improving!",
          errorSummary: "Minor grammar issues with article usage (a/the) and some verb tenses. Keep practicing!",
          corrections: [
            { error: "I seen", correction: "I saw" },
            { error: "a beautiful trees", correction: "beautiful trees" },
            { error: "they was", correction: "they were" }
          ],
          suggestions: "Try to use more descriptive adjectives and vary your sentence structures. Practice using past and present tenses correctly."
        });
      }
    };

    if (conversation && conversation.length > 0) {
      fetchFeedback();
    }
  }, [conversation, imageId]);

  const handleSavePostcard = async () => {
    setIsSaving(true);
    
    try {
      // Create postcard data
      const postcardData = {
        imageId,
        imageDescription,
        conversation,
        feedback,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage
      const savedPostcards = JSON.parse(localStorage.getItem('chatpicPostcards') || '[]');
      savedPostcards.push(postcardData);
      localStorage.setItem('chatpicPostcards', JSON.stringify(savedPostcards));
      
      // Show success message
      alert('Postcard saved successfully!');
    } catch (error) {
      console.error('Error saving postcard:', error);
      alert('Failed to save postcard. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!feedback) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating your feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl w-full">
        {/* Postcard Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 relative">
          <h1 className="text-3xl font-bold text-white">Your Conversation Review</h1>
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-400 text-gray-800 font-bold py-1 px-3 rounded-full text-sm">
              POSTCARD
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Left: Image */}
          <div className="md:w-2/5 p-6 bg-gray-50 flex items-center justify-center">
            <img 
              src={`/img/${imageId}.png`} 
              alt="Conversation" 
              className="max-h-96 object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
              }}
            />
          </div>
          
          {/* Right: Feedback */}
          <div className="md:w-3/5 p-6 flex flex-col">
            <div className="flex-grow space-y-6">
              {/* Encouraging Remarks */}
              <div>
                <h2 className="text-xl font-semibold text-green-600 mb-2">Great Job!</h2>
                <p className="text-gray-700">{feedback.encouragingRemarks}</p>
              </div>
              
              {/* Error Summary */}
              <div>
                <h2 className="text-xl font-semibold text-yellow-600 mb-2">Areas for Improvement</h2>
                <p className="text-gray-700">{feedback.errorSummary}</p>
              </div>
              
              {/* Corrections */}
              <div>
                <h2 className="text-xl font-semibold text-blue-600 mb-2">Corrections</h2>
                <div className="space-y-2">
                  {feedback.corrections.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <span className="text-red-500 line-through mr-2">"{item.error}"</span>
                      <span className="text-green-500">→ "{item.correction}"</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Suggestions */}
              <div>
                <h2 className="text-xl font-semibold text-purple-600 mb-2">Suggestions</h2>
                <p className="text-gray-700">{feedback.suggestions}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={onPracticeAnother}
                className="flex-grow bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transform transition duration-300 hover:scale-105"
              >
                Practice Another Image
              </button>
              <button
                onClick={handleSavePostcard}
                disabled={isSaving}
                className={`flex-grow font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ${
                  isSaving 
                    ? 'bg-gray-400 text-gray-700' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Postcard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPostcard;