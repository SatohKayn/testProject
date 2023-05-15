const router = require('express').Router()
const bcrypt = require('bcrypt')
const Player = require('../models/playerModel.js')
const joi = require('@hapi/joi')
const {createTokens } = require("../utils/JWT");
const schema = joi.object({
    username: joi.string().min(6).required(),
    password: joi.string().min(6).required()
}) 
router.post('/register', async (req, res) => {
    const {error} = schema.validate(req.body)
    if(error) return res.json({ success: false, message: error.details[0].message})
    const { username, password } = req.body;
    const existingUser = await Player.findOne({ username: username });
    console.log(existingUser)
    if(existingUser) return res.json({ success: false, message: 'Username have been use'})
    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.json({ success: false, message: 'Error hashing password' });
        } else {
            // Create a new user instance with the hashed password
            const newUser = new Player({ username, password: hash });
            // Save the user to the database
            newUser.save()
                .then(() => {
                    res.json({ success: true, message: 'Registration successful' });
                })
                .catch((error) => {
                    console.error('Error saving user:', error);
                    res.json({ success: false, message: 'Error saving user' });
                });
        }
    });
});

// Login route
router.post('/login', (req, res) => {
    const {error} = schema.validate(req.body)
    if(error) return res.json({ success: false, message: error.details[0].message})
    const { username, password } = req.body;

    // Find the user in the database by username
    Player.findOne({ username })
        .then((user) => {
            if (user) {
                // Compare the entered password with the stored hash
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) {
                        console.error('Error comparing passwords:', err);
                        res.json({ success: false, message: 'Error comparing passwords' });
                    } else if (result) {
                        const accessToken = createTokens(user);

                        res.cookie("access-token", accessToken, {
                            maxAge: 60 * 60 * 24 * 7 * 1000,
                            httpOnly: true,
                        });

                        res.json({ success: true, message: 'LOGGED IN' });
                    } else {
                        res.json({ success: false, message: 'Invalid username or password' });
                    }
                });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        })
        .catch((error) => {
            console.error('Error finding user:', error);
            res.json({ success: false, message: 'Error finding user' });
        });
});

module.exports = router