// Tab functionality
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

tabButtons[0].click(); // Set "AI-Recipe" as default

// Recipe form submission (existing)
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

      // Now fetch YouTube video
      const ytResponse = await fetch(`http://localhost:3000/api/youtube/search?q=${encodeURIComponent(dish)}`);
const ytData = await ytResponse.json();

videoContainer.innerHTML = ''; // Clear previous

if (ytResponse.ok && ytData.embedUrl) {
  const title = document.createElement('h3');
  title.textContent = 'Video Tutorial';
  videoContainer.appendChild(title);

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


// New: Recommendations form submission
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

// New: Function to display recommendations
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
      <div id="recipe-details-${recipe.id}" style="display: none;">
        <p>Loading...</p>
      </div>
    `;
    resultDiv.appendChild(recipeCard);
  });
}

// New: Function to toggle recipe details
async function toggleRecipeDetails(id, button) {
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
}

// Add items to grocery list (existing)
document.getElementById('grocery-input').addEventListener('keyup', function(event) {
  if (event.key === 'Enter' && this.value.trim() !== '') {
    const li = document.createElement('li');
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `grocery-item-${Date.now()}`;
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = this.value.trim();
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    li.appendChild(checkboxContainer);
    document.getElementById('grocery-list').appendChild(li);
    this.value = '';
  }
});

// Theme toggle (existing)
document.addEventListener('DOMContentLoaded', () => {
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