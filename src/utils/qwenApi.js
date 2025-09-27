// src/utils/qwenApi.js
/**
 * 调用通义千问API获取AI反馈
 * @param {string} imageDescription - 图片描述
 * @param {string} studentResponse - 学生的回答
 * @param {string} language - 语言设置
 * @returns {Promise<string>} AI反馈内容
 */
export const getQwenFeedback = async (imageDescription, studentResponse, language) => {
  console.log('Calling Qwen API with:', { imageDescription, studentResponse, language }); // 添加调试日志

  try {
    // 通过后端代理调用通义千问API
    const response = await fetch("http://localhost:3001/api/qwen", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageDescription,
        studentResponse,
        language
      })
    });

    console.log('Qwen API response status:', response.status); // 添加调试日志
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error response:', errorText); // 添加调试日志
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Qwen API response data:', data); // 添加调试日志
    return data.feedback;
  } catch (error) {
    console.error('Error getting Qwen feedback:', error);
    throw error;
  }
};

/**
 * 获取图片描述 - 从本地JSON文件中获取
 * @param {number} level - 关卡等级
 * @param {string} imageId - 图片ID
 * @param {string} language - 语言设置
 * @returns {Promise<string>} 图片描述
 */
export const getImageDescription = async (level, imageId, language) => {
  try {
    // 确定使用哪个描述文件
    let descriptionFile = 'descriptions.json';
    
    const response = await fetch(`/Level${level}/${descriptionFile}`);
    const descriptionsData = await response.json();
    
    // 获取特定图片的描述
    let imageDescription = "";
    
    // 处理不同关卡的数据结构差异
    if (level === 2) {
      const imageKey = imageId.replace('img_', 'image_');
      imageDescription = descriptionsData[imageKey]?.description || "";
    } else {
      imageDescription = descriptionsData[imageId]?.description || "";
    }
    
    return imageDescription;
  } catch (error) {
    console.error('Error loading image description:', error);
    return language === 'zh' ? '一张有趣的图片' : 
           language === 'es' ? 'Una imagen interesante' :
           language === 'fr' ? 'Une image intéressante' :
           'An interesting image';
  }
};