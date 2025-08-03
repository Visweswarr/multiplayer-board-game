const mongoose = require('mongoose');
const GameLogic = require('../utils/gameLogic');

const gameSchema = new mongoose.Schema({
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    symbol: {
      type: String,
      enum: ['X', 'O', 'red', 'yellow', 'black', 'white'],
      required: true
    },
    isCurrentTurn: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    timeRemaining: {
      type: Number,
      default: null
    },
    isReady: {
      type: Boolean,
      default: false
    }
  }],
  board: {
    type: [String],
    default: Array(9).fill(null) // Configurable based on game type
  },
  gameType: {
    type: String,
    enum: ['tic-tac-toe', 'connect-four', 'checkers'],
    default: 'tic-tac-toe'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'draw', 'abandoned'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moves: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: {
      type: Number,
      required: true
    },
    symbol: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    moveData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  gameConfig: {
    maxPlayers: {
      type: Number,
      default: 2
    },
    timeLimit: {
      type: Number,
      default: null // in seconds
    },
    boardSize: {
      type: Number,
      default: 9 // for tic-tac-toe
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowSpectators: {
      type: Boolean,
      default: true
    }
  },
  spectators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMoveAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  gameStats: {
    totalMoves: {
      type: Number,
      default: 0
    },
    gameDuration: {
      type: Number,
      default: 0
    },
    winnerLine: {
      type: [Number],
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
gameSchema.index({ status: 1, gameType: 1 });
gameSchema.index({ 'players.user': 1 });
gameSchema.index({ createdAt: -1 });

// Pre-save middleware to initialize board based on game type
gameSchema.pre('save', function(next) {
  if (this.isNew) {
    this.initializeBoard();
  }
  next();
});

// Instance methods
gameSchema.methods.initializeBoard = function() {
  switch (this.gameType) {
    case 'tic-tac-toe':
      this.board = Array(9).fill(null);
      this.gameConfig.boardSize = 9;
      break;
    case 'connect-four':
      this.board = Array(42).fill(null); // 6x7 board
      this.gameConfig.boardSize = 42;
      break;
    case 'checkers':
      this.board = this.initializeCheckersBoard();
      this.gameConfig.boardSize = 32;
      break;
    default:
      this.board = Array(9).fill(null);
  }
};

gameSchema.methods.initializeCheckersBoard = function() {
  const board = Array(32).fill(null);
  // Initialize checkers pieces
  for (let i = 0; i < 12; i++) {
    board[i] = 'red';
    board[31 - i] = 'black';
  }
  return board;
};

gameSchema.methods.isFull = function() {
  return this.players.length >= this.gameConfig.maxPlayers;
};

gameSchema.methods.isValidMove = function(position, playerId) {
  if (this.status !== 'active') return false;
  if (this.currentTurn.toString() !== playerId.toString()) return false;
  
  return GameLogic.isValidMove(this.board, position, this.gameType);
};

gameSchema.methods.makeMove = function(playerId, position, moveData = {}) {
  if (!this.isValidMove(position, playerId)) {
    return { success: false, message: 'Invalid move' };
  }

  const player = this.players.find(p => p.user.toString() === playerId.toString());
  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  // Make the move
  this.board[position] = player.symbol;
  this.moves.push({
    player: playerId,
    position,
    symbol: player.symbol,
    moveData
  });

  this.lastMoveAt = new Date();
  this.gameStats.totalMoves++;

  // Check for winner
  const winnerResult = GameLogic.checkWinner(this.board, this.gameType);
  if (winnerResult) {
    this.status = 'completed';
    this.winner = playerId;
    this.completedAt = new Date();
    this.gameStats.winnerLine = winnerResult.line;
    this.updatePlayerStats();
  } else if (GameLogic.isDraw(this.board, this.gameType)) {
    this.status = 'draw';
    this.completedAt = new Date();
  } else {
    // Switch turns
    this.switchTurn();
  }

  return { success: true, winnerResult };
};

gameSchema.methods.switchTurn = function() {
  const currentPlayerIndex = this.players.findIndex(p => p.user.toString() === this.currentTurn.toString());
  const nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
  this.currentTurn = this.players[nextPlayerIndex].user;
  
  // Update turn indicators
  this.players.forEach((player, index) => {
    player.isCurrentTurn = index === nextPlayerIndex;
  });
};

gameSchema.methods.updatePlayerStats = function() {
  if (this.winner) {
    // Update winner stats
    this.players.forEach(player => {
      if (player.user.toString() === this.winner.toString()) {
        player.score += 1;
      }
    });
  }
};

gameSchema.methods.addSpectator = function(userId) {
  if (!this.spectators.includes(userId)) {
    this.spectators.push(userId);
  }
};

gameSchema.methods.removeSpectator = function(userId) {
  this.spectators = this.spectators.filter(id => id.toString() !== userId.toString());
};

gameSchema.methods.getGameState = function() {
  return {
    id: this._id,
    board: this.board,
    status: this.status,
    currentTurn: this.currentTurn,
    players: this.players,
    winner: this.winner,
    gameType: this.gameType,
    lastMove: this.moves.length > 0 ? this.moves[this.moves.length - 1] : null,
    gameStats: this.gameStats,
    createdAt: this.createdAt,
    lastMoveAt: this.lastMoveAt
  };
};

// Static methods
gameSchema.statics.findAvailableGames = function() {
  return this.find({
    status: 'waiting',
    'gameConfig.isPrivate': false,
    $expr: { $lt: [{ $size: '$players' }, '$gameConfig.maxPlayers'] }
  }).populate('players.user', 'username avatar');
};

gameSchema.statics.findUserGames = function(userId) {
  return this.find({
    'players.user': userId,
    status: { $in: ['waiting', 'active'] }
  }).populate('players.user', 'username avatar');
};

module.exports = mongoose.model('Game', gameSchema); 