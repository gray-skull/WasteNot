document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('search-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // TODO: add input validation here to ensure ingredients are a comma-separated list

    // get the ingredients from the form
    const ingredients = document.getElementById('ingredients').value;

    try {
      // send a POST request with the ingredients to the server
      const response = await fetch('http://localhost:3000/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ingredients}),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      const searchResults = document.getElementById('search-results');
      searchResults.innerHTML = `<h2>Recipes using: ${ingredients}</h2>
                                 <ul id="recipes-list"></ul>
                                 `;
      
      const recipesList = document.getElementById('recipes-list');
      recipesList.innerHTML = '';

      if (data.length === 0) {
        recipesList.innerHTML = '<li>No recipes found</li>';
      } else {

        data.forEach((recipe) => {
          const li = document.createElement('li');
          // TODO: make the <li> a link to the recipe page and include more details
          li.innerHTML = `<h3>${recipe.title}</h3>
                          <section class="image-box">
                          <img src="${recipe.image}" alt="${recipe.title}" />
                          </section>
                          <h3>Used ingredients:</h3>
                          <p>${recipe.usedIngredients.map(ingredient => ingredient.name).join(', ')}</p>
                          <h3>Additional ingredients:</h3>
                          <p>${recipe.missedIngredients.map(ingredient => ingredient.name).join(', ')}</p>
                          `;
          recipesList.appendChild(li);
        });

      }
    } catch (error) {
      console.error(error);
      alert(error);
    }
  });
});
