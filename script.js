document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('search-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const ingredients = document.getElementById('ingredients').value;

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      });

      if (!response.ok) {
        throw new Error('Bad response from Spoonacular', response.statusText);
      }

      const data = await response.json();

      const recipesList = document.getElementById('recipes-list');
      recipesList.innerHTML = '';

      if (data.length === 0) {
        recipesList.innerHTML = '<li>No recipes found</li>';
      } else {
        data.forEach((recipe) => {
          const li = document.createElement('li');
          li.innerHTML = `<h3>${recipe.title}</h3>
                          <img src="${recipe.image}" alt="${recipe.title}" />
                          `;
          recipesList.appendChild(li);
        });
      }
    } catch (error) {
      console.error('Error fetching recipes from Spoonacular:', error);
      alert('Error fetching recipes from Spoonacular');
    }
  });
});
