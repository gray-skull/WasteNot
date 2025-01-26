// add event listener to the recipe-details section on the recipe.html page
document.addEventListener("DOMContentLoaded", async () => {
    // get the recipe-details div
    const recipeDetails = document.getElementById("recipe-details");

    // get the recipe id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get("id");

    try {
        const response = await fetch(`http://localhost:3000/recipe/${recipeId}`);

        if (!response.ok) {
        throw new Error(`Failed to load recipe details`);
        }

        const recipe = await response.json();
        const instructions = recipe.analyzedInstructions[0].steps.map(step => step.step);
        const ingredients = recipe.extendedIngredients.map(ing => ing.originalName);
        const rating = recipe.spoonacularScore.toFixed(1);

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
    instructions.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        instructionsList.appendChild(li);
    });

    const ingredientsList = document.getElementById("ingredients");
    ingredients.forEach(ing => {
        const li = document.createElement("li");
        li.textContent = ing;
        ingredientsList.appendChild(li);
    });
        
    } catch (error) {
        recipeDetails.innerHTML = `<h2>Error</h2><p>Could not load the recipe details. ${error.message}</p>`;
    }

  });