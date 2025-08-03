import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { gameService } from '../services/gameService';
import GameBoard3D from './3D/GameBoard3D';
import ParticleBackground from './3D/ParticleBackground';
import SoundManager from './Audio/SoundManager';
import './Game.css';

const Game = () => {
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

  useEffect(() => {
    loadGame();
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [gameId]);

  useEffect(() => {
    if (socket && isConnected && game) {
      socket.emit('join_game', gameId);

      socket.on('game_state', (data) => {
        setGame(data.game);
      });

      socket.on('game_updated', (data) => {
        setGame(data.game);
        if (data.game.lastMove) {
          SoundManager.playMove();
        }
      });

      socket.on('player_joined', (data) => {
        console.log(`${data.player.username} joined the game`);
        SoundManager.playJoin();
      });

      socket.on('player_disconnected', (data) => {
        console.log(`${data.user} disconnected`);
      });

      socket.on('new_message', (data) => {
        setMessages(prev => [...prev, data.message]);
        SoundManager.playMessage();
      });

      socket.on('user_typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== data.user), data.user]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.user));
        }
      });

      socket.on('error', (data) => {
        setError(data.message);
      });

      return () => {
        socket.off('game_state');
        socket.off('game_updated');
        socket.off('player_joined');
        socket.off('player_disconnected');
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('error');
      };
    }
  }, [socket, isConnected, game, gameId]);

  const loadGame = async () => {
    try {
      const response = await gameService.getGame(gameId);
      setGame(response.game);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = (row, col) => {
    if (!socket || !game || game.status !== 'active') return;

    const isMyTurn = game.currentTurn === user.id;
    if (!isMyTurn) return;

    SoundManager.playClick();
    socket.emit('make_move', { row, col });
  };

  const handleSendMessage = (message) => {
    if (!socket) return;
    socket.emit('send_message', { content: message });
  };

  const handleTyping = (isTyping) => {
    if (!socket) return;
    socket.emit('typing', isTyping);
  };

  if (loading) {
    return (
      <div className="game-container">
        <ParticleBackground mousePosition={mousePosition} />
        <motion.div 
          className="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading game...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-container">
        <ParticleBackground mousePosition={mousePosition} />
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>Error</h2>
          <p>{error}</p>
          <motion.button 
            onClick={() => navigate('/')}
            className="back-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="game-container">
        <ParticleBackground mousePosition={mousePosition} />
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>Game Not Found</h2>
          <motion.button 
            onClick={() => navigate('/')}
            className="back-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const isMyTurn = game.currentTurn === user.id;
  const myPlayer = game.players.find(p => p.user === user.id);
  const opponent = game.players.find(p => p.user !== user.id);

  return (
    <div className="game-container">
      <ParticleBackground mousePosition={mousePosition} />
      
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
        
        <motion.div 
          className="game-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1>Game #{gameId.slice(-6)}</h1>
          <div className="connection-status">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </motion.div>
      </motion.div>

      <motion.div 
        className="game-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.div 
          className="game-board-section"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
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
            </motion.div>
            
            <motion.div 
              className={`player ${opponent?.isCurrentTurn ? 'current-turn' : ''}`}
              whileHover={{ scale: 1.05 }}
            >
              <h3>Opponent ({opponent?.symbol || 'O'})</h3>
              <p>{opponent?.user?.username || 'Waiting...'}</p>
            </motion.div>
          </motion.div>

          <motion.div 
            className="game-status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {game.status === 'waiting' && (
              <p>Waiting for opponent to join...</p>
            )}
            {game.status === 'active' && (
              <p>{isMyTurn ? "Your turn" : "Opponent's turn"}</p>
            )}
            {game.status === 'completed' && (
              <p>
                {game.winner === user.id 
                  ? "🎉 You won!" 
                  : "😔 You lost!"}
              </p>
            )}
            {game.status === 'draw' && (
              <p>🤝 It's a draw!</p>
            )}
          </motion.div>

          <motion.div 
            className="game-board-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 }}
          >
            <GameBoard3D 
              board={game.board}
              onMove={handleMove}
              disabled={!isMyTurn || game.status !== 'active'}
              lastMove={game.lastMove}
            />
          </motion.div>

          {(game.status === 'completed' || game.status === 'draw') && (
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
      </motion.div>
    </div>
  );
};

export default Game; 