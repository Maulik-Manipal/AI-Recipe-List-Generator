const express = require('express');
const axios = require('axios');
const router = express.Router();

require('dotenv').config();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

router.post('/recipe', async (req, res) => {
  const { dish, servings } = req.body;

  if (!dish || !servings) {
    return res.status(400).json({ error: 'Dish name and servings are required' });
  }

  try {
    // Search for the recipe by dish name
    const searchResponse = await axios.get(`${SPOONACULAR_BASE_URL}/complexSearch`, {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        query: dish,
        number: 1 // Get the first matching recipe
      }
    });

    if (searchResponse.data.results.length === 0) {
      return res.status(404).json({ error: 'No recipes found for this dish' });
    }

    const recipeId = searchResponse.data.results[0].id;

    // Get detailed recipe information
    const recipeResponse = await axios.get(`${SPOONACULAR_BASE_URL}/${recipeId}/information`, {
      params: { apiKey: SPOONACULAR_API_KEY }
    });

    const recipe = recipeResponse.data;

    // Format ingredients as strings with adjusted servings
    const ingredients = recipe.extendedIngredients.map(ing => 
      `${(ing.measures.metric.amount * (servings / recipe.servings)).toFixed(2)} ${ing.measures.metric.unitShort} ${ing.name}`
    );

    // Extract steps (if available)
    const steps = recipe.analyzedInstructions[0]?.steps.map(step => step.step) || [];

    // Send response
    res.json({
      ingredients, // e.g., ["200.00 g paneer", "1.00 cup peas"]
      steps,       // e.g., ["Heat oil...", "Add onions..."]
      raw: recipe  // Optional: full recipe data
    });
  } catch (error) {
    console.error('Spoonacular Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

module.exports = router;

console.log('API Key:', process.env.SPOONACULAR_API_KEY ? 'Loaded' : 'Not Loaded');