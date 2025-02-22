const express = require('express');
const router = express.Router();
const GroceryItem = require('../models/groceryItem');

router.get('/grocery', async (req, res) => {
  const items = await GroceryItem.find();
  res.json(items);
});

router.post('/grocery', async (req, res) => {
  const { name, category } = req.body;
  const item = new GroceryItem({ name, category });
  await item.save();
  res.json(item);
});

router.put('/grocery/:id', async (req, res) => {
  const { id } = req.params;
  const { checked } = req.body;
  const item = await GroceryItem.findByIdAndUpdate(id, { checked }, { new: true });
  res.json(item);
});

module.exports = router;