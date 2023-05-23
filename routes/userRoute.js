const express = require('express');
const gameController = require('../controllers/usersController');

const router = express.Router();

router.get('/leaderboard', gameController.getAllPlayer)
router.get('/:id', gameController.getPlayer)
router.post('/profile/update-image', gameController.updateProfile)

module.exports = router;
