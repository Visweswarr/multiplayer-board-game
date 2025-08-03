const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { username, email, avatar } = req.body;
    const updateData = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user statistics
router.get('/stats', async (req, res) => {
  try {
    const games = await Game.find({
      'players.user': req.user.id,
      status: { $in: ['completed', 'draw'] }
    });

    const stats = {
      totalGames: games.length,
      wins: games.filter(game => game.winner?.toString() === req.user.id).length,
      draws: games.filter(game => game.status === 'draw').length,
      losses: games.filter(game => 
        game.status === 'completed' && 
        game.winner && 
        game.winner.toString() !== req.user.id
      ).length,
      winRate: 0,
      averageGameDuration: 0
    };

    if (stats.totalGames > 0) {
      stats.winRate = ((stats.wins / stats.totalGames) * 100).toFixed(1);
      
      const completedGames = games.filter(game => game.completedAt);
      if (completedGames.length > 0) {
        const totalDuration = completedGames.reduce((sum, game) => {
          return sum + (new Date(game.completedAt) - new Date(game.createdAt));
        }, 0);
        stats.averageGameDuration = Math.round(totalDuration / completedGames.length / 1000); // in seconds
      }
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's recent games
router.get('/recent-games', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      'players.user': req.user.id
    })
    .populate('players.user', 'username avatar')
    .populate('winner', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Game.countDocuments({
      'players.user': req.user.id
    });

    res.json({
      games,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's active games
router.get('/active-games', async (req, res) => {
  try {
    const games = await Game.find({
      'players.user': req.user.id,
      status: { $in: ['waiting', 'active'] }
    }).populate('players.user', 'username avatar');

    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's game history with opponent
router.get('/history/:opponentId', async (req, res) => {
  try {
    const { opponentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      'players.user': { $all: [req.user.id, opponentId] },
      status: { $in: ['completed', 'draw'] }
    })
    .populate('players.user', 'username avatar')
    .populate('winner', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Game.countDocuments({
      'players.user': { $all: [req.user.id, opponentId] },
      status: { $in: ['completed', 'draw'] }
    });

    const stats = {
      totalGames: total,
      wins: games.filter(game => game.winner?.toString() === req.user.id).length,
      losses: games.filter(game => 
        game.winner && 
        game.winner.toString() !== req.user.id
      ).length,
      draws: games.filter(game => game.status === 'draw').length
    };

    res.json({
      games,
      stats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.user.id }
    })
    .select('username avatar stats')
    .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { gameType, timeFrame } = req.query;
    
    let matchStage = {};
    if (gameType) {
      matchStage.gameType = gameType;
    }
    
    if (timeFrame) {
      const now = new Date();
      let startDate;
      switch (timeFrame) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      matchStage.createdAt = { $gte: startDate };
    }

    const leaderboard = await Game.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players.user',
          wins: {
            $sum: {
              $cond: [
                { $eq: ['$winner', '$players.user'] },
                1,
                0
              ]
            }
          },
          totalGames: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          avatar: '$user.avatar',
          wins: 1,
          totalGames: 1,
          winRate: {
            $multiply: [
              { $divide: ['$wins', '$totalGames'] },
              100
            ]
          }
        }
      },
      { $sort: { wins: -1, winRate: -1 } },
      { $limit: 50 }
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 