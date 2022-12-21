const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const asyncHandler = require('express-async-handler')

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    res.status(401)
    throw new Error('Not authorized, please login')
  }

  //   VERIFY TOKEN
  const verified = jwt.verify(token, process.env.JWT_SECRET)
  if (!verified) {
    res.status(401)
    throw new Error('Invalid token')
  }

  //   GET USER ID FROM TOKEN
  const user = await User.findById(verified.id).select('-password')

  //   VERIFY USER

  if (!user) {
    res.status(401)
    throw new Error('User not found')
  }
  req.user = user
  next()
})

module.exports = protect
