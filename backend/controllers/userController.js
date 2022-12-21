const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// GENERATE TOKEN
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' })
}

/*


*/
// REGISTER NEW USER
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    res.status(400)
    throw new Error('Please fill in all required fields')
  }
  if (password.length < 6) {
    res.status(400)
    throw new Error('Password must be up to 6 characters')
  }

  //   Check if user email exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    res.status(400)
    throw new Error('Email already in use')
  }

  //   Create new user
  const user = await User.create({ name, email, password })

  if (user) {
    const { _id, name, email, phone, photo, bio } = user

    // Token
    const token = generateToken(_id)

    // Send cookie
    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: 'none',
      secure: false,
    })

    res.status(201).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
      token,
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})

/*


*/
// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate
  if (!email || !password) {
    res.status(400)
    throw new Error('Please add email and password')
  }

  // Check if user exists
  const user = await User.findOne({ email })
  if (!user) {
    res.status(400)
    throw new Error('User not found, Please signup')
  }

  // Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password)

  if (user && isPasswordCorrect) {
    const { _id, name, email, phone, photo, bio } = user
    const token = generateToken(_id)

    res.cookie('token', token, {
      path: '/',
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: 'none',
      secure: false,
    })

    res.status(200).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
      token,
    })
  } else {
    res.status(400)
    throw new Error('Invalid email or password')
  }
})

/*


*/
// Logout user
const logoutUser = asyncHandler((req, res) => {
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'none',
    secure: false,
  })

  res.status(200).json({ message: 'User logged out successfully' })
})

/*


*/
// FETCH USER
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    const { _id, name, email, phone, photo, bio } = user
    res.status(200).json({
      _id,
      name,
      email,
      phone,
      photo,
      bio,
    })
  } else {
    res.status(400)
    throw new Error('User not found')
  }
})

/*


*/
// GET LOGIN STATUS
const loginStatus = asyncHandler(async (req, res) => {
  const { token } = await req.cookies

  if (!token) {
    return res.json(false)
  }

  // CHECK TOKEN VALIDITY
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)
  if (!verifiedToken) {
    return res.json(false)
  }

  return res.json(true)

  res.status(200).json({ message: 'Logged in' })
})

/*


*/
// UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  res.send('update user')
})

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
}
