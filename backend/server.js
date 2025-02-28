const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const recipeRoutes = require('./routes/recipe');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/api', recipeRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});