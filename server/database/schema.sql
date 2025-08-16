-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS chatpic;

-- Use the database
USE chatpic;

-- Drop the old table if it exists
DROP TABLE IF EXISTS postcards;

-- Create the postcards table with the new structure
CREATE TABLE postcards (
    postcard_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    postcard_url VARCHAR(500),
    postcard_image MEDIUMBLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'sent') DEFAULT 'pending',
    sender_token CHAR(36),
    receiver_token CHAR(36),
    feedback_text TEXT,
    postal_code VARCHAR(20)
);

-- 索引优化
CREATE INDEX idx_status ON postcards(status);
CREATE INDEX idx_created_at ON postcards(created_at);
CREATE INDEX idx_sender_token ON postcards(sender_token);
CREATE INDEX idx_receiver_token ON postcards(receiver_token);