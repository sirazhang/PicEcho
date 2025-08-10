import React from 'react';

const HomeScreen = ({ onStartDialogue }) => {
  // Get a random image from the available images
  const getRandomImage = () => {
    const images = Array.from({length: 10}, (_, i) => `img_${String(i+1).padStart(2, '0')}`);
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  };

  const handleStart = () => {
    const randomImage = getRandomImage();
    onStartDialogue(randomImage);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">ChatPic</h1>
        <p className="text-lg text-gray-600 mb-10">
          Practice your English speaking skills through image-based conversations
        </p>
        <button
          onClick={handleStart}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Start Dialogue
        </button>
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-500 font-bold text-2xl mb-2">1</div>
              <p className="text-gray-700">Start a conversation with an AI tutor based on an image</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-indigo-500 font-bold text-2xl mb-2">2</div>
              <p className="text-gray-700">Answer 4 questions about the image in English</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-500 font-bold text-2xl mb-2">3</div>
              <p className="text-gray-700">Get feedback and improve your English skills</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;