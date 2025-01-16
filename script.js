document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('search-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const ingredients = document.getElementById('ingredients').value;

    try {
      // send a POST request with the ingredients to the server
      const response = await fetch('http://localhost:5500/recipes', {
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
      console.error(error);
      alert(error);
    }
  });
});
