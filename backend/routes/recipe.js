const express = require('express');
const axios = require('axios');
const router = express.Router();

require('dotenv').config();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Existing route: POST /recipe (for generating a recipe by dish name)
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
      ingredients,
      steps,
      raw: recipe
    });
  } catch (error) {
    console.error('Spoonacular Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// New route: POST /recommendations (for personalized recommendations)
router.post('/recommendations', async (req, res) => {
  const { diet, ingredients } = req.body;

  try {
    const params = {
      apiKey: SPOONACULAR_API_KEY,
      number: 5 // Limit to 5 recommendations
    };

    if (diet) params.diet = diet; // e.g., "vegetarian", "vegan"
    if (ingredients) params.includeIngredients = ingredients; // e.g., "chicken, tomato"

    const response = await axios.get(`${SPOONACULAR_BASE_URL}/complexSearch`, { params });
    const recipes = response.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image
    }));

    res.json({ recipes });
  } catch (error) {
    console.error('Spoonacular Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// New route: GET /recipe/:id (for fetching full recipe details by ID)
router.get('/recipe/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${SPOONACULAR_BASE_URL}/${id}/information`, {
      params: { apiKey: SPOONACULAR_API_KEY }
    });

    const recipe = response.data;
    const ingredients = recipe.extendedIngredients.map(ing => 
      `${ing.measures.metric.amount} ${ing.measures.metric.unitShort} ${ing.name}`
    );
    const steps = recipe.analyzedInstructions[0]?.steps.map(step => step.step) || [];

    res.json({ ingredients, steps, raw: recipe });
  } catch (error) {
    console.error('Spoonacular Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

module.exports = router;

console.log('API Key:', process.env.SPOONACULAR_API_KEY ? 'Loaded' : 'Not Loaded');

router.get('/random-recipe', async (req, res) => {
  const { includeTags, excludeTags, includeNutrition } = req.query;

  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/random', {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        number: 1,
        ...(includeTags && { 'tags': includeTags }), // Note: Spoonacular uses "tags", not "include-tags"
        ...(excludeTags && { 'exclude-tags': excludeTags }),
        ...(includeNutrition === 'true' && { includeNutrition: true })
      }
    });

    const recipe = response.data.recipes[0];
    const ingredients = recipe.extendedIngredients.map(ing => `${ing.original}`);
    const steps = recipe.analyzedInstructions[0]?.steps.map(step => step.step) || [];

    res.json({
      title: recipe.title,
      image: recipe.image,
      ingredients,
      steps,
      nutrition: recipe.nutrition || null
    });
  } catch (error) {
    console.error('Random Recipe Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch random recipe' });
  }
});
