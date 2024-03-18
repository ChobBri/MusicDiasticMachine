const poemsRouter = require('express').Router()
const mongoose = require('mongoose')

const poemSchema = new mongoose.Schema({
  title: {
    type: String,
    minLength: 1,
    required: true,
  },
  content: {
    type: String,
    minLength: 1,
    required: true,
    unique: true,
  },
})

poemSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Poem = mongoose.model('Poem', poemSchema)

poemsRouter.get('/', async (request, response) => {
  const poems = await Poem.find({})
  response.json(poems)
})

poemsRouter.get('/:id', async (request, response) => {
  const poem = await Poem.findById(request.params.id)
  if (poem) {
    response.json(poem)
  } else {
    response.status(404).end()
  }
})

poemsRouter.post('/', async (request, response) => {
  const body = request.body

  const poem = new Poem({
    title: body.title,
    content: body.content,
  })

  const savedPoem = await poem.save()

  response.status(201).json(savedPoem)
})

poemsRouter.delete('/:id', async (request, response) => {
  await Poem.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

module.exports = poemsRouter