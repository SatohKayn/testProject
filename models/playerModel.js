const mongoose = require('mongoose')

const playerSchema = mongoose.Schema(
    {
        username:{
            type: String,
            unique: true,
            require: true
        },
        password:{
            type: String,
            require: true
        },
        point:{
            type: Number,
            require: true,
            default: 1000
        },
        image:{
            type: String,
            require: true,
            default: '/images/user_icon.png'
        },
        wins:{
            type: Number,
            require: true,
            default: 0
        },
        loses:{
            type: Number,
            require: true,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

const Player = mongoose.model('Player', playerSchema)

module.exports = Player