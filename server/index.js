const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Ensure uploads directory exists
async function ensureUploadsDirectory() {
  const uploadDir = path.join(__dirname, 'static/uploads');
  try {
    await fs.access(uploadDir);
  } catch (error) {
    // If directory doesn't exist, create it
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'static/uploads');
    try {
      await ensureUploadsDirectory();
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'postcard-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React app build directory
// This assumes the React app is built into a 'build' directory
app.use(express.static('../build'));

// Serve static files from the 'static' directory
app.use('/static', express.static(path.join(__dirname, 'static')));

// Import Postcard model correctly
const { Postcard } = require('./models/Postcard');

// Add a root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Chatpic server is running!' });
});

// Add Qwen API proxy route
app.post('/api/qwen', async (req, res) => {
  try {
    console.log('Qwen API proxy called');
    const { imageDescription, studentResponse, language } = req.body;
    console.log('Request body:', { imageDescription, studentResponse, language });
    
    // 从系统环境变量读取DASHSCOPE_API_KEY
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
    console.log('DASHSCOPE_API_KEY loaded from env:', DASHSCOPE_API_KEY ? 'Yes' : 'No');
    
    if (!DASHSCOPE_API_KEY) {
      console.log('DASHSCOPE_API_KEY is not set');
      return res.status(500).json({ error: 'DASHSCOPE_API_KEY is not set' });
    }

    // 根据语言创建提示词
    let prompt;
    if (language === 'zh') {
      prompt = `图片描述: ${imageDescription}\n学生回答: ${studentResponse}\n\n请根据图片内容和学生的回答，提供简短的、鼓励性的反馈。反馈应包括：1. 对学生回答的肯定 2. 一个相关的后续问题，引导学生更深入思考。请用中文回复。`;
    } else if (language === 'es') {
      prompt = `Descripción de la imagen: ${imageDescription}\nRespuesta del estudiante: ${studentResponse}\n\nBasándote en el contenido de la imagen y la respuesta del estudiante, proporciona una retroalimentación breve y alentadora. La retroalimentación debe incluir: 1. Un reconocimiento de la respuesta del estudiante 2. Una pregunta de seguimiento relacionada que guíe al estudiante a pensar más profundamente. Por favor, responde en español。`;
    } else if (language === 'fr') {
      prompt = `Description de l'image: ${imageDescription}\nRéponse de l'étudiant: ${studentResponse}\n\nSur la base du contenu de l'image et de la réponse de l'étudiant, veuillez fournir un retour court et encourageant. Le retour doit inclure : 1. Une reconnaissance de la réponse de l'étudiant 2. Une question de suivi pertinente pour guider l'étudiant à réfléchir plus en profondeur. Veuillez répondre en français。`;
    } else {
      prompt = `Image description: ${imageDescription}\nStudent response: ${studentResponse}\n\nBased on the image content and the student's response, please provide a brief, encouraging feedback. The feedback should include: 1. An acknowledgment of the student's response 2. A related follow-up question to guide the student to think more deeply. Please respond in English.`;
    }

    console.log('Prompt created:', prompt);

    // 调用通义千问API
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json",
        "X-DashScope-DataInspection": "enable"
      },
      body: JSON.stringify({
        "model": "qwen-max",
        "input": {
          "prompt": prompt
        },
        "parameters": {
          "max_tokens": 200,
          "temperature": 0.7
        }
      })
    });

    console.log('Qwen API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Qwen API response data:', data);
    res.json({ feedback: data.output.text });
  } catch (error) {
    console.error('Error calling Qwen API:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add route to serve env file content
app.get('/env', (req, res) => {
  const envPath = path.resolve(__dirname, '../env');
  console.log('Attempting to serve env file from:', envPath);
  fs.access(envPath)
    .then(() => {
      console.log('Env file exists, serving it');
      res.sendFile(envPath);
    })
    .catch((err) => {
      console.error('Env file does not exist or cannot be accessed:', err);
      res.status(404).send('Env file not found');
    });
});

// Add a route to get API keys from system environment variables
app.get('/api/config', (req, res) => {
  // 为了安全起见，我们不直接返回API密钥，只返回配置信息
  res.json({
    hasKimiApiKey: !!process.env.KIMI_API_KEY,
    hasDashScopeApiKey: !!process.env.DASHSCOPE_API_KEY
  });
});

// POST /postcards - Save a new postcard with image file upload
app.post('/postcards', upload.single('image'), async (req, res) => {
  console.log('POST /postcards endpoint hit');
  
  const { senderToken, feedbackText, conversationHistory, postalCode } = req.body;
  const imageFile = req.file;

  // Validate required fields
  if (!senderToken || !imageFile || !feedbackText) {
    const missingFields = [];
    if (!senderToken) missingFields.push('senderToken');
    if (!imageFile) missingFields.push('image');
    if (!feedbackText) missingFields.push('feedbackText');
    
    console.log('Missing fields:', missingFields);
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields: missingFields
    });
  }
  
  try {
    // Ensure uploads directory exists
    await ensureUploadsDirectory();
    
    // Save postcard data to database
    const Postcard = require('./models/Postcard').Postcard;
    
    // Create postcard record with file path
    const imagePath = path.relative(path.join(__dirname, 'static'), imageFile.path);
    
    const postData = {
      image_path: imagePath,
      postcard_url: `/static/${imagePath}`,
      created_at: new Date(),
      status: 'sent',
      sender_token: senderToken,
      receiver_token: null,
      feedback_text: typeof feedbackText === 'object' ? JSON.stringify(feedbackText) : feedbackText,
      conversation_history: typeof conversationHistory === 'object' ? JSON.stringify(conversationHistory) : conversationHistory,
      postal_code: postalCode
    };
    
    // Insert into database
    const db = require('./config/db').db;
    const insertSql = `
      INSERT INTO postcards 
      (image_path, postcard_url, status, sender_token, receiver_token, feedback_text, conversation_history, postal_code) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertValues = [
      postData.image_path,
      postData.postcard_url,
      postData.status,
      postData.sender_token,
      postData.receiver_token,
      postData.feedback_text,
      postData.conversation_history,
      postData.postal_code
    ];
    
    db.run(insertSql, insertValues, function(err) {
      if (err) {
        console.error('Error inserting postcard:', err.message);
        return res.status(500).json({ error: 'Failed to save postcard', details: err.message });
      }
      
      postData.postcard_id = this.lastID;
      console.log('Postcard saved successfully:', postData);
      
      res.status(200).json({ 
        success: true,
        message: 'Postcard saved successfully!',
        id: postData.postcard_id,
        timestamp: postData.created_at
      });
    });
  } catch (error) {
    console.error('Error processing postcard:', error);
    return res.status(500).json({ error: 'Failed to process postcard', details: error.message });
  }
});

// GET /postcards/random - Get a random postcard
app.get('/postcards/random', (req, res) => {
  console.log('GET /postcards/random endpoint hit');
  console.log('Query parameters:', req.query);
  
  const { senderToken } = req.query;

  if (!senderToken) {
    return res.status(400).json({ error: 'Missing required query parameter: senderToken' });
  }
  
  const Postcard = require('./models/Postcard').Postcard;
  Postcard.getRandomPending(senderToken, (err, postcard) => {
    if (err) {
      console.error('Error fetching postcard:', err);
      return res.status(500).json({ error: 'Failed to receive postcard' });
    }
    
    // If no postcard found, return appropriate message
    if (!postcard) {
      console.log('No postcards available for user with token:', senderToken);
      return res.status(404).json({ message: 'No postcards available at the moment' });
    }
    
    console.log('Postcard fetched successfully:', postcard);
    
    // If the postcard is not already assigned, mark it as sent and assign to the requester
    if (!postcard.receiver_token) {
      Postcard.markAsSent(postcard.postcard_id, senderToken, (err) => {
        if (err) {
          console.error('Error marking postcard as sent:', err);
        }
        // Regardless of whether we could mark it as sent, return the postcard
        res.status(200).json({ 
          success: true,
          postcard: postcard
        });
      });
    } else {
      // Already assigned, just return it
      res.status(200).json({ 
        success: true,
        postcard: postcard
      });
    }
  });
});

// Routes
// POST /api/postcards/send - Send a postcard
app.post('/api/postcards/send', (req, res) => {
  console.log('POST /api/postcards/send endpoint hit');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('imageUrl length:', req.body.imageUrl?.length);
  console.log('imageUrl starts with:', req.body.imageUrl?.substring(0, 50));
  
  const { senderId, imageUrl, feedbackText, conversationHistory, postalCode } = req.body;

  // Validate required fields
  if (!senderId || !imageUrl || !feedbackText) {
    const missingFields = [];
    if (!senderId) missingFields.push('senderId');
    if (!imageUrl) missingFields.push('imageUrl');
    if (!feedbackText) missingFields.push('feedbackText');
    
    console.log('Missing fields:', missingFields);
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields: missingFields
    });
  }
  
  Postcard.create(senderId, imageUrl, feedbackText, postalCode, conversationHistory, (err, postcard) => {
    if (err) {
      console.error('Error saving postcard:', err);
      return res.status(500).json({ error: 'Failed to send postcard', details: err.message });
    }
    
    console.log('Postcard saved successfully:', postcard);
    res.status(200).json({ 
      success: true,
      message: 'Postcard sent successfully!',
      postcard: postcard
    });
  });
});

// GET /api/postcards/receive - Receive a random postcard
app.get('/api/postcards/receive', (req, res) => {
  console.log('GET /api/postcards/receive endpoint hit');
  console.log('Query parameters:', req.query);
  
  const { senderToken } = req.query;

  if (!senderToken) {
    return res.status(400).json({ error: 'Missing required query parameter: senderToken' });
  }
  
  Postcard.getRandomPending(senderToken, (err, postcard) => {
    if (err) {
      console.error('Error fetching postcard:', err);
      return res.status(500).json({ error: 'Failed to receive postcard' });
    }
    
    // If no postcard found, return appropriate message
    if (!postcard) {
      console.log('No postcards available for user with token:', senderToken);
      return res.status(404).json({ message: 'No postcards available at the moment' });
    }
    
    console.log('Postcard fetched successfully:', postcard);
    
    // If the postcard is not already assigned, mark it as sent and assign to the requester
    if (!postcard.receiver_token) {
      Postcard.markAsSent(postcard.postcard_id, senderToken, (err) => {
        if (err) {
          console.error('Error marking postcard as sent:', err);
        }
        // Regardless of whether we could mark it as sent, return the postcard
        res.status(200).json({ 
          success: true,
          postcard: postcard
        });
      });
    } else {
      // Already assigned, just return it
      res.status(200).json({ 
        success: true,
        postcard: postcard
      });
    }
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  process.exit(0);
});

// Start the server
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

module.exports = server;