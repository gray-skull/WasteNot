//Basic script.js. Feel free to edit/erase as needed.

//Function to fetch recipes from the server based on input
function getRecipes(){
    const ingredientsInput = document.getElementById("ingredients");
    const ingredients = ingredientsInput.value.trim();
  
  //Alert for no ingredients entered
    if (!ingredients){
      alert("Please enter at least one ingredient.");
      return;
  }
  
  //Example for fetching with the assumption of endpoints like "/api/recpies" that accepts query param `ingredients`
  //Feel free to edit/erase as needed. This is just a placeholder for now :)
  fetch(`/api/recipes?ingredients=${encodeURIComponent(ingredients)}`)
    .then((response) => {
      if (!response.ok){
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then ((data) => {
      displayRecipes(data);
    })
    .catch((error) => {
      console.error("Error fetching recipes:", error);
      displayError("Something went wrong while fetching recipes. Please try again later.");
    });
  }
  
  //Display recipes
  function displayRecipes(recipes){
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";
  
    if (!recipes || recipes.length == 0){
      resultsContainer.innerHTML = "<p>No recipes found. Try different ingredients or filters.</p>";
      return;
    }
  
    recipes.forEach((recipe) => {
      const recipeDiv = document.createElement("div");
      recipeDiv.classList.add("recipe");
  
      recipeDiv.innerHTML = `
        <h2>${recipe.title}</h2>
        <p><strong>Preparation Time:</strong> ${recipe.prepTime || "N/A"}</p>
        <p><strong>Servings:</strong> ${recipe.servings || "N/A"}</p>
        <p><strong>Ingredients:</strong> ${recipe.ingredients?.join(", ") || "N/A"}</p>
        <p><strong>Instructions:</strong> ${recipe.instructions || "N/A"}</p>
    `;
  
    resultsContainer.appendChild(recipeDiv);
    });
  }

//Error message display
function displayError(message){
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = `<p class = "error">${message}</p>`;
}
