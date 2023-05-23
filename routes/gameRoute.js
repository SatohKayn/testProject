const express = require('express');
const roomsController = require('../controllers/roomsController');

const router = express.Router();

router.get('/single', (req, res) => {
    res.render('game/singlePlay')
})
router.get('/rank', (req, res) => {
    res.render('game/singlePlay')
})


module.exports = router;