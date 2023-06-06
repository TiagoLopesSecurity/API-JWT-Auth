const mongoose = require('mongoose') // Import the express module

const User = mongoose.model('User', { // Set the name "Users" to Mongo DB collection
    name: String,
    email: String,
    password: String
})

module.exports = User // Export User module