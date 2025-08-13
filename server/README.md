# Chatpic Server

This is the backend server for the Chatpic application. It handles the postcard sending and receiving functionality.

## Setup

1. Make sure you have Node.js installed (version 14 or higher recommended)
2. Make sure you have MySQL installed and running
3. Install dependencies:
   ```
   npm install
   ```

## Database Setup

1. Create a MySQL database named `chatpic`:
   ```sql
   CREATE DATABASE chatpic;
   ```

2. Run the schema file to create the required tables:
   ```sql
   USE chatpic;
   SOURCE database/schema.sql;
   ```

## Configuration

Create a `.env` file in the server root directory with the following variables:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=chatpic
PORT=3001
```

If not provided, the default values will be used.

## Running the Server

### Development Mode
```
npm run dev
```

### Production Mode
```
npm start
```

## API Endpoints

### POST /postcards/send
Send a postcard to another user.

**Request Body:**
```json
{
  "senderId": "user-1689123456789",
  "imageUrl": "/img/img_01.png",
  "feedbackText": "{\"encouragingRemarks\":\"Great job!\",\"errorSummary\":\"Minor issues\",\"suggestions\":\"Practice more\"}",
  "postalCode": "A1B 2C3"
}
```

**Response:**
```json
{
  "message": "Postcard sent successfully!",
  "postcard": {
    "id": 1,
    "senderId": "user-1689123456789",
    "imageUrl": "/img/img_01.png",
    "feedbackText": "{\"encouragingRemarks\":\"Great job!\",\"errorSummary\":\"Minor issues\",\"suggestions\":\"Practice more\"}",
    "postalCode": "A1B 2C3",
    "status": "pending"
  }
}
```

### GET /postcards/receive
Receive a random postcard from another user.

**Query Parameters:**
- `userId` (string): The ID of the current user (to exclude their own postcards)

**Response:**
```json
{
  "id": 1,
  "senderId": "user-1689123456789",
  "imageUrl": "/img/img_01.png",
  "feedbackText": "{\"encouragingRemarks\":\"Great job!\",\"errorSummary\":\"Minor issues\",\"suggestions\":\"Practice more\"}",
  "postalCode": "A1B 2C3",
  "status": "pending",
  "createdAt": "2023-08-15T10:30:00.000Z"
}
```

If no postcards are available:
```json
{
  "message": "No postcards available at the moment"
}
```