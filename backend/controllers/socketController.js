const Game = require('../models/Game');
const User = require('../models/User');
const Message = require('../models/Message');
const GameLogic = require('../utils/gameLogic');

// Store active connections
const activeConnections = new Map();
const gameRooms = new Map();
const typingUsers = new Map();

const handleSocketConnection = (socket, io) => {
  console.log(`User ${socket.userId} connected with socket ${socket.id}`);
  
  // Store connection
  activeConnections.set(socket.userId, {
    socketId: socket.id,
    connectedAt: new Date(),
    currentGame: null
  });

  // Send connection confirmation
  socket.emit('connected', {
    userId: socket.userId,
    timestamp: new Date()
  });

  // Handle authentication
  socket.on('authenticate', async (data) => {
    try {
      const user = await User.findById(socket.userId).select('-password');
      if (user) {
        socket.emit('authenticated', { user });
      } else {
        socket.emit('error', { message: 'User not found' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  // Join game room
  socket.on('join_game', async (data) => {
    try {
      const { gameId } = data;
      const game = await Game.findById(gameId).populate('players.user', 'username avatar');
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Check if user is a player or spectator
      const isPlayer = game.players.some(p => p.user._id.toString() === socket.userId);
      const isSpectator = game.spectators.includes(socket.userId);

      if (!isPlayer && !isSpectator && game.gameConfig.allowSpectators) {
        // Add as spectator
        game.spectators.push(socket.userId);
        await game.save();
      }

      // Join socket room
      socket.join(`game_${gameId}`);
      
      // Update connection info
      const connection = activeConnections.get(socket.userId);
      if (connection) {
        connection.currentGame = gameId;
      }

      // Store game room info
      gameRooms.set(gameId, {
        game,
        players: new Set(game.players.map(p => p.user._id.toString())),
        spectators: new Set(game.spectators.map(id => id.toString())),
        lastActivity: new Date()
      });

      // Notify others in the game
      socket.to(`game_${gameId}`).emit('player_joined', {
        userId: socket.userId,
        timestamp: new Date()
      });

      // Send current game state
      socket.emit('game_state', game.getGameState());

      // Load recent messages
      const messages = await Message.find({ game: gameId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      socket.emit('chat_history', messages.reverse());

    } catch (error) {
      console.error('Join game error:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Leave game room
  socket.on('leave_game', async (data) => {
    try {
      const { gameId } = data;
      const game = await Game.findById(gameId);
      
      if (game) {
        // Remove from spectators if applicable
        game.spectators = game.spectators.filter(id => id.toString() !== socket.userId);
        await game.save();
      }

      socket.leave(`game_${gameId}`);
      
      // Update connection info
      const connection = activeConnections.get(socket.userId);
      if (connection) {
        connection.currentGame = null;
      }

      // Notify others
      socket.to(`game_${gameId}`).emit('player_left', {
        userId: socket.userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Leave game error:', error);
    }
  });

  // Handle game moves
  socket.on('make_move', async (data) => {
    try {
      const { gameId, position, moveData } = data;
      const game = await Game.findById(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Validate move
      const result = game.makeMove(socket.userId, position, moveData);
      
      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }

      // Save game
      await game.save();

      // Broadcast move to all players in the game
      io.to(`game_${gameId}`).emit('move_made', {
        player: socket.userId,
        position,
        symbol: game.moves[game.moves.length - 1].symbol,
        gameState: game.getGameState(),
        winnerResult: result.winnerResult
      });

      // Update game room
      const room = gameRooms.get(gameId);
      if (room) {
        room.game = game;
        room.lastActivity = new Date();
      }

    } catch (error) {
      console.error('Make move error:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { gameId, content } = data;
      
      if (!content || content.trim().length === 0) {
        return;
      }

      const user = await User.findById(socket.userId);
      const message = new Message({
        game: gameId,
        sender: socket.userId,
        content: content.trim()
      });

      await message.save();
      await message.populate('sender', 'username avatar');

      // Broadcast message to all players in the game
      io.to(`game_${gameId}`).emit('new_message', {
        id: message._id,
        content: message.content,
        sender: message.sender,
        timestamp: message.createdAt
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { gameId } = data;
    const room = gameRooms.get(gameId);
    
    if (room) {
      if (!typingUsers.has(gameId)) {
        typingUsers.set(gameId, new Set());
      }
      typingUsers.get(gameId).add(socket.userId);
      
      socket.to(`game_${gameId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: true
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const { gameId } = data;
    const room = gameRooms.get(gameId);
    
    if (room && typingUsers.has(gameId)) {
      typingUsers.get(gameId).delete(socket.userId);
      
      socket.to(`game_${gameId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: false
      });
    }
  });

  // Handle game actions
  socket.on('ready_up', async (data) => {
    try {
      const { gameId } = data;
      const game = await Game.findById(gameId);
      
      if (game) {
        const player = game.players.find(p => p.user.toString() === socket.userId);
        if (player) {
          player.isReady = true;
          await game.save();
          
          io.to(`game_${gameId}`).emit('player_ready', {
            userId: socket.userId,
            isReady: true
          });

          // Check if all players are ready
          const allReady = game.players.every(p => p.isReady);
          if (allReady && game.players.length >= 2) {
            game.status = 'active';
            game.currentTurn = game.players[0].user;
            game.players[0].isCurrentTurn = true;
            await game.save();
            
            io.to(`game_${gameId}`).emit('game_started', game.getGameState());
          }
        }
      }
    } catch (error) {
      console.error('Ready up error:', error);
    }
  });

  socket.on('forfeit_game', async (data) => {
    try {
      const { gameId } = data;
      const game = await Game.findById(gameId);
      
      if (game && game.status === 'active') {
        game.status = 'completed';
        const opponent = game.players.find(p => p.user.toString() !== socket.userId);
        if (opponent) {
          game.winner = opponent.user;
        }
        await game.save();
        
        io.to(`game_${gameId}`).emit('game_forfeited', {
          forfeitedBy: socket.userId,
          gameState: game.getGameState()
        });
      }
    } catch (error) {
      console.error('Forfeit game error:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Remove from active connections
    activeConnections.delete(socket.userId);
    
    // Remove from typing indicators
    for (const [gameId, typingSet] of typingUsers.entries()) {
      typingSet.delete(socket.userId);
    }
    
    // Notify games about disconnection
    const connection = activeConnections.get(socket.userId);
    if (connection && connection.currentGame) {
      socket.to(`game_${connection.currentGame}`).emit('player_disconnected', {
        userId: socket.userId,
        timestamp: new Date()
      });
    }
  });

  // Handle reconnection
  socket.on('reconnect_attempt', (data) => {
    console.log(`User ${socket.userId} attempting to reconnect`);
    socket.emit('reconnection_attempted');
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });

  // Handle game state requests
  socket.on('request_game_state', async (data) => {
    try {
      const { gameId } = data;
      const game = await Game.findById(gameId);
      
      if (game) {
        socket.emit('game_state', game.getGameState());
      }
    } catch (error) {
      console.error('Request game state error:', error);
    }
  });

  // Handle spectator actions
  socket.on('spectate_game', async (data) => {
    try {
      const { gameId } = data;
      const game = await Game.findById(gameId);
      
      if (game && game.gameConfig.allowSpectators) {
        game.addSpectator(socket.userId);
        await game.save();
        
        socket.join(`game_${gameId}`);
        socket.emit('spectating_started', { gameId });
      }
    } catch (error) {
      console.error('Spectate game error:', error);
    }
  });
};

// Utility functions
const getActiveGames = () => {
  return Array.from(gameRooms.keys());
};

const getGameRoom = (gameId) => {
  return gameRooms.get(gameId);
};

const cleanupInactiveGames = async () => {
  const now = new Date();
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
  
  for (const [gameId, room] of gameRooms.entries()) {
    if (now - room.lastActivity > inactiveThreshold) {
      // Mark game as abandoned if it's been inactive
      try {
        const game = await Game.findById(gameId);
        if (game && game.status === 'waiting') {
          game.status = 'abandoned';
          await game.save();
        }
      } catch (error) {
        console.error('Cleanup error for game:', gameId, error);
      }
      
      gameRooms.delete(gameId);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupInactiveGames, 10 * 60 * 1000);

module.exports = {
  handleSocketConnection,
  getActiveGames,
  getGameRoom,
  activeConnections
}; 