// dynamic content generation for the navigation menu
document.addEventListener("DOMContentLoaded", () => {
  let content = document.getElementById("content")

  // Set default page to home
  loadPage("home")

  // Add event listeners to menu links
  document.querySelectorAll(".bottom-menu a").forEach(link => {
    link.addEventListener("click", event => {
      // Only prevent default for dynamically loaded pages
      const page = event.target.getAttribute("data-page")
      if (["home", "about", "settings", "login", "signup"].includes(page)) {
        event.preventDefault()
        loadPage(page)
      } else if (page === "profile") {
        const token = localStorage.getItem("token")
        if (token) {
          // Let it navigate normally
          return
        } else {
          event.preventDefault() // Stop only if not logged in
          alert("You must be logged in to access your profile!")
          loadPage("login")
        }
      }
    })
  })

  document.querySelectorAll(".auth-buttons button").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault() // Prevent default button behavior

      // Get the page name from the data-page attribute
      const page = event.target.getAttribute("data-page")
      // Load the page
      loadPage(page)
    })
  })

  // add an event listener to the content div to handle search form submissions
  content.addEventListener("submit", async event => {
    // check if the event target is the search form and the submit button was clicked
    if (
      event.target.id === "search-form" &&
      event.submitter.id === "search-button"
    ) {
      event.preventDefault() // prevent the default form submission behavior
      const errorDiv = document.getElementById("error-message") // get the error message div
      errorDiv.textContent = "" // clear any previous error messages
      errorDiv.style.display = "none" // hide the error message div

      // TODO: add input validation here to ensure ingredients are a comma-separated list

      var ingredients = event.target.elements.ingredients.value // get the ingredients from the form input
      // parse the ingredients to ensure it is a comma-separated list and doesn't contain any special characters or numbers
      if (ingredients === "") {
        errorDiv.style.display = "block" // display the error message div
        errorDiv.textContent = "Please enter at least one ingredient!" // display an error message if no ingredients are entered
        return
      }
      if (!ingredients.match(/^[a-zA-Z, ]+$/)) {
        errorDiv.style.display = "block" // display the error message div
        errorDiv.textContent = "Please enter a valid list of ingredients" // display an error message if the ingredients contain special characters or numbers
        return
      }
      if (ingredients.includes(",")) {
        ingredients = ingredients
          .split(",")
          .map(ing => ing.trim())
          .join(",") // split the ingredients by comma, trim whitespace, and join back with comma
      }

      const diet = Array.from(event.target.elements.diet)
        .filter(d => d.checked)
        .map(d => d.value)
        .join(",") // get the diet from the select element
      const intolerances = Array.from(event.target.elements.intolerances)
        .filter(i => i.checked)
        .map(i => i.value)
        .join(",") // get the intolerances from the selection boxes for intolerances
      const resultLimit = event.target.elements.resultLimit.value // get the result limit from the form input

      const backendUrl = `${window.location.origin.replace(/:\d+$/, ":8080")}` // Replace port with backend port

      try {
        // try to fetch the recipes from the server
        const response = await fetch(`${backendUrl}/recipes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          // stringify the ingredients, diet, and intolerances and send them in the request body
          body: JSON.stringify({ ingredients, diet, intolerances, resultLimit })
        })

        if (response.ok) {
          // if the response from the fetch is OK (status 200), parse the JSON and display the recipes
          const recipes = await response.json() // parse the JSON response from the server into an array of recipes
          const searchResults = document.getElementById("search-results") // get the search results div

          searchResults.innerHTML = `<div class="divider"></div>  
                                       <ul id="recipes-list"></ul>
                                      ` // add a divider and an empty <ul> element to the search results div
          const recipesList = document.getElementById("recipes-list") // get the <ul> element
          recipesList.innerHTML = "" // clear the <ul> element

          if (
            recipes.length === 0 ||
            recipes === "Frontend: No recipes found"
          ) {
            // if no recipes are found or response is "No recipes found", display a message
            recipesList.innerHTML = "<li><h3>Sorry, no recipes found</h3></li>"
          } else {
            // otherwise, display the recipes
            recipes.forEach(recipe => {
              // iterate over the recipes array and create an <li> element for each recipe
              const li = document.createElement("li")
              li.innerHTML = `
                <a href="recipe.html?id=${recipe.id}">
                  <h3>${recipe.title}</h3>
                  <img src="${recipe.image}" alt="${recipe.title}" />
                </a>
              `
              recipesList.appendChild(li) // append the <li> element to the <ul> element
            })

            // scroll to the first result
            const firstResult =
              document.getElementById("recipes-list").firstElementChild // get the first result
            if (firstResult) {
              firstResult.scrollIntoView({ behavior: "smooth", block: "start" }) // scroll to the first result
            }
          }
        } else if (response.status === 400) {
          // if the response status is 400, display an error message
          const errorData = await response.json() // parse the JSON response from the server
          errorDiv.style.display = "block" // display the error message div
          if (errorData.message == "no ingredients given") {
            // if the error message is "no ingredients given", display a message
            errorDiv.textContent = "Please enter at least one ingredient!"
          } else {
            // otherwise, display a generic error message
            errorDiv.textContent = "An error occurred. Please try again."
          }
        } else {
          // if the response is not OK, throw an error with the status and parameter "error" from the response
          throw new Error(`${response.status}: ${await response.text()}`)
        }
      } catch (error) {
        // catch any errors and log them to the console
        console.error(error.message)
      }
    }
  })
})

// Function to load content dynamically
async function loadPage(page) {
  try {
    // Fetch the page content
    const response = await fetch(`../pages/${page}.html`)
    if (!response.ok) {
      // if the response is not OK (status 200), throw an error
      throw new Error(`Failed to load ${page}.html`)
    }
    // if the response is OK, set the content div to the response text
    content = document.getElementById("content")
    const html = await response.text()
    content.innerHTML = html
  } catch (error) {
    // catch any page load errors and display an error message on the page
    content.innerHTML = `<h1>Error</h1><p>Could not load the page. ${error.message}</p>`
  }

  if (page === "home") {
    const errorDiv = document.getElementById("error-message") // get the error message div
    errorDiv.textContent = "" // clear any previous error messages
    errorDiv.style.display = "none" // hide the error message div
    // get the current date
    const date = new Date()
    // get the current hour
    const hour = date.getHours()
    // get the greeting div
    const greeting = document.getElementById("greeting")
    // set the greeting based on the time of day
    if (hour < 12) {
      greeting.textContent = "Good Morning!"
    } else if (hour < 18) {
      greeting.textContent = "Good Afternoon!"
    } else {
      greeting.textContent = "Good Evening!"
    }
  }
}

// Function to toggle the display of the diet options
function toggleDietCheckboxArea() {
  const dietCheckboxArea = document.getElementById("dietCheckboxArea")
  const button = document.getElementById("toggle-diet")

  if (
    dietCheckboxArea.style.display === "none" ||
    dietCheckboxArea.style.display === ""
  ) {
    dietCheckboxArea.style.display = "flex"
    button.textContent = "Hide Diet Options"
  } else {
    dietCheckboxArea.style.display = "none"
    button.textContent = "Show Diet Options"
  }
}

// Function to toggle the display of the intolerances options
function toggleIntoleranceCheckboxArea() {
  const intolerancesCheckboxArea = document.getElementById(
    "intolerancesCheckboxArea"
  )
  const button = document.getElementById("toggle-intolerances")

  if (
    intolerancesCheckboxArea.style.display === "none" ||
    intolerancesCheckboxArea.style.display === ""
  ) {
    intolerancesCheckboxArea.style.display = "flex"
    button.textContent = "Hide Intolerances Options"
  } else {
    intolerancesCheckboxArea.style.display = "none"
    button.textContent = "Show Intolerances Options"
  }
}

// Function to clear the search form
function clearSearch() {
  document.getElementById("search-form").reset()
  document.getElementById("search-results").innerHTML = ""
}

// function to handle login form submission
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form")
  const loginError = document.getElementById("login-error")

  loginForm.addEventListener("submit", async event => {
    event.preventDefault() // Prevent the default form submission behavior

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    try {
      // Send a POST request to the login API
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password }) // Send login credentials
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.token

        if (token) {
          // Save the token in localStorage
          localStorage.setItem("token", token)

          // Redirect to the home page
          window.location.href = "/"
        } else {
          throw new Error("Token not received from server")
        }
      } else {
        const errorData = await response.json()
        loginError.textContent =
          errorData.error || "Login failed. Please try again."
      }
    } catch (error) {
      console.error("Error logging in:", error)
      loginError.textContent =
        "An unexpected error occurred. Please try again later."
    }
  })
})


