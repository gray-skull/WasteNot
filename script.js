// dynamic content generation for the navigation menu
document.addEventListener("DOMContentLoaded", () => {
  // Get the content div
  const content = document.getElementById("content");

  // Function to load content dynamically
  async function loadPage(page)  {
    try {
      // Fetch the page content
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) { // if the response is not OK (status 200), throw an error
          throw new Error(`Failed to load ${page}.html`);
      }
      // if the response is OK, set the content div to the response text
      const html = await response.text();
      content.innerHTML = html;
    } catch (error) { // catch any page load errors and display an error message on the page
        content.innerHTML = `<h1>Error</h1><p>Could not load the page. ${error.message}</p>`;
    }
  }

  // Set default page
  loadPage("home");

  // Add event listeners to menu links
  document.querySelectorAll(".bottom-menu a").forEach(link => {
      link.addEventListener("click", (event) => {
          event.preventDefault(); // Prevent default anchor behavior
          // Get the page name from the data-page attribute
          const page = event.target.getAttribute("data-page");
          // Load the page
          loadPage(page);
      });
  });

  // add an event listener to the content div to handle search form submissions
  content.addEventListener("submit", async (event) => {
    // check if the event target is the search form
    if (event.target.id === "search-form") {
        event.preventDefault(); // prevent the default form submission behavior

        // TODO: add input validation here to ensure ingredients are a comma-separated list
        // get the ingredients from the form input
        const ingredients = event.target.elements.ingredients.value;

        try { // try to fetch the recipes from the server
          const response = await fetch("http://localhost:3000/recipes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ingredients }) // send the ingredients as JSON
          });

          // if the response from the fetch is OK (status 200), parse the JSON and display the recipes
          if (response.ok) {
            // parse the JSON response from the server 
            const recipes = await response.json();
            // get the search results div
            const searchResults = document.getElementById('search-results');
            // add a divider and an empty <ul> element to the search results div
            searchResults.innerHTML = `<div class="divider"></div>
                                      <ul id="recipes-list"></ul>
                                      `;
            const recipesList = document.getElementById("recipes-list");
            recipesList.innerHTML = "";

            // if no recipes are found, display a message
            if(recipes.length === 0) {
              recipesList.innerHTML = "<li><h3>Sorry, no recipes found</h3></li>";
            } else { // otherwise, display the recipes
            recipes.forEach(recipe => {
              // <li> links to recipe.html but still needs to connect to backend for details
              // TODO: link <li> recipe description and prep time to results to backend
              const li = document.createElement("li");
              li.innerHTML = `
                <a href="recipe.html?id=${recipe.id}">
                  <h3>${recipe.title}</h3>
                  <img src="${recipe.image}" alt="${recipe.title}" />
                </a>
                <p>${recipe.description}</p>
                <p>Preparation time: ${recipe.prepTime} minutes</p>
              `;
              recipesList.appendChild(li);
            });
            }

          } else { // if the response is not OK, throw an error
            throw new Error(`Server error: ${response.status}`);
          }
      } catch (error) { // catch any errors and log them to the console
        console.error("Error fetching recipes", error);
        alert("Error fetching recipes");
      }
    }
  });
});