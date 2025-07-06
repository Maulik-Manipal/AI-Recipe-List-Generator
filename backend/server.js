const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = 3000;
const PYTHON_PORT = 5000;
const PYTHON_HOST = '127.0.0.1';
const FRONTEND_PATH = path.join(__dirname, '../frontend');
const autocompleteRoute = require('./routes/autocomplete');
app.use('/api', autocompleteRoute);

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// 🔄 Multer config for image upload
// ---------------------------
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }
});
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ---------------------------
// 📷 Image Recognition API
// ---------------------------
app.post('/api/image-recipe', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const form = new FormData();
    form.append('image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname || 'food.jpg',
      contentType: req.file.mimetype
    });

    const response = await axios.post(`http://${PYTHON_HOST}:${PYTHON_PORT}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    const { food, confidence } = response.data;

    // Get real recipe from Spoonacular
    const searchRes = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
      params: { apiKey: SPOONACULAR_API_KEY, query: food, number: 1 }
    });

    const recipe = searchRes.data.results?.[0];
    if (!recipe) return res.json({ food, confidence, ingredients: [], steps: [] });

    const infoRes = await axios.get(`https://api.spoonacular.com/recipes/${recipe.id}/information`, {
      params: { apiKey: SPOONACULAR_API_KEY }
    });

    const ingredients = infoRes.data.extendedIngredients.map(i => i.original);
    const steps = infoRes.data.analyzedInstructions?.[0]?.steps.map(s => s.step) || [];

    return res.json({ food, confidence, ingredients, steps });

  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Image recognition failed', details: err.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

// ---------------------------
// 🍽 /api/recipe (text-based generation)
// ---------------------------
app.post('/api/recipe', async (req, res) => {
  const { dish } = req.body;
  try {
    const searchRes = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: { apiKey: SPOONACULAR_API_KEY, query: dish, number: 1 }
    });

    const recipe = searchRes.data.results?.[0];
    if (!recipe) return res.status(404).json({ message: 'Recipe not found.' });

    const infoRes = await axios.get(`https://api.spoonacular.com/recipes/${recipe.id}/information`, {
      params: { apiKey: SPOONACULAR_API_KEY }
    });

    const ingredients = infoRes.data.extendedIngredients.map(i => i.original);
    const steps = infoRes.data.analyzedInstructions?.[0]?.steps.map(s => s.step) || [];

    return res.json({ ingredients, steps });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch recipe', details: err.message });
  }
});

// ---------------------------
// 🔍 /api/youtube/search
// ---------------------------
app.get('/api/youtube/search', async (req, res) => {
  const query = req.query.q || 'cooking tutorial';
  try {
    const ytRes = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        type: 'video',
        maxResults: 1,
        videoDuration: 'medium',
        videoEmbeddable: true,
        q: query
      }
    });

    const video = ytRes.data.items?.[0];
    const embedUrl = video ? `https://www.youtube.com/embed/${video.id.videoId}` : null;
    res.json({ embedUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'YouTube fetch failed' });
  }
});

// ---------------------------
// ⭐ /api/recommendations
// ---------------------------
app.post('/api/recommendations', async (req, res) => {
  const { diet, ingredients } = req.body;
  try {
    const searchRes = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        diet,
        includeIngredients: ingredients,
        number: 5
      }
    });

    res.json({ recipes: searchRes.data.results });
  } catch (err) {
    res.status(500).json({ error: 'Recommendation fetch failed' });
  }
});

// ---------------------------
// 📋 /api/recipe/:id
// ---------------------------
app.get('/api/recipe/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const infoRes = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
      params: { apiKey: SPOONACULAR_API_KEY }
    });

    const ingredients = infoRes.data.extendedIngredients.map(i => i.original);
    const steps = infoRes.data.analyzedInstructions?.[0]?.steps.map(s => s.step) || [];

    res.json({ ingredients, steps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recipe info' });
  }
});

// ---------------------------
// 🎲 /api/random-recipe
// ---------------------------
app.get('/api/random-recipe', async (req, res) => {
  const { includeTags, excludeIngredients, includeNutrition } = req.query;
  try {
    const randomRes = await axios.get('https://api.spoonacular.com/recipes/random', {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        tags: includeTags,
        number: 1
      }
    });

    const recipe = randomRes.data.recipes?.[0];
    const ingredients = recipe.extendedIngredients.map(i => i.original);
    const steps = recipe.analyzedInstructions?.[0]?.steps.map(s => s.step) || [];

    res.json({
      title: recipe.title,
      image: recipe.image,
      ingredients,
      steps,
      ...(includeNutrition && { nutrition: recipe.nutrition || null })
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch random recipe' });
  }
});

app.get('/api/nutrition-widget/:id', (req, res) => {
  const { id } = req.params;
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    return res.status(500).send('Missing Spoonacular API key');
  }

  const widgetURL = `https://api.spoonacular.com/recipes/${id}/nutritionWidget?defaultCss=true&apiKey=${apiKey}`;

  res.redirect(widgetURL);
});


// ---------------------------
// 📁 Serve frontend
// ---------------------------
app.use(express.static(FRONTEND_PATH));
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// ---------------------------
// 🚀 Start server
// ---------------------------
app.listen(PORT, async () => {
  console.log(`\n=== Node Server Running on http://localhost:${PORT} ===`);
  try {
    await axios.get(`http://${PYTHON_HOST}:${PYTHON_PORT}/`);
    console.log(`✅ Connected to Python service at http://${PYTHON_HOST}:${PYTHON_PORT}`);
  } catch {
    console.warn(`⚠️  Python service not reachable on port ${PYTHON_PORT}`);
  }
  console.log(`===============================================\n`);
});
