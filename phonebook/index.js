const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()
const app = express()


//const password = process.argv[2]
const Person = require('./models/person')

app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))
app.use(express.static('dist'))

//const url = process.env.MONGODB_URI

morgan.token('body', (req, res) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  }
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => {
      next(error)
    })
})

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
    .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
  const date = new Date()
  Person.find({}).then(persons => {
    response.send(`<p>Phonebook has info for ${persons.length} people</p><p>${date}</p>`)
  })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => {
      next(error)
    })
})


app.post('/api/persons', async (request, response, next) => {
  const body = request.body

  // Generate error if name or number is missing
  if (!body.name || !body.number) {
    const error = new Error('Name or number is missing')
    error.name = 'ValidationError'
    return next(error)
  }


  try {
    // Fetch all persons from the database to check for duplicates
    const persons = await Person.find({})

    if (persons.find(person => person.name === body.name)) {
      return response.status(400).json({
        error: 'name must be unique'
      })
    }

    const person = new Person({
      name: body.name,
      number: body.number
    })

    const savedPerson = await person.save()
    response.json(savedPerson)
  } catch (error) {
    next(error)
  }
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body
  console.log('Received ID for update:', request.params.id)

  Person.findByIdAndUpdate(request.params.id, { name, number }, { new: true, runValidators: true, context: 'query' })
    .then(updatedPerson => {
      if (updatedPerson) {
        response.json(updatedPerson)
      } else {
        const error = new Error(`${name} is not found`)
        error.name = 'PersonNotFound'
        next(error)
      }
    })
    .catch(error => next(error))
})


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

// error handler
const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  switch (error.name) {
  case 'CastError':
    response.status(400).send({ error: 'Malformatted ID' })
    break
  case 'ValidationError':
    response.status(400).json({ error: error.message })
    break
  case 'PersonNotFound':
    response.status(404).send({ error: error.message })
    break
  default:
    response.status(500).json({ error: 'Internal server error' })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})