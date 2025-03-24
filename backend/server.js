const express = require('express');
const cors = require('cors');
const recipeRoutes = require('./routes/recipe');

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors());

// Routes
app.use('/api', recipeRoutes);


app.get('/', (req, res) => {
  res.send('Backend server is running!');
});


app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});