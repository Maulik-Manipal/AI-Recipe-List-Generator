const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: String,
  category: String,
  checked: { type: Boolean, default: false },
});

module.exports = mongoose.model('GroceryItem', groceryItemSchema);