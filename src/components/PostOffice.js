import React, { useState, useEffect, useRef } from 'react';
import { receivePostcard } from '../utils/api';

const PostOffice = ({ onBack, onViewPostcard, selectedLanguage }) => {
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

  // Define text content based on selected language
  const getTextContent = () => {
    if (selectedLanguage === 'zh') {
      return {
        communityButton: '社区',
        receiveHint1: '叽叽！点击红色🔴邮筒，我帮你看看有没有人给你寄明信片哦！',
        receiveHint2: '嘿嘿，点击绿色🟢邮筒，我会帮你寄出你的明信片给别人！快来试试吧！',
        receivedPostcardTitle: '收到的明信片',
        close: '关闭',
        noPostcards: '暂时没有明信片。',
        view: '查看',
        inboxTitle: '收件箱',
        outboxTitle: '发件箱',
        checkReceived: '查看您收到的明信片！',
        sendToOthers: '发送您的明信片给其他人！',
        goToPostOffice: '前往邮局',
        postcardSent: '明信片发送成功！'
      };
    } else if (selectedLanguage === 'es') {
      return {
        communityButton: 'Comunidad',
        receiveHint1: '¡Chirp! ¡Haz clic en el buzón rojo 🔴 y te ayudaré a ver si alguien te envió una postal!',
        receiveHint2: '¡Jeje! ¡Haz clic en el buzón verde 🟢 y te ayudaré a enviar tu postal a otras personas! ¡Ven a probarlo!',
        receivedPostcardTitle: 'Postal Recibida',
        close: 'Cerrar',
        noPostcards: 'No hay postales disponibles en este momento.',
        view: 'Ver',
        inboxTitle: 'Bandeja de Entrada',
        outboxTitle: 'Bandeja de Salida',
        checkReceived: '¡Revisa tus postales recibidas!',
        sendToOthers: '¡Envía tus postales a otros!',
        goToPostOffice: 'Ir a la Oficina de Correos',
        postcardSent: '¡Postal enviada exitosamente!'
      };
    } else if (selectedLanguage === 'fr') {
      return {
        communityButton: 'Communauté',
        receiveHint1: 'Chirp ! Cliquez sur la boîte aux lettres rouge🔴, je vous aiderai à voir si quelqu\'un vous a envoyé une carte postale !',
        receiveHint2: 'Héhé, cliquez sur la boîte aux lettres verte🟢, je vous aiderai à envoyer votre carte postale à d\'autres personnes ! Venez essayer !',
        receivedPostcardTitle: 'Carte Postale Reçue',
        close: 'Fermer',
        noPostcards: 'Aucune carte postale disponible pour le moment.',
        view: 'Voir',
        inboxTitle: 'Boîte de Réception',
        outboxTitle: 'Boîte d\'Envoi',
        checkReceived: 'Consultez vos cartes postales reçues !',
        sendToOthers: 'Envoyez vos cartes postales aux autres !',
        goToPostOffice: 'Aller au Bureau de Poste',
        postcardSent: 'Carte postale envoyée avec succès !'
      };
    } else {
      return {
        communityButton: 'Community',
        receiveHint1: 'Chirp! Click the red 🔴 mailbox, I\'ll help you see if anyone sent you a postcard!',
        receiveHint2: 'Hehe, click the green 🟢 mailbox, I\'ll help you send your postcard to others! Come try it!',
        receivedPostcardTitle: 'Received Postcard',
        close: 'Close',
        noPostcards: 'No postcards available at the moment.',
        view: 'View',
        inboxTitle: 'Inbox',
        outboxTitle: 'Outbox',
        checkReceived: 'Check your received postcards!',
        sendToOthers: 'Send your postcards to others!',
        goToPostOffice: 'Go to Post Office',
        postcardSent: 'Postcard sent successfully!'
      };
    }
  };

  const textContent = getTextContent();

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
    alert(textContent.postcardSent);
    closeOutbox();
  };

  // Handle actual postcard sending with message
  const handleSendPostcardWithMessage = async () => {
    if (!selectedPostcard || !message.trim()) {
      alert(selectedLanguage === 'zh' ? '请选择明信片并填写寄语' : 'Please select a postcard and enter a message');
      return;
    }

    try {
      // In a real implementation, this would send the postcard to the backend
      // For now, we'll just show a success message
      alert(textContent.postcardSent);
      
      // Close the outbox
      closeOutbox();
    } catch (error) {
      console.error('Error sending postcard:', error);
      alert(selectedLanguage === 'zh' ? '发送失败，请重试' : 'Failed to send, please try again');
    }
  };

  // Handle postcard selection for sending
  const handleSelectPostcardForSending = (postcard) => {
    setSelectedPostcard(postcard);
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
      {/* Header with community button at top left */}
      <div className="absolute top-6 left-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-base font-inter font-bold focus:outline-none rounded-lg"
          style={{ 
            backgroundColor: '#F26E0A',
            color: 'white',
            minWidth: '120px',
            minHeight: '40px'
          }}
        >
          {textContent.communityButton}
        </button>
      </div>

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

      {/* Hint messages moved down from top */}
      <div className="pt-24 text-center px-4">
        <div className="inline-block bg-white rounded-lg shadow-lg px-6 py-4">
          <p className="text-black text-lg font-inter font-bold">
            {textContent.receiveHint1}
          </p>
          <p className="text-black text-lg font-inter font-bold mt-2">
            {textContent.receiveHint2}
          </p>
        </div>
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
                  {textContent.inboxTitle}
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
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {currentPostcardIndex < savedPostcards.length - 1 && (
                    <button 
                      onClick={nextPostcard}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Postcard display */}
                  {selectedPostcard && (
                    <div className="flex flex-col items-center">
                      <img 
                        src={selectedPostcard.imageData?.url || `/Level${selectedPostcard.level}/${selectedPostcard.imageId}.png`} 
                        alt="Postcard" 
                        className="max-w-full h-auto max-h-96 object-contain mb-4"
                      />
                      <p className="text-gray-600">
                        {new Date(selectedPostcard.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">{textContent.noPostcards}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Outbox Modal - Send postcards */}
      {showOutbox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {textContent.outboxTitle}
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

              <div className="py-4">
                {savedPostcards.length > 0 ? (
                  <div>
                    <p className="mb-4 text-center">{textContent.sendToOthers}</p>

                    {/* Postcard selection carousel */}
                    <div className="flex overflow-x-auto space-x-4 py-4 mb-6">
                      {savedPostcards.map((postcard, index) => (
                        <div 
                          key={postcard.id || index}
                          className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                            selectedPostcard && selectedPostcard.id === postcard.id 
                              ? 'transform scale-110' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ width: '200px' }}
                          onClick={() => handleSelectPostcardForSending(postcard)}
                        >
                          <div className="bg-gray-100 rounded-lg p-2 shadow">
                            {postcard.imageData?.url ? (
                              <img 
                                src={postcard.imageData.url} 
                                alt="Postcard" 
                                className="w-full h-32 object-cover rounded"
                              />
                            ) : (
                              // 使用 sample 库中的图片作为占位图，修正图片路径
                              <img 
                                src={`/sample/sample_0${index % 4 + 1}.png`} 
                                alt="Sample Postcard Image" 
                                className="w-full h-32 object-cover rounded"
                                onError={(e) => {
                                  // Fallback to another sample image if the first one fails to load
                                  e.target.src = `/sample/sample_${index % 2 + 1}.png`;
                                }}
                              />
                            )}
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              {new Date(postcard.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message input */}
                    {selectedPostcard && (
                      <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          {selectedLanguage === 'zh' ? '添加寄语' : 'Add a message'}
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="4"
                          placeholder={selectedLanguage === 'zh' ? '在此输入您的寄语...' : 'Enter your message here...'}
                        />
                      </div>
                    )}

                    {/* Send button */}
                    <div className="text-center">
                      <button
                        onClick={handleSendPostcardWithMessage}
                        disabled={!selectedPostcard || !message.trim()}
                        className={`px-6 py-3 rounded font-bold ${
                          selectedPostcard && message.trim()
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {selectedLanguage === 'zh' ? '发送明信片' : 'Send Postcard'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">{textContent.noPostcards}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Received Postcard Modal */}
      {receivedPostcard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {textContent.receivedPostcardTitle}
                </h3>
                <button 
                  onClick={closeReceivedPostcard}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col items-center">
                <img 
                  src={receivedPostcard.image_path || receivedPostcard.postcard_url} 
                  alt="Received postcard" 
                  className="max-w-full h-auto border border-gray-300 rounded-lg mb-4"
                />
                <p className="text-gray-600 text-center">
                  {new Date(receivedPostcard.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostOffice;