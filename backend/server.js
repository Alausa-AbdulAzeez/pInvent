const dotenv = require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const userRoute = require('./routes/userRoutes')
const errorHandler = require('./middleWare/errorMiddleware')
const cookieParser = require('cookie-parser')

const app = express()

const PORT = process.env.PORT || 5000

// MIDDLEWARES
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

// ROUTES
app.use('/api/users/', userRoute)

// Error handler
app.use(errorHandler)

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log('DB connection successful')
    })
  })
  .catch((err) => console.log(err))
