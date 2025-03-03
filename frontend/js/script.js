// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Attach click event listeners to tab buttons
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');
    
    // Show the selected tab content, hide others
    tabContents.forEach(content => {
      if (content.id === tabId) {
        content.style.display = 'block';
      } else {
        content.style.display = 'none';
      }
    });
    
    // Update active class on buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// Set "AI-Recipe" tab as active by default
tabButtons[0].click();

// Recipe form submission
document.getElementById('recipe-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent page reload

  const dish = document.getElementById('dish').value;
  const servings = document.getElementById('servings').value;
  const resultDiv = document.getElementById('recipe-result');

  // Show loading message
  resultDiv.innerHTML = 'Loading...';

  try {
    // Send POST request to backend
    const response = await fetch('http://localhost:3000/api/recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish, servings })
    });

    const data = await response.json();

    // Display recipe
    if (response.ok) {
      resultDiv.innerHTML = `
        <h2>${data.raw?.title || dish}</h2>
        <h3>Ingredients:</h3>
        <ul>${data.ingredients?.map(ing => `<li>${ing}</li>`).join('') || 'No ingredients available.'}</ul>
        <h3>Instructions:</h3>
        <ol>${data.steps?.map(step => `<li>${step}</li>`).join('') || 'No instructions available.'}</ol>
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
    checkbox.id = `grocery-item-${Date.now()}`; // Unique ID
    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = this.value.trim();
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    li.appendChild(checkboxContainer);
    document.getElementById('grocery-list').appendChild(li);
    this.value = ''; // Clear input
  }
});