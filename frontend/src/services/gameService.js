import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

const gameService = {
  async createGame(gameType = 'tic-tac-toe') {
    try {
      const response = await axios.post(`${API_URL}/game/create`, {
        gameType
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create game');
    }
  },

  async joinGame(gameId) {
    try {
      const response = await axios.post(`${API_URL}/game/join/${gameId}`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to join game');
    }
  },

  async getAvailableGames() {
    try {
      const response = await axios.get(`${API_URL}/game/available`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get available games');
    }
  },

  async getGame(gameId) {
    try {
      const response = await axios.get(`${API_URL}/game/${gameId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get game');
    }
  },

  async makeMove(gameId, row, col) {
    try {
      const response = await axios.post(`${API_URL}/game/${gameId}/move`, {
        row,
        col
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to make move');
    }
  },

  async getCurrentGame() {
    try {
      const response = await axios.get(`${API_URL}/game/current`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get current game');
    }
  }
};

export { gameService }; 