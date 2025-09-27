# Chatpic

Chatpic 是一个交互式语言学习应用，通过基于图像的对话帮助用户练习英语口语技能。

## 安全说明

为了防止API密钥泄露，**请勿将真实的API密钥存储在项目中的env文件中**。应该使用系统环境变量来存储敏感信息：

### 设置环境变量

#### 在Linux/macOS系统中：
```bash
export KIMI_API_KEY="your_kimi_api_key_here"
export DASHSCOPE_API_KEY="your_dashscope_api_key_here"
```

#### 在Windows系统中：
```cmd
set KIMI_API_KEY=your_kimi_api_key_here
set DASHSCOPE_API_KEY=your_dashscope_api_key_here
```

#### 在Windows PowerShell中：
```powershell
$env:KIMI_API_KEY="your_kimi_api_key_here"
$env:DASHSCOPE_API_KEY="your_dashscope_api_key_here"
```

### 开发环境
在开发环境中，为了方便调试，项目保留了从env文件读取API密钥的功能，但**强烈建议在生产环境中使用系统环境变量**。

### 生产环境
在生产环境中，应始终使用系统环境变量来存储API密钥，并确保env文件不包含真实的API密钥信息。

## 项目结构

## Setup

1. Install dependencies for the frontend:
   ```
   npm install
   ```

2. Set up the backend server:
   ```
   cd server
   npm install
   ```

3. Make sure you have MySQL installed and running

4. Create a MySQL database named `chatpic`:
   ```sql
   CREATE DATABASE chatpic;
   ```

5. Run the schema file to create the required tables:
   ```sql
   USE chatpic;
   SOURCE database/schema.sql;
   ```

6. Create a `.env` file in the server directory with your database configuration:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=chatpic
   PORT=3001
   ```

## Running the Application

1. Start the backend server:
   ```
   cd server
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```
   npm start
   ```

The application will be available at http://localhost:3000, and the backend API will be running at http://localhost:3001.