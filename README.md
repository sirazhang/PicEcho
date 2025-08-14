# chatpic

## Project Overview

Chatpic is an interactive language learning application that uses image-based conversations to help users practice English speaking skills.

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