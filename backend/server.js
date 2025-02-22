const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

const recipeRoutes = require('./routes/recipe');
app.use('/api', recipeRoutes);

const mongoose = require('mongoose');
const groceryRoutes = require('./routes/grocery');

mongoose.connect('mongodb://localhost/grocery-list', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/api', recipeRoutes);
app.use('/api', groceryRoutes);