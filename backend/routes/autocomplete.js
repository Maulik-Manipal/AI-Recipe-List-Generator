const express = require('express');
const axios = require('axios');
const router = express.Router();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

router.get('/autocomplete', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await axios.get('https://api.spoonacular.com/recipes/autocomplete', {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                number: 5,
                query: query
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Autocomplete failed' });
    }
});

module.exports = router;
