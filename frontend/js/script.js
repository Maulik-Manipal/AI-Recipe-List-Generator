// script.js (FULL UPDATED FILE)

document.addEventListener('DOMContentLoaded', () => {
  // Utility to get selected values from <select multiple>
  const getSelectedValues = (select) =>
    Array.from(select?.selectedOptions || []).map(opt => opt.value).join(',');

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

  // Default tab
  if (tabButtons.length) tabButtons[0].click();

  // Random Recipe Fetch
  const randomButton = document.getElementById('get-random');
  if (randomButton) {
    randomButton.addEventListener('click', async () => {
      const resultDiv = document.getElementById('random-result');
      resultDiv.innerHTML = 'Loading...';

      const includeTags = getSelectedValues(document.getElementById('include-tags'));
      const excludeTags = getSelectedValues(document.getElementById('exclude-tags'));
      const includeNutrition = document.getElementById('include-nutrition')?.checked;

      const query = new URLSearchParams({
        ...(includeTags && { includeTags }),
        ...(excludeTags && { excludeTags }),
        includeNutrition
      });

      try {
        const response = await fetch(`http://localhost:3000/api/random-recipe?${query}`);
        const data = await response.json();

        if (response.ok) {
          resultDiv.innerHTML = `
            <h2>${data.title}</h2>
            <img src="${data.image}" alt="${data.title}" style="width: 100%; border-radius: 12px; margin-bottom: 1rem;">
            <h3>Ingredients</h3>
            <ul>${data.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
            <h3>Instructions</h3>
            <ol>${data.steps.map(step => `<li>${step}</li>`).join('')}</ol>
          `;
        } else {
          resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        }
      } catch (error) {
        resultDiv.innerHTML = `<p>Something went wrong: ${error.message}</p>`;
      }
    });
  }

  // Recipe Form Submit
  document.getElementById('recipe-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const dish = document.getElementById('dish').value;
    const servings = document.getElementById('servings').value;
    const resultDiv = document.getElementById('recipe-result');
    const videoContainer = document.getElementById('video-container');

    resultDiv.innerHTML = 'Loading...';
    videoContainer.innerHTML = '';

    try {
      const response = await fetch('http://localhost:3000/api/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish, servings })
      });

      const data = await response.json();

      if (response.ok) {
        resultDiv.innerHTML = `
          <h2>${dish}</h2>
          <h3>Ingredients:</h3>
          <ul>
            ${data.ingredients?.map(ing => `
              <li>
                <div class="checkbox-container">
                  <input type="checkbox" id="ing-${ing.replace(/\s+/g, '-')}-${Date.now()}">
                  <label for="ing-${ing.replace(/\s+/g, '-')}-${Date.now()}">${ing}</label>
                </div>
              </li>
            `).join('') || '<li>No ingredients available.</li>'}
          </ul>
          <h3>Instructions:</h3>
          <ol>
            ${data.steps?.map(step => `<li>${step}</li>`).join('') || '<li>No instructions available.</li>'}
          </ol>
        `;

        const ytResponse = await fetch(`http://localhost:3000/api/youtube/search?q=${encodeURIComponent(dish)}`);
        const ytData = await ytResponse.json();

        if (ytResponse.ok && ytData.embedUrl) {
          const title = document.createElement('h3');
          title.textContent = 'Video Tutorial';
          const iframe = document.createElement('iframe');
          iframe.src = `${ytData.embedUrl}?rel=0`;
          iframe.title = `YouTube tutorial for ${dish}`;
          iframe.frameBorder = '0';
          iframe.allowFullscreen = true;
          iframe.setAttribute('allow', 'fullscreen');
          iframe.style.border = 'none';
          iframe.style.width = '100%';
          iframe.style.height = '100%';

          const wrapper = document.createElement('div');
          wrapper.className = 'iframe-container';
          wrapper.appendChild(iframe);

          videoContainer.appendChild(title);
          videoContainer.appendChild(wrapper);
        } else {
          videoContainer.innerHTML = `<p>No video found for "${dish}".</p>`;
        }
      } else {
        resultDiv.innerHTML = `<p>Error: ${data.message || 'Recipe not found.'}</p>`;
      }
    } catch (error) {
      resultDiv.innerHTML = `<p>Something went wrong: ${error.message}</p>`;
      videoContainer.innerHTML = '';
    }
  });

  // Preferences Form Submit
  document.getElementById('preferences-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const diet = document.getElementById('diet').value;
    const ingredients = document.getElementById('ingredients').value;
    const resultDiv = document.getElementById('recommendations-result');

    resultDiv.innerHTML = '<p>Loading...</p>';

    try {
      const response = await fetch('http://localhost:3000/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diet, ingredients })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.recipes && data.recipes.length > 0) {
          displayRecommendations(data.recipes);
        } else {
          resultDiv.innerHTML = '<p>No recommendations found based on your preferences.</p>';
        }
      } else {
        resultDiv.innerHTML = `<p>Error: ${data.error || 'Failed to fetch recommendations'}</p>`;
      }
    } catch (error) {
      resultDiv.innerHTML = `<p>Something went wrong: ${error.message}</p>`;
    }
  });

  // Display Recommendations
  function displayRecommendations(recipes) {
    const resultDiv = document.getElementById('recommendations-result');
    resultDiv.innerHTML = '';

    recipes.forEach(recipe => {
      const recipeCard = document.createElement('div');
      recipeCard.className = 'recipe-card';
      recipeCard.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}">
        <h3>${recipe.title}</h3>
        <button onclick="toggleRecipeDetails(${recipe.id}, this)">View Recipe</button>
        <div id="recipe-details-${recipe.id}" style="display: none;"><p>Loading...</p></div>
      `;
      resultDiv.appendChild(recipeCard);
    });
  }

  // Toggle Recipe Details
  window.toggleRecipeDetails = async function(id, button) {
    const detailsDiv = document.getElementById(`recipe-details-${id}`);

    if (detailsDiv.style.display === 'none') {
      try {
        const response = await fetch(`http://localhost:3000/api/recipe/${id}`);
        const data = await response.json();

        if (response.ok) {
          detailsDiv.innerHTML = `
            <h4>Ingredients:</h4>
            <ul>${data.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
            <h4>Instructions:</h4>
            <ol>${data.steps.map(step => `<li>${step}</li>`).join('')}</ol>
          `;
          detailsDiv.style.display = 'block';
          button.textContent = 'Hide Recipe';
        } else {
          detailsDiv.innerHTML = '<p>Failed to load recipe.</p>';
        }
      } catch (error) {
        detailsDiv.innerHTML = `<p>Something went wrong: ${error.message}</p>`;
      }
    } else {
      detailsDiv.style.display = 'none';
      button.textContent = 'View Recipe';
    }
  };

  // GROCERY LIST FUNCTIONALITY
  const groceryInput = document.getElementById('grocery-input');
  const groceryItems = document.getElementById('grocery-list');
  const addGroceryBtn = document.getElementById('add-grocery');
  const clearListBtn = document.getElementById('clear-list');

  // Add item functionality
  function addGroceryItem() {
    const itemText = groceryInput.value.trim();
    if (!itemText) return;
    
    const li = document.createElement('li');
    li.className = 'grocery-item';
    
    li.innerHTML = `
      <div class="grocery-item-left">
        <input type="checkbox" id="item-${Date.now()}">
        <label for="item-${Date.now()}">${itemText}</label>
      </div>
      <button class="remove-btn">&times;</button>
    `;
    
    groceryItems.appendChild(li);
    groceryInput.value = '';
    
    // Add event to remove button
    li.querySelector('.remove-btn').addEventListener('click', () => {
      li.remove();
    });
    
    // Add event to checkbox
    li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      if (e.target.checked) {
        li.style.opacity = '0.6';
        li.style.textDecoration = 'line-through';
      } else {
        li.style.opacity = '1';
        li.style.textDecoration = 'none';
      }
    });
  }

  // Event listeners for grocery list
  addGroceryBtn.addEventListener('click', addGroceryItem);
  groceryInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') addGroceryItem();
  });

  clearListBtn.addEventListener('click', () => {
    groceryItems.innerHTML = '';
  });

  // Theme toggle
  const themeSwitch = document.getElementById('theme-switch');
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  themeSwitch.checked = savedTheme === 'light';

  themeSwitch.addEventListener('change', () => {
    const newTheme = themeSwitch.checked ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
});