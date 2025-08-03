import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { gameService } from '../services/gameService';
import ParticleBackground from './3D/ParticleBackground';
import FloatingGameCards from './3D/FloatingGameCard';
import SoundManager from './Audio/SoundManager';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadGames();
    checkCurrentGame();
    
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loadGames = async () => {
    try {
      const response = await gameService.getAvailableGames();
      setGames(response.games);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentGame = async () => {
    try {
      const response = await gameService.getCurrentGame();
      if (response.game) {
        setCurrentGame(response.game);
      }
    } catch (error) {
      console.error('Failed to check current game:', error);
    }
  };

  const handleCreateGame = async () => {
    setCreatingGame(true);
    SoundManager.playClick();
    try {
      const response = await gameService.createGame();
      navigate(`/game/${response.game.id}`);
    } catch (error) {
      alert(error.message);
    } finally {
      setCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameId) => {
    SoundManager.playJoin();
    try {
      await gameService.joinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    SoundManager.playClick();
    logout();
    navigate('/login');
  };

  if (currentGame) {
    return (
      <div className="dashboard-container">
        <ParticleBackground mousePosition={mousePosition} />
        
        <motion.div 
          className="dashboard-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="current-game-card"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Continue Your Game
            </motion.h2>
            
            <motion.div 
              className="game-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p>Game #{currentGame.id.slice(-6)}</p>
              <p>Status: {currentGame.status}</p>
              <p>Players: {currentGame.players.length}/2</p>
            </motion.div>
            
            <motion.button 
              onClick={() => navigate(`/game/${currentGame.id}`)}
              className="continue-game-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue Game
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ParticleBackground mousePosition={mousePosition} />
      
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome, {user.username}!
        </motion.h1>
        
        <motion.button 
          onClick={handleLogout}
          className="logout-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Logout
        </motion.button>
      </motion.div>

      <motion.div 
        className="dashboard-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.div 
          className="action-section"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Start Playing
          </motion.h2>
          
          <motion.button 
            onClick={handleCreateGame}
            disabled={creatingGame}
            className="create-game-button"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {creatingGame ? 'Creating...' : 'Create New Game'}
          </motion.button>
        </motion.div>

        <motion.div 
          className="games-section"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Available Games
          </motion.h2>
          
          <AnimatePresence>
            {loading ? (
              <motion.div 
                className="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Loading games...
              </motion.div>
            ) : games.length === 0 ? (
              <motion.div 
                className="no-games"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p>No games available. Create a new game to start playing!</p>
              </motion.div>
            ) : (
              <motion.div 
                className="games-3d-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <FloatingGameCards 
                  games={games} 
                  onJoinGame={handleJoinGame}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard; 