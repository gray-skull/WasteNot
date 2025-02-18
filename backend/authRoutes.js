
const express = require("express")
const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

require("dotenv").config()
const router = express.Router()

//Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" })

    //Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser)
      return res.status(400).json({ error: "Email already in use" })

    const newUser = new User({ username, email, password })
    await newUser.save()

    res.status(201).json({ message: "User created successfully!" })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

//Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: "All fields required" })

    //Check if user exists
    const user = await User.findOne({ email }).then((user) => {
      if (!user) return res.status(400).json({ error: "No user exists with that email" })
    })

    //Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" })

    //Generate the JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    })

    res.status(200).json({ message: "Login successful", token, user })
  } catch (error) {
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router
