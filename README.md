# Multiplayer Board Game

A real-time multiplayer turn-based board game built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO for real-time communication.

## Features

- **User Authentication**: Register and login with JWT tokens
- **Real-time Gameplay**: Live multiplayer tic-tac-toe with Socket.IO
- **Game Management**: Create, join, and manage games
- **Live Chat**: Real-time messaging between players
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Game State Management**: Persistent game state with MongoDB
- **Turn-based Logic**: Proper turn management and validation

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **CSS3** - Styling with modern gradients and animations

## Project Structure

```
multiplayer-board-game/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Game.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── game.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   └── socketController.js
│   ├── server.js
│   ├── package.json
│   └── config.env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── Auth.css
│   │   │   ├── Dashboard.js
│   │   │   ├── Game.js
│   │   │   ├── GameBoard.js
│   │   │   ├── Chat.js
│   │   │   └── *.css
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   └── gameService.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `config.env` and rename to `.env`
   - Update the following variables:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/multiplayer-game
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     FRONTEND_URL=http://localhost:3000
     ```

4. **Start MongoDB:**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas cloud service

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   The React app will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Game Management
- `POST /api/game/create` - Create a new game
- `POST /api/game/join/:gameId` - Join an existing game
- `GET /api/game/available` - Get available games
- `GET /api/game/:gameId` - Get game details
- `POST /api/game/:gameId/move` - Make a move
- `GET /api/game/current` - Get user's current game

## Socket.IO Events

### Client to Server
- `authenticate` - Authenticate socket connection
- `join_game` - Join a game room
- `make_move` - Make a game move
- `send_message` - Send a chat message
- `typing` - Typing indicator

### Server to Client
- `authenticated` - Socket authentication successful
- `auth_error` - Socket authentication failed
- `game_state` - Current game state
- `game_updated` - Game state updated
- `player_joined` - Player joined the game
- `player_disconnected` - Player disconnected
- `new_message` - New chat message
- `user_typing` - User typing indicator
- `error` - Error message

## Game Features

### Tic-Tac-Toe
- 3x3 game board
- Turn-based gameplay
- Win detection (rows, columns, diagonals)
- Draw detection
- Real-time move updates
- Visual indicators for current turn and last move

### Chat System
- Real-time messaging
- Typing indicators
- Message timestamps
- User identification
- Persistent message storage

### User Management
- User registration and login
- JWT token authentication
- User statistics (games played, games won)
- Current game tracking

## Usage

1. **Register/Login**: Create an account or sign in
2. **Create Game**: Start a new game or join an existing one
3. **Play**: Take turns making moves on the board
4. **Chat**: Communicate with your opponent in real-time
5. **Track Progress**: View your game statistics

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start    # Start React development server
```

### Database
The application uses MongoDB with the following collections:
- `users` - User accounts and statistics
- `games` - Game state and moves
- `messages` - Chat messages

## Deployment

### Backend Deployment
1. Set up environment variables for production
2. Use a process manager like PM2
3. Set up MongoDB Atlas or cloud MongoDB instance
4. Configure CORS for your frontend domain

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Update API URLs for production

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Secure socket authentication

## Future Enhancements

- Multiple game types (Connect Four, Checkers)
- Spectator mode
- Game replays
- User profiles and avatars
- Leaderboards
- Tournament mode
- Mobile app development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License. "# multiplayer-board-game" 
