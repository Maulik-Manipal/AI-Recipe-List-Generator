const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const router = express.Router();

const configuration = new Configuration({ apiKey: 'YOUR_OPENAI_API_KEY' });
const openai = new OpenAIApi(configuration);

router.post('/recipe', async (req, res) => {
  const { dish, servings } = req.body;
  const prompt = `Generate a recipe for ${dish} for ${servings} people, including ingredients and steps.`;
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
    });
    res.json({ recipe: response.data.choices[0].text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

module.exports = router;