const mongoose = require('mongoose')

// Argument validaiton
if (!(process.argv.length === 3 || process.argv.length === 5)) {
  console.log('invalid commands argument!')
  process.exit(1)
}

// get password
const password = process.argv[2]

// Connect to MongoDB
const url = `mongodb+srv://ventura:${password}@fullstack.dn9l6zi.mongodb.net/?retryWrites=true&w=majority&appName=fullstack`
mongoose.set('strictQuery', false)
mongoose.connect(url)

// Define schema
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    required: true
  },
  number: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^(\d{2,3})-\d{5,}$/.test(v)
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  }
})

// Define model
const Person = mongoose.model('Person', personSchema)

// get all persons
if (process.argv.length === 3) {
  Person.find({}).then(result => {
    console.log('phonebook:')
    result.forEach(person => {
      console.log(`${person.name} ${person.number}`)
    })
    mongoose.connection.close()
  })
} else { // add person
  const name = process.argv[3]
  const number = process.argv[4]
  const person = new Person({
    name: name,
    number: number
  })

  person.save().then(result => {
    console.log(`added ${name} number ${number} to phonebook`)
    mongoose.connection.close()
  })
}

