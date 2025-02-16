// add event listener to the recipe-details section on the recipe.html page
document.addEventListener("DOMContentLoaded", async () => {
    // get the recipe-details div
    const recipeDetails = document.getElementById("recipe-details");

    // get the recipe id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get("id");

    try {
        const response = await fetch(`/recipe/${recipeId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recipe = await response.json();
        const instructions = recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps.map(step => step.step) : [];
        const ingredients = recipe.extendedIngredients.length > 0 ? recipe.extendedIngredients.map(ing => ing.originalName) : [];
        const rating = recipe.spoonacularScore.toFixed(1) || "N/A";

        recipeDetails.innerHTML = `
        <button class="back-link" id="back-button">Back to Recipes</button>
        <h1>${recipe.title}</h1>
        <p>User Rating: ${rating}</p>
        <section class="image-box">
           <img src="${recipe.image}" id="recipe-detail-image" alt="${recipe.title}" />
        </section>
        <h3>Ingredients:</h3> 
            <ul id=ingredients></ul>
        <h3>Servings:</h3> 
            <p>${recipe.servings}</p>
        <h3>Ready in:</h3> 
            <p>${recipe.readyInMinutes} minutes</p>
        <h3>Diets:</h3>
            <p>${recipe.diets.join(", ")}</p>
        <h3>Summary:</h3> 
            <p>${recipe.summary}</p>
        <h3>Instructions:</h3> 
            <ol id=instructions></ol>
        <h3>Source:</h3> 
            <p><a href="${recipe.sourceUrl}">${recipe.sourceName}</a></p>
        `;

        //Added for error handling
        const errorText = document.createElement("p");
        errorText.textContent = "Error loading recipe details. Please try again later.";
        errorText.style.color = "red";
        errorText.style.fontWeight = "bold";
        errorText.style.textAlign = "center";
        errorText.style.marginTop = "1rem";
        errorText.style.display = "none";
        recipeDetails.appendChild(errorText);

        //Added for recipe saving
        const saveBtn = document.createElement("button");
        saveBtn.id = "save-recipe-btn";
        saveBtn.textContent = "Save Recipe";
        recipeDetails.appendChild(saveBtn);


        saveBtn.addEventListener("click", async () => {
            //Check for authentication
            const token = localStorage.getItem("token");
            if (!token) {
                errorText.innerHTML = "You must be logged in to save a recipe. <a href='/login'>Login</a>";
                errorText.style.display = "block";
                
                return;
            }
            try {
                //Send a POST request to the /save-recipe endpoint with the recipe external ID
                const saveResponse = await fetch("./save-recipe", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ recipeExternalId: recipe.id })
                });
                if (saveResponse.ok) {
                    const saveData = await saveResponse.json();
                    errorText.textContent = saveData.message || "Recipe saved successfully!";
                    errorText.style.color = "green";
                    errorText.style.display = "block";
                } else {
                    const errorData = await saveResponse.json();
                    errorText.textContent = "Error saving recipe: " + (errorData.error || "Unknown error");
                    errorText.style.color = "red";
                    errorText.style.display = "block";
                }
            } catch (saveError) {
                console.error("Error saving recipe:", saveError);
                errorText.textContent = "Error saving recipe. Please try again.";
                errorText.style.color = "red";
                errorText.style.display = "block";
            }
        });
        

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
        
        // Add event listener to the back button
        const backButton = document.getElementById("back-button");
        backButton.addEventListener("click", () => {
            window.history.back();
        });

    } catch (error) {
        recipeDetails.innerHTML = `<h2>Error</h2><p>Could not load the recipe details. ${error.message}</p>`;
    }

  });