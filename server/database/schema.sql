-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS chatpic;

-- Use the database
USE chatpic;

-- Drop the old table if it exists
DROP TABLE IF EXISTS sent_postcards;

-- Create the postcards table with the new structure
CREATE TABLE postcards (
    postcard_id BIGINT AUTO_INCREMENT PRIMARY KEY,    -- 明信片唯一ID
    image_id VARCHAR(255),                            -- 用户上传图片的ID
    postcard_url VARCHAR(500) NOT NULL,               -- 明信片图片URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- 明信片生成时间
    status ENUM('pending', 'sent') DEFAULT 'pending', -- 明信片状态（待发送、已发送）
    upload_status ENUM('success', 'fail') DEFAULT 'success', -- 上传状态
    sender_token CHAR(36) NOT NULL,                   -- 发送方临时标识符（UUID）
    receiver_token CHAR(36) DEFAULT NULL,             -- 接收方临时标识符（UUID），如果已经收到
    feedback_text TEXT,                               -- 明信片反馈内容
    postal_code VARCHAR(20)                           -- 发送者的邮政编码
);

-- 索引优化（随机抽取别人寄出的明信片时可以用）
CREATE INDEX idx_status ON postcards(status);
CREATE INDEX idx_created_at ON postcards(created_at);
CREATE INDEX idx_sender_token ON postcards(sender_token);
CREATE INDEX idx_receiver_token ON postcards(receiver_token);