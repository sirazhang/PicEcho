-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS chatpic;

-- Use the database
USE chatpic;

-- Create the sent_postcards table
CREATE TABLE sent_postcards (
  id INT AUTO_INCREMENT PRIMARY KEY,          -- 自增ID，唯一标识明信片
  senderId VARCHAR(255) NOT NULL,             -- 发送者的用户ID
  imageUrl VARCHAR(255) NOT NULL,             -- 明信片图片URL
  feedbackText TEXT NOT NULL,                 -- 明信片反馈内容
  postalCode VARCHAR(20),                     -- 发送者的邮政编码
  status ENUM('pending', 'sent') DEFAULT 'pending', -- 明信片状态，'pending'表示尚未接收，'sent'表示已发送
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 创建时间
);