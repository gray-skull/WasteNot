// add event listener to the recipe-details section on the recipe.html page
document.addEventListener("DOMContentLoaded", async () => {
    // get the recipe-details div
    const recipeDetails = document.getElementById("recipe-details");
    let ingredients = [];
    let instructions = [];

    // get the recipe id from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get("id");

    try {
        const response = await fetch(`/recipe/${recipeId}`);
        

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recipe = await response.json();
        instructions = recipe.analyzedInstructions.length > 0 ? recipe.analyzedInstructions[0].steps.map(step => step.step) : [];
        ingredients = recipe.extendedIngredients.length > 0 ? recipe.extendedIngredients : [];
        const rating = recipe.spoonacularScore.toFixed(1) || "N/A";

        recipeDetails.innerHTML = `
        <button class="back-link" id="back-button">Go Back</button>
        <section class="image-box">
           <img src="${recipe.image}" id="recipe-detail-image" alt="${recipe.title}" />
        </section>
        <h1>${recipe.title}</h1>
        <h3>User Rating: <span>${rating}</span></h3> 
        <h3>Ingredients:</h3> 
            <ul id="recipe-ingredients"></ul>
        <h3>Servings: <span>${recipe.servings}</span></h3>
        <h3>Ready in: <span>${recipe.readyInMinutes} minutes</span></h3> 
        <h3>Diets: <span>${recipe.diets.join(", ")}</span></h3>
        <h3>Summary:</h3> 
            <p>${recipe.summary}</p>
        <h3>Instructions:</h3> 
            <ol id="instructions"></ol>
        <h3>Source: <a href="${recipe.sourceUrl}">${recipe.sourceName}</a></h3>
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

        const ingredientsList = document.getElementById("recipe-ingredients");
        if (ingredients.length === 0 || ingredients[0] === "") {
            ingredientsList.innerHTML = "<li>Ingredients not provided by Spoonacular API</li>";
        } else {
        const ingredientTextHeader = document.createElement("div");
        ingredientTextHeader.classList.add("ingredient-text");
        ingredientTextHeader.style.fontWeight = "bold";
        ingredientTextHeader.style.borderBottom = "1px solid black";
        ingredientTextHeader.textContent = "Ingredient";
        const ingredientAmountHeader = document.createElement("div");
        ingredientAmountHeader.style.fontWeight = "bold";
        ingredientAmountHeader.style.borderBottom = "1px solid black";
        ingredientAmountHeader.classList.add("ingredient-amount");
        ingredientAmountHeader.textContent = "Amount";
        ingredientsList.appendChild(ingredientTextHeader);
        ingredientsList.appendChild(ingredientAmountHeader);
        ingredients.forEach(ing => {
            const ingredientText = document.createElement("div");
            ingredientText.classList.add("ingredient-text");
            const ingredientAmount = document.createElement("div");
            ingredientAmount.classList.add("ingredient-amount");
            ingredientText.textContent = ing.originalName;
            ingredientAmount.textContent = ing.amount + " " + ing.unit;
            ingredientsList.appendChild(ingredientText);
            ingredientsList.appendChild(ingredientAmount);
        });
        }



        //Added for recipe saving
        const saveBtn = document.createElement("button");
        saveBtn.id = "save-recipe-btn";
        saveBtn.textContent = "Save Recipe";
        recipeDetails.insertBefore(saveBtn, recipeDetails.firstChild);
        
        //Added for error handling
        const errorText = document.createElement("div");
        errorText.textContent = "Error loading recipe details. Please try again later.";
        errorText.style.color = "red";
        errorText.style.fontWeight = "bold";
        errorText.style.textAlign = "center";
        errorText.style.marginTop = "1rem";
        errorText.style.display = "none";
        recipeDetails.insertBefore(errorText, saveBtn);

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

        //added for saving ingredients from recipe to user's shopping list
        const shoppingListBtn = document.createElement("button");
        shoppingListBtn.id = "add-to-shopping-list";
        shoppingListBtn.textContent = "Add to Shopping List";
        ingredientsList.appendChild(shoppingListBtn);

        shoppingListBtn.addEventListener("click", async () => {
            //Check for authentication
            const token = localStorage.getItem("token");

            if (!token) {
                errorText.innerHTML = "You must be logged in to add ingredients to your shopping list. <a href='/login'>Login</a>";
                errorText.style.display = "block";
                return;
            }

            try {
                //Send a POST request to the /shopping-list/ingredients/add endpoint with the ingredients
                const response = await fetch("/shopping-list/ingredients/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ ingredients })
                });

                if (response.ok) {
                    const data = await response.json();
                    errorText.textContent = data.message || "Ingredients added to shopping list successfully!";
                    errorText.style.color = "green";
                    errorText.style.display = "block";
                } else {
                    const errorData = await response.json();
                    errorText.textContent = "Error adding ingredients to shopping list: " + (errorData.error || "Unknown error");
                    errorText.style.color = "red";
                    errorText.style.display = "block";
                }
            } catch (error) {
                console.error("Error adding ingredients to shopping list:", error);
                errorText.textContent = "Error adding ingredients to shopping list. Please try again.";
                errorText.style.color = "red";
                errorText.style.display = "block";
            }
        });
        
        // Add event listener to the back button
        const backButton = document.getElementById("back-button");
        backButton.addEventListener("click", () => {
            window.history.back();
        });

    } catch (error) {
        console.error("Error loading recipe details:", error);
        recipeDetails.innerHTML = `<h2>Error</h2><p>Could not load the recipe details. ${error.message}</p>`;
    }

  });