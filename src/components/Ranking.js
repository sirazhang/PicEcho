import React, { useState, useEffect } from 'react';

const Ranking = ({ onBack }) => {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    // 模拟从后端获取排名数据
    // 实际项目中应该从后端API获取真实数据
    const mockRankings = [
      { id: 1, nickname: 'Alice', conversations: 42 },
      { id: 2, nickname: 'Bob', conversations: 38 },
      { id: 3, nickname: 'Charlie', conversations: 35 },
      { id: 4, nickname: 'Diana', conversations: 32 },
      { id: 5, nickname: 'Eve', conversations: 29 }
    ];
    
    setRankings(mockRankings);
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center" style={{ 
      backgroundImage: "url('/design/rankingbackground.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Header with community button */}
      <div className="flex justify-between items-center p-6">
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
          Community
        </button>
        <div className="w-32"></div> {/* Spacer for balance */}
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-full max-w-2xl bg-white bg-opacity-80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-center mb-6">Top Learners</h2>
          
          {/* Ranking list */}
          <div className="space-y-4">
            {rankings.slice(0, 5).map((user, index) => (
              <div 
                key={user.id}
                className="flex items-center p-4 rounded-xl shadow-md bg-white"
              >
                {/* Ranking position */}
                <div className="w-12 h-12 flex items-center justify-center rounded-full text-white font-bold text-xl mr-4"
                  style={{ 
                    backgroundColor: index === 0 ? '#FFD700' : 
                                   index === 1 ? '#C0C0C0' : 
                                   index === 2 ? '#CD7F32' : '#66ab4b' 
                  }}
                >
                  {index + 1}
                </div>
                
                {/* User info */}
                <div className="flex-grow">
                  <div className="font-bold text-lg">{user.nickname}</div>
                  <div className="text-gray-600">{user.conversations} conversations</div>
                </div>
                
                {/* Medals for top 3 */}
                {index === 0 && (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-3xl">🥇</span>
                  </div>
                )}
                {index === 1 && (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-3xl">🥈</span>
                  </div>
                )}
                {index === 2 && (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <span className="text-3xl">🥉</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="relative w-full" style={{ height: '50vh' }}>
          {/* Cat element (with jump animation) */}
          <div 
            className="absolute"
            style={{ 
              top: '10%', 
              left: '70%',
              width: '350px',
              height: '350px'
            }}
          >
            <style jsx>{`
              @keyframes jump {
                0% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0); }
              }
              
              .cat-jump {
                animation: jump 1s infinite ease-in-out;
              }
            `}</style>
            <img 
              src="/design/cat.png" 
              alt="Cat" 
              className="w-full h-full object-contain cat-jump"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ranking;