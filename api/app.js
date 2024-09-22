const express = require('express')
const app = express()

require('dotenv').config();

require('./dbConnections');

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const manageRoutes = require('./routes/manageRoutes');

app.get('/', function (req, res) {
  res.send('Hello World')
})

// Routes
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/manage', manageRoutes);

app.listen(process.env.PORT || 3000, () => {
  console.log('Server is running on port' + process.env.PORT || 3000)
})