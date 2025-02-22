// Sample recipes for demonstration
const recipes = {
  "matar paneer": ["paneer", "peas", "tomatoes", "onions", "spices"],
  "pasta": ["pasta", "tomato sauce", "cheese", "basil"]
};

let checkboxId = 0;

// Tab switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');
    tabContents.forEach(content => {
      content.style.display = content.id === tabId ? 'block' : 'none';
    });
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
});
// Set "AI-Recipe" as default active tab
tabButtons[0].click();

// Get recipe ingredients
document.getElementById('get-ingredients').addEventListener('click', function() {
  const recipeName = document.getElementById('recipe-input').value.toLowerCase();
  const ingredientsList = document.getElementById('ingredients-list');
  ingredientsList.innerHTML = ''; // Clear previous content
  if (recipes[recipeName]) {
    const ul = document.createElement('ul');
    recipes[recipeName].forEach(ingredient => {
      checkboxId++;
      const li = document.createElement('li');
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = 'checkbox-container';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `checkbox-${checkboxId}`;
      const label = document.createElement('label');
      label.htmlFor = `checkbox-${checkboxId}`;
      label.textContent = ingredient;
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      li.appendChild(checkboxContainer);
      ul.appendChild(li);
    });
    ingredientsList.appendChild(ul);
  } else {
    ingredientsList.textContent = 'Recipe not found.';
  }
});

// Add item to grocery list
document.getElementById('grocery-input').addEventListener('keyup', function(event) {
  if (event.key === 'Enter' && this.value.trim() !== '') {
    checkboxId++;
    const li = document.createElement('li');
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `checkbox-${checkboxId}`;
    const label = document.createElement('label');
    label.htmlFor = `checkbox-${checkboxId}`;
    label.textContent = this.value.trim();
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    li.appendChild(checkboxContainer);
    document.getElementById('grocery-list-items').appendChild(li);
    this.value = ''; // Clear input
  }
});

// Search functionality
document.getElementById('search-button').addEventListener('click', function() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  document.getElementById('recipe-input').value = searchTerm;
  document.getElementById('get-ingredients').click();
  document.querySelector('.tab-button[data-tab="ai-recipe"]').click();
});

// Search on Enter key
document.getElementById('search-input').addEventListener('keyup', function(event) {
  if (event.key === 'Enter') {
    document.getElementById('search-button').click();
  }
});


function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = tab.id === tabName ? 'block' : 'none';
  });
}
document.getElementById('get-ingredients').addEventListener('click', async () => {
  const dish = document.getElementById('recipe-input').value;
  const servings = document.getElementById('servings').value;
  try {
    const response = await fetch('http://localhost:3000/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish, servings }),
    });
    const data = await response.json();
    document.getElementById('ingredients-list').innerHTML = `<pre>${data.recipe}</pre>`;
  } catch (error) {
    console.error('Error:', error);
  }
});
async function loadGroceryList() {
  const response = await fetch('http://localhost:3000/api/grocery');
  const items = await response.json();
  const list = document.getElementById('grocery-list');
  list.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.checked;
    checkbox.addEventListener('change', async () => {
      await fetch(`http://localhost:3000/api/grocery/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: checkbox.checked }),
      });
    });
    li.appendChild(checkbox);
    li.appendChild(document.createTextNode(` ${item.name} (${item.category})`));
    list.appendChild(li);
  });
}

document.getElementById('grocery-input').addEventListener('keyup', async (e) => {
  if (e.key === 'Enter') {
    const name = e.target.value.trim();
    const category = document.getElementById('category').value;
    if (name) {
      await fetch('http://localhost:3000/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category }),
      });
      e.target.value = '';
      loadGroceryList();
    }
  }
});

loadGroceryList(); // Load on page start