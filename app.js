/* imports */
require('dotenv').config()
const express = require('express') // Import the express module
const mongoose = require('mongoose')
const bcrypt = require('bcrypt') // create hashes
const jwt = require('jsonwebtoken')

const app = express() // Initialize express

// Config JSON response
app.use(express.json()) // accept JSON format

// Models
const User = require('./models/User') // Import User module

// Open Route - Public Route
app.get('/', (req,res) => {
    res.status(200).json({msg: 'Welcome to our API!'})
})

// Private Route
app.get("/user/:id", checkToken, async (req, res) => {
    const id = req.params.id

    // check if user exists
    const user = await User.findById(id, '-password') // dont return the user password

    if(!user) {
        return res.status(404).json({ msg: 'User not found' })
    }

    res.status(200).json({ user })
})

// Check token
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        return res.status(401).json({ msg: 'Access denied!' })
    }

    try {
        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()
    } catch (error) {
        res.status(400).json({msg: "Invalid token!"})
    }
}

// Register User
app.post('/auth/register', async(req, res) => {
    const {name, email, password, confirmpassword} = req.body

    // validations
    if(!name) {
        return res.status(422).json({msg: 'The name field is required!'})
    }

    if(!email) {
        return res.status(422).json({msg: 'The email field is required!'})
    }

    if(!password) {
        return res.status(422).json({msg: 'The password field is required!'})
    }

    if(password !== confirmpassword) {
        return res.status(422).json({msg: 'Both passwords must be the same!'})
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email }) // verify if the email is registered
    if(userExists) {
        return res.status(422).json({ msg: 'Email already registered!' })
    }

    // Create password
    const salt = await bcrypt.genSalt(12) // add a salt to the original password
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user
    const user = new User({
        name,
        email,
        password: passwordHash, // convert password into a hash and save it to the db
    })

    try {
        await user.save() // save the user on the database
        res.status(201).json({ msg: 'User created with success!' })

    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Server Error!' })
    }
})

// Login User
app.post('/auth/login', async (req, res) => {
    const {email, password} = req.body

    // validations
    if(!email) {
        return res.status(422).json({msg: 'The email field is required!'})
    }

    if(!password) {
        return res.status(422).json({msg: 'The password field is required!'})
    }

    // check if user exists
    const user = await User.findOne({ email: email }) // verify if the email is registered
    if(!user) {
        return res.status(404).json({ msg: 'User not found!' })
    }

    // check if password is correct
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(422).json({ msg: 'Invalid password!' })
    }

    try {
        
        const secret = process.env.SECRET

        const token = jwt.sign({
            id: user._id,
        }, 
        secret,
        )

        res.status(200).json({ msg: "Authenticated sucessfully!", token })

    } catch (err) {
        console.log(error)
        res.status(500).json({ msg: 'Server Error!' })
    }
})

//Credentials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

// Mongo DB Connection with mongoose
mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.vg3eq1j.mongodb.net/`)
.then(() =>{
    app.listen(3000) // receive connections from port 3000
    console.log('Connected to MongoDB sucessfully!')
}).catch((err) => console.log(err))


