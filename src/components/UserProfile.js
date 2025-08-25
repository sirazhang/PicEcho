import { useState, useEffect, useRef } from 'react';

const UserProfile = ({ user, onUpdateUser, onClose }) => {
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [selectedBot, setSelectedBot] = useState(user?.chatbot || 'chatbot1');
  const fileInputRef = useRef(null);

  // Chatbot options with names
  const chatbots = [
    { id: 'chatbot1', name: '皮皮 (Pipi)', image: '/design/chatbot/chatbot1.png' },
    { id: 'chatbot2', name: '伊伊 (Yiyi)', image: '/design/chatbot/chatbot2.png' },
    { id: 'chatbot3', name: '可可 (Keke)', image: '/design/chatbot/chatbot3.png' },
    { id: 'chatbot4', name: '呼呼 (Huhu)', image: '/design/chatbot/chatbot4.png' }
  ];

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setAvatar(user.avatar || '');
      setSelectedBot(user.chatbot || 'chatbot1');
    }
  }, [user]);

  const handleSave = () => {
    // 验证必要字段
    if (!nickname.trim()) {
      alert('请输入有效的昵称');
      return;
    }
    
    // 创建更新后的用户对象
    const updatedUser = {
      ...user,
      nickname: nickname.trim(),
      avatar,
      chatbot: selectedBot
    };
    
    // 调用更新函数
    try {
      onUpdateUser(updatedUser);
      onClose();
    } catch (error) {
      console.error('保存用户数据失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (upload) => {
        setAvatar(upload.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectBot = (botId) => {
    setSelectedBot(botId);
  };

  // 添加退出登录功能
  const handleLogout = () => {
    // 确认退出登录
    const confirmLogout = window.confirm('确定要退出登录吗？');
    if (confirmLogout) {
      // 清除本地存储的用户信息
      localStorage.removeItem('currentUser');
      
      // 刷新页面以应用更改
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">用户设置</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            头像
          </label>
          <div className="flex items-center">
            {avatar ? (
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-16 h-16 rounded-full object-contain mr-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 mr-4 flex items-center justify-center">
                <span className="text-gray-500">无头像</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded"
            >
              上传头像
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">
            昵称
          </label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            选择聊天机器人
          </label>
          <div className="grid grid-cols-2 gap-4">
            {chatbots.map((bot) => (
              <div 
                key={bot.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedBot === bot.id 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectBot(bot.id)}
              >
                <div className="flex flex-col items-center">
                  <img 
                    src={bot.image} 
                    alt={bot.name} 
                    className="w-16 h-16 object-contain mb-2"
                  />
                  <span className="text-sm font-medium text-gray-700">{bot.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded focus:outline-none focus:shadow-outline"
          >
            退出登录
          </button>
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium mr-2"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded focus:outline-none focus:shadow-outline"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;