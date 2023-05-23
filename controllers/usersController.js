const Player = require('../models/playerModel');
const multer = require('multer');
const path = require('path')
const upload = multer({
    dest: path.join(__dirname, '../public/images/')
});
const usersController = {
  getAllPlayer: async (req, res) => {
    try {
      const leaderboardData = await Player.find();
      const page = parseInt(req.query.page) || 1;
      const playersPerPage = 10;
      const startIndex = (page - 1) * playersPerPage;
      const endIndex = page * playersPerPage;
      const sortedPlayers = leaderboardData.sort((a, b) => b.point - a.point);
      const players = sortedPlayers.slice(startIndex, endIndex);
      const playersWithIndex = players.map((player, index) => ({
        ...player,
        index: index + 1
      }));
      const totalPages = Math.ceil(leaderboardData.length / playersPerPage);
      res.render('home/leaderboard', { players: playersWithIndex, currentPage: page, totalPages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve players' });
    }
  },
  getPlayer: async (req, res) => {
    try {
      const player = await Player.findById(req.params.id);
      res.render('home/profile', { user: player });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch player information.' });
    }
  },
  updateProfile: async (req, res) => {
    upload.single('profileImage')(req, res, async (error) => {
      if (error instanceof multer.MulterError) {
        res.status(500).json({ message: 'Error uploading the profile image.' });
      } else if (error) {
        res.status(500).json({ message: error.message });
      } else {
        const file = req.file;
        try {
          const user = await Player.findById(req.id);
          user.image = `/images/${file.filename}`;
          await user.save();
          res.redirect(`/users/${user.id}`);
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      }
    });
  },
};

module.exports = usersController;
