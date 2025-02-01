// add event listener to the recipe-details section on the recipe.html page
document.addEventListener("DOMContentLoaded", async () => {
    // get the recipe-details div
    const recipeDetails = document.getElementById("recipe-details");

    // get the recipe id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get("id");

    try {
        const response = await fetch(`http://localhost:8080/recipe/${recipeId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recipe = await response.json();
        console.log(recipe);
        const instructions = recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps.map(step => step.step) : [];
        const ingredients = recipe.extendedIngredients.length > 0 ? recipe.extendedIngredients.map(ing => ing.originalName) : [];
        const rating = recipe.spoonacularScore.toFixed(1) || "N/A";

        recipeDetails.innerHTML = `
        <h1>${recipe.title}</h1>
        <p>User Rating: ${rating}</p>
        <img src="${recipe.image}" id=recipe-detail-image alt="${recipe.title}" />
        <h3>Ingredients:</h3> 
            <ul id=ingredients></ul>
        <h3>Servings:</h3> 
            <p>${recipe.servings}</p>
        <h3>Ready in:</h3> 
            <p>${recipe.readyInMinutes} minutes</p>
        <h3>Diets:</h3>
            <p>${recipe.diets}</p>
        <h3>Summary:</h3> 
            <p>${recipe.summary}</p>
        <h3>Instructions:</h3> 
            <ol id=instructions></ol>
        <h3>Source:</h3> 
            <p><a href="${recipe.sourceUrl}">${recipe.sourceName}</a></p>
        `;

        const instructionsList = document.getElementById("instructions");
        if (instructions.length === 0 || instructions[0] === "") {
            instructionsList.innerHTML = "<li>Instructions not provided by Spoonacular API</li>";
        } else {
            instructions.forEach(step => {
                const li = document.createElement("li");
                li.textContent = step;
                instructionsList.appendChild(li);
            });
        }

        const ingredientsList = document.getElementById("ingredients");
        if (ingredients.length === 0 || ingredients[0] === "") {
            ingredientsList.innerHTML = "<li>Ingredients not provided by Spoonacular API</li>";
        } else {
        
        ingredients.forEach(ing => {
            const li = document.createElement("li");
            li.textContent = ing;
            ingredientsList.appendChild(li);
        });
        }
        
    } catch (error) {
        recipeDetails.innerHTML = `<h2>Error</h2><p>Could not load the recipe details. ${error.message}</p>`;
    }

  });