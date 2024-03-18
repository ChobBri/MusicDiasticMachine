const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const poemsRouter = require('./poemsRouter')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

mongoose.set('strictQuery', false)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())

app.use('/api/poems', poemsRouter)

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})