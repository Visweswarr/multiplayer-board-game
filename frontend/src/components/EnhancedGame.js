import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { gameService } from '../services/gameService';
import EnhancedGameBoard3D from './3D/EnhancedGameBoard3D';
import AdvancedParticleSystem from './3D/AdvancedParticleSystem';
import EnhancedSoundManager from './Audio/EnhancedSoundManager';
import Chat from './Chat';
import './EnhancedGame.css';

const EnhancedGame = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showChat, setShowChat] = useState(false);
  const [gameStats, setGameStats] = useState({});
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [lastMovePosition, setLastMovePosition] = useState(null);
  const [winnerLine, setWinnerLine] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const gameContainerRef = useRef();
  const soundManagerRef = useRef();
  const gameTimerRef = useRef();

  // Initialize sound manager
  useEffect(() => {
    soundManagerRef.current = EnhancedSoundManager;
    soundManagerRef.current.startAmbient();
    
    return () => {
      soundManagerRef.current.stopAmbient();
    };
  }, []);

  // Mouse tracking for particle system
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = gameContainerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width * 2 - 1,
          y: (e.clientY - rect.top) / rect.height * 2 - 1
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Game timer
  useEffect(() => {
    if (game && game.status === 'active' && !gameStartTime) {
      setGameStartTime(Date.now());
    }

    if (gameStartTime && game?.status === 'active') {
      gameTimerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [game, gameStartTime]);

  // Load game data
  useEffect(() => {
    loadGame();
  }, [gameId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join_game', { gameId });

    socket.on('game_state', handleGameStateUpdate);
    socket.on('move_made', handleMoveMade);
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('game_started', handleGameStarted);
    socket.on('game_forfeited', handleGameForfeited);
    socket.on('error', handleSocketError);

    return () => {
      socket.emit('leave_game', { gameId });
      socket.off('game_state');
      socket.off('move_made');
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('player_disconnected');
      socket.off('game_started');
      socket.off('game_forfeited');
      socket.off('error');
    };
  }, [socket, isConnected, gameId]);

  const loadGame = async () => {
    try {
      setLoading(true);
      const gameData = await gameService.getGame(gameId);
      setGame(gameData);
      
      if (gameData.status === 'active') {
        setGameStartTime(new Date(gameData.createdAt).getTime());
      }
      
      // Check if user is spectator
      const isPlayer = gameData.players.some(p => p.user.id === user.id);
      setSpectatorMode(!isPlayer);
      
    } catch (error) {
      setError('Failed to load game');
      console.error('Load game error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameStateUpdate = (gameState) => {
    setGame(gameState);
    soundManagerRef.current?.playNotification();
  };

  const handleMoveMade = (data) => {
    setGame(data.gameState);
    setLastMovePosition(data.position);
    setWinnerLine(data.winnerResult?.line || null);
    
    soundManagerRef.current?.playMove({
      x: data.position % 3,
      y: Math.floor(data.position / 3),
      z: 0
    });

    if (data.winnerResult) {
      if (data.winnerResult.winner) {
        soundManagerRef.current?.playVictory();
      } else {
        soundManagerRef.current?.playDraw();
      }
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    soundManagerRef.current?.playMessage();
  };

  const handleUserTyping = (data) => {
    setTypingUsers(prev => {
      if (data.isTyping) {
        return [...prev.filter(id => id !== data.userId), data.userId];
      } else {
        return prev.filter(id => id !== data.userId);
      }
    });
  };

  const handlePlayerJoined = (data) => {
    soundManagerRef.current?.playConnect();
    // Update game state if needed
  };

  const handlePlayerLeft = (data) => {
    soundManagerRef.current?.playDisconnect();
    // Update game state if needed
  };

  const handlePlayerDisconnected = (data) => {
    soundManagerRef.current?.playNotification();
    // Show disconnection notification
  };

  const handleGameStarted = (gameState) => {
    setGame(gameState);
    setGameStartTime(Date.now());
    soundManagerRef.current?.playPowerup();
  };

  const handleGameForfeited = (data) => {
    setGame(data.gameState);
    soundManagerRef.current?.playDefeat();
  };

  const handleSocketError = (error) => {
    setError(error.message);
    soundManagerRef.current?.playInvalid();
  };

  const handleMove = useCallback((position) => {
    if (!socket || !isConnected || spectatorMode) return;

    const isMyTurn = game?.currentTurn === user.id;
    if (!isMyTurn) {
      soundManagerRef.current?.playInvalid();
      return;
    }

    socket.emit('make_move', { gameId, position });
  }, [socket, isConnected, game, user.id, gameId, spectatorMode]);

  const handleSendMessage = (content) => {
    if (!socket || !isConnected) return;
    socket.emit('send_message', { gameId, content });
  };

  const handleTyping = (isTyping) => {
    if (!socket || !isConnected) return;
    if (isTyping) {
      socket.emit('typing_start', { gameId });
    } else {
      socket.emit('typing_stop', { gameId });
    }
  };

  const handleReadyUp = () => {
    if (!socket || !isConnected) return;
    socket.emit('ready_up', { gameId });
    soundManagerRef.current?.playClick();
  };

  const handleForfeit = () => {
    if (!socket || !isConnected) return;
    if (window.confirm('Are you sure you want to forfeit this game?')) {
      socket.emit('forfeit_game', { gameId });
      soundManagerRef.current?.playDefeat();
    }
  };

  const handleSpectate = () => {
    if (!socket || !isConnected) return;
    socket.emit('spectate_game', { gameId });
    setSpectatorMode(true);
    soundManagerRef.current?.playClick();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="enhanced-game-container">
        <AdvancedParticleSystem mousePosition={mousePosition} />
        <motion.div
          className="loading-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Loading Game...
          </motion.h2>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-game-container">
        <AdvancedParticleSystem mousePosition={mousePosition} />
        <motion.div
          className="error-screen"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>Error</h2>
          <p>{error}</p>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const myPlayer = game?.players.find(p => p.user.id === user.id);
  const opponent = game?.players.find(p => p.user.id !== user.id);
  const isMyTurn = game?.currentTurn === user.id;
  const gameCompleted = game?.status === 'completed' || game?.status === 'draw';

  return (
    <div className="enhanced-game-container" ref={gameContainerRef}>
      <AdvancedParticleSystem mousePosition={mousePosition} />
      
      {/* Header */}
      <motion.div
        className="game-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.button
          onClick={() => navigate('/')}
          className="back-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back to Dashboard
        </motion.button>
        
        <motion.div className="game-info">
          <h1>Game #{gameId.slice(-6)}</h1>
          <div className="connection-status">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {gameStartTime && (
            <div className="game-timer">
              {formatTime(elapsedTime)}
            </div>
          )}
        </motion.div>

        <motion.button
          onClick={() => setShowGameMenu(!showGameMenu)}
          className="menu-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⚙️
        </motion.button>
      </motion.div>

      {/* Game Menu */}
      <AnimatePresence>
        {showGameMenu && (
          <motion.div
            className="game-menu"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button onClick={handleReadyUp}>Ready Up</button>
            <button onClick={handleForfeit}>Forfeit</button>
            <button onClick={handleSpectate}>Spectate</button>
            <button onClick={() => setShowGameMenu(false)}>Close</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Content */}
      <motion.div
        className="game-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        {/* Players Info */}
        <motion.div
          className="players-info"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.div
            className={`player ${myPlayer?.isCurrentTurn ? 'current-turn' : ''}`}
            whileHover={{ scale: 1.05 }}
          >
            <h3>You ({myPlayer?.symbol || 'X'})</h3>
            <p>{user.username}</p>
            {myPlayer?.isReady && <span className="ready-indicator">Ready</span>}
          </motion.div>
          
          <motion.div
            className={`player ${opponent?.isCurrentTurn ? 'current-turn' : ''}`}
            whileHover={{ scale: 1.05 }}
          >
            <h3>Opponent ({opponent?.symbol || 'O'})</h3>
            <p>{opponent?.user?.username || 'Waiting...'}</p>
            {opponent?.isReady && <span className="ready-indicator">Ready</span>}
          </motion.div>
        </motion.div>

        {/* Game Status */}
        <motion.div
          className="game-status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {game?.status === 'waiting' && (
            <p>Waiting for players to ready up...</p>
          )}
          {game?.status === 'active' && (
            <p>{isMyTurn ? "Your turn!" : "Opponent's turn"}</p>
          )}
          {game?.status === 'completed' && (
            <p>Game Over! {game.winner === user.id ? 'You won!' : 'You lost!'}</p>
          )}
          {game?.status === 'draw' && (
            <p>It's a draw!</p>
          )}
        </motion.div>

        {/* Game Board */}
        <motion.div
          className="game-board-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
        >
          <EnhancedGameBoard3D
            board={game?.board || []}
            onMove={handleMove}
            disabled={!isMyTurn || game?.status !== 'active' || spectatorMode}
            lastMove={lastMovePosition}
            gameType={game?.gameType || 'tic-tac-toe'}
          />
        </motion.div>

        {/* Game Actions */}
        {gameCompleted && (
          <motion.button
            onClick={() => navigate('/')}
            className="new-game-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Again
          </motion.button>
        )}
      </motion.div>

      {/* Chat Section */}
      <motion.div
        className="chat-section"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
      >
        <motion.button
          className="chat-toggle"
          onClick={() => setShowChat(!showChat)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💬 Chat
        </motion.button>

        <AnimatePresence>
          {showChat && (
            <motion.div
              className="chat-container"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Chat
                messages={messages}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                typingUsers={typingUsers}
                disabled={!isConnected}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default EnhancedGame; 