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

// Recipe form submission
document.getElementById('recipe-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const dish = document.getElementById('dish').value; // Keep exact dish name
  const servings = document.getElementById('servings').value;
  const resultDiv = document.getElementById('recipe-result');

  resultDiv.innerHTML = 'Loading...';

  try {
    const response = await fetch('http://localhost:3000/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish, servings })
    });

    const data = await response.json();

    if (response.ok) {
      resultDiv.innerHTML = `
        <h2>${dish}</h2> <!-- Use user-entered dish name -->
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
    } else {
      resultDiv.innerHTML = `<p>Error: ${data.message || 'Recipe not found.'}</p>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p>Something went wrong: ${error.message}</p>`;
  }
});

// Add items to grocery list
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


document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('theme-switch');

  // Check local storage for saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', savedTheme);
  themeSwitch.checked = savedTheme === 'light';

  // Toggle theme on switch change
  themeSwitch.addEventListener('change', () => {
    const newTheme = themeSwitch.checked ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Save theme to local storage
  });
});