// dynamic content generation for the navigation menu
document.addEventListener("DOMContentLoaded", () => {
  // insert the footer content into the footer div
  const footer = document.getElementById("footer")
  if (footer) {
    footer.innerHTML = `
    <p>Images from <a href="https://spoonacular.com/food-api" target="_blank">Spoonacular API</a></p>
    <a href="#" onclick="openDynamicModal('terms')" class="footer-link">Terms of Use</a> |
    <a href="#" onclick="openDynamicModal('privacy')" class="footer-link">Privacy Policy</a> |
    <a href="#" onclick="openDynamicModal('accessibility')" class="footer-link">Accessibility</a>
    <p>&copy; 2025 WasteNot</p>
    `
  }

  // Add a modal to the page
  const modalDiv = document.createElement("div")
  modalDiv.id = "dynamicModal"
  modalDiv.classList.add("modal")
  document.body.appendChild(modalDiv)

    const modalContent = document.createElement("div")
    modalContent.classList.add("modal-content")
    modalDiv.appendChild(modalContent)

      const modalSpan = document.createElement("span")
      modalSpan.classList.add("close")
      modalSpan.innerHTML = "&times;"
      modalSpan.onclick = closeModal
      modalContent.appendChild(modalSpan)

      const modalTitle = document.createElement("h2")
      modalTitle.id = "modalTitle"
      modalContent.appendChild(modalTitle)

      const modalText = document.createElement("p")
      modalText.id = "modalContent"
      modalContent.appendChild(modalText)


      modalTitle.textContent = "Welcome"
      modalText.textContent = "This is the default content for the modal."

  // Add a dark mode toggle button to the page
  const themeToggleBtn = document.createElement("button")
  themeToggleBtn.textContent = "Toggle Theme"
  themeToggleBtn.classList.add("darkTheme-button")
  if (footer) {
    footer.insertBefore(themeToggleBtn, footer.firstChild)
  }

  // Check saved theme preference
  let currentTheme = localStorage.getItem("theme") || "light"

  if (currentTheme === "dark") {
    document.body.classList.add("dark-mode")
  }

  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode")

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark")
      themeToggleBtn.textContent = "Light Mode"
    } else {
      localStorage.setItem("theme", "light")
      themeToggleBtn.textContent = "Dark Mode"
    }
  })

  // load the bottom-menu on each page, inserts the html into the bottom-menu div
  const bottomMenu = document.getElementById("bottom-menu")
  if (bottomMenu) {
    bottomMenu.innerHTML = `
    <a href='#' id="home" onclick="window.location.href='/home'">Home</a>
    <a href='#' id="about" onclick="window.location.href='/about'">About</a>
    <a href='#' id="profile" onclick="window.location.href='/profile'">Profile</a>
    <a href='#' id="list" onclick="window.location.href='/list'">List</a>
    `
  }

  // load the bottom-menu-select on each page, inserts the html into the bottom-menu-select div
  const bottomMenuSelect = document.getElementById("bottom-menu-select")
  if (bottomMenuSelect) {
    bottomMenuSelect.innerHTML = `
      <option value="" disabled selected>Navigate to...</option>
      <option value="/home">Home</option>
      <option value="/about">About</option>
      <option value="/profile">Profile</option>
      <option value="/list">List</option>
    `
    bottomMenuSelect.addEventListener("change", event => {
      const selectedValue = event.target.value
      if (selectedValue) {
        window.location.href = selectedValue
      }
    })
  }

  // load the signup and login buttons on each page, inserts the html into the auth-buttons div
  const authButtons = document.getElementById("auth-buttons")
  if (authButtons) {
    authButtons.innerHTML = `
    <button id="login-btn" onclick="window.location.href='/login'">Login</button>
    <button id="signup-btn" onclick="window.location.href='/signup'">Sign Up</button>
    <span id="welcome-user" style="display: none"></span>
    <button id="logout-btn" style="display: none">Logout</button>
    `
  }

  // code for handling login, signup, and logout buttons
  // Get the login, signup, logout, and welcome user elements
  const loginBtn = document.getElementById("login-btn")
  const signupBtn = document.getElementById("signup-btn")
  const logoutBtn = document.getElementById("logout-btn")
  const welcomeUser = document.getElementById("welcome-user")

  const token = localStorage.getItem("token") //Retrieve token from storage
  const username = localStorage.getItem("username") //Retrieve user from storage

  if (window.location.pathname !== "/") {
    if (token) {
      // Verify token with the server
      fetch(`${window.location.origin.replace(/:\d+$/, ":8080")}/verify-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          // If the token is valid
          loginBtn.style.display = "none"
          signupBtn.style.display = "none"
          welcomeUser.style.display = "inline"
          welcomeUser.innerHTML = `Logged in: <a href="/profile">${username}</a>`
          logoutBtn.style.display = "inline"
        } else {
          // If the token is invalid
          localStorage.removeItem("token")
          localStorage.removeItem("username")
          loginBtn.style.display = "inline"
          signupBtn.style.display = "inline"
          welcomeUser.style.display = "none"
          logoutBtn.style.display = "none"
        }
      })
      .catch(error => {
        console.error("Error verifying token:", error)
        loginBtn.style.display = "inline"
        signupBtn.style.display = "inline"
        welcomeUser.style.display = "none"
        logoutBtn.style.display = "none"
      })
    } else {
      // If no user is logged in
      loginBtn.style.display = "inline"
      signupBtn.style.display = "inline"
      welcomeUser.style.display = "none"
      logoutBtn.style.display = "none"
    }

    // function to handle the logout button click event
    logoutBtn.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("theme") || "light"
      localStorage.clear()
      window.location.reload()
      localStorage.setItem("theme", currentTheme)
    })
  }

  // >>>>>>>>>> HOME: code specific to the home page <<<<<<<<<<
  if (window.location.pathname.includes("/home")) {
    // get the current date
    const date = new Date()
    // get the current hour
    const hour = date.getHours()
    // get the greeting div
    const greeting = document.getElementById("greeting")
    let username
    if (localStorage.getItem("token")) {
      username = localStorage.getItem("username")
    } else {
      username = "Guest"
    }
    // set the greeting based on the time of day
    if (hour < 12) {
      greeting.textContent = `Good Morning, ${username}!`
    } else if (hour < 18) {
      greeting.textContent = `Good Afternoon, ${username}!`
    } else {
      greeting.textContent = `Good Evening, ${username}!`
    }

    // hide the error message div on page load and clear any previous error messages
    const errorDiv = document.getElementById("error-message") // get the error message div
    errorDiv.textContent = "" // clear any previous error messages
    errorDiv.style.display = "none" // hide the error message div

    // if the user is logged in, toggle the diet and intolerance options from the user preferences
    const dietPreferenceCheckboxArea =
      document.getElementById("dietCheckboxArea") // get the diet checkbox area
    const intolerancePreferenceCheckboxArea = document.getElementById(
      "intolerancesCheckboxArea"
    ) // get the intolerance checkbox area
    const diets = localStorage.getItem("diets")
      ? localStorage.getItem("diets").split(",")
      : [] // get the diets from local storage
    const intolerances = localStorage.getItem("intolerances")
      ? localStorage.getItem("intolerances").split(",")
      : [] // get the intolerances from local storage

    // iterate over the diet checkboxes and check the ones that match the user preferences
    Array.from(dietPreferenceCheckboxArea.querySelectorAll("input")).forEach(
      d => {
        if (diets.includes(d.value)) {
          d.checked = true
        }
      }
    )

    // iterate over the intolerance checkboxes and check the ones that match the user preferences
    Array.from(
      intolerancePreferenceCheckboxArea.querySelectorAll("input")
    ).forEach(i => {
      if (intolerances.includes(i.value)) {
        i.checked = true
      }
    })

    // add an event listener to the content div to handle search form submissions
    document.addEventListener("submit", async event => {
      // check if the event target is the search form and the submit button was clicked
      if (
        event.target.id === "search-form" &&
        event.submitter.id === "search-button"
      ) {
        event.preventDefault() // prevent the default form submission behavior

        var ingredients = event.target.elements.ingredients.value // get the ingredients from the form input
        const searchResults = document.getElementById("search-results") // get the search results div

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
            body: JSON.stringify({
              ingredients,
              diet,
              intolerances,
              resultLimit
            })
          })

          if (response.ok) {
            const responseJson = await response.json() // parse the JSON response from the server
            const recipes = responseJson.data ? responseJson.data.results : [] // get the recipes from the response
            console.log(responseJson.headers)
            const quotaRequest = responseJson.headers["x-api-quota-request"] // get the quota request from the response headers
            const quotaUsed = responseJson.headers["x-api-quota-used"] // get the quota used from the response headers
            const quotaLeft = responseJson.headers["x-api-quota-left"] // get the quota left from the response headers

            searchResults.innerHTML = `<div class="divider"></div>  
                                        <ul id="recipes-list"></ul>
                                        ` // add a divider and an empty <ul> element to the search results div
            const recipesList = document.getElementById("recipes-list") // get the <ul> element
            recipesList.innerHTML = "" // clear the <ul> element
            
            if (document.getElementById("quota-message")) {
              document.getElementById("quota-message").remove()
            }
            const quotaMessage = document.createElement("p")
            quotaMessage.id = "quota-message"
            quotaMessage.textContent = `DEV ONLY -> API Points used: ${quotaRequest} | Points left: ${quotaLeft} | Total points used today: ${quotaUsed}`
            document.getElementById("search-form").appendChild(quotaMessage)

            if (
              recipes.length === 0 ||
              recipes === "Frontend: No recipes found"
            ) {
              // if no recipes are found or response is "No recipes found", display a message
              recipesList.innerHTML =
                "<li><h3>Sorry, no recipes found</h3></li>"
            } else {
              // otherwise, display the recipes
              recipes.forEach(recipe => {
                // iterate over the recipes array and create an <li> element for each recipe
                const li = document.createElement("li")
                li.innerHTML = `
                  <a href="recipe.html?id=${recipe.id}">
                    <h3>${recipe.title}</h3>
                    <section class="image-box">
                    <img src="${recipe.image}" alt="${recipe.title}" />
                    </section>
                  </a>
                `
                recipesList.appendChild(li) // append the <li> element to the <ul> element
              })

              // scroll to the first result
              const firstResult =
                document.getElementById("recipes-list").firstElementChild // get the first result
              if (firstResult) {
                // scroll until the first result is at the top of the viewport
                firstResult.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                })
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
  } // >>>>>>>>>> end of home page specific code <<<<<<<<<<

  // >>>>>>>>>> LOGIN: code specific to the login page <<<<<<<<<<
  if (window.location.pathname.includes("/login")) {
    // function to handle login form submission
    const loginForm = document.getElementById("login-form")
    const loginError = document.getElementById("login-error")

    loginForm.addEventListener("submit", async event => {
      event.preventDefault() // Prevent the default form submission behavior

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      try {
        // Send a POST request to the login API
        const backendUrl = `${window.location.origin.replace(/:\d+$/, ":8080")}/login`
        const response = await fetch(backendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password }) // Send login credentials
        })

        if(response.status === 401) {
          loginError.style.display = "block" // display the error message div
          loginError.style.color = "red" // set the color of the error message to red
          loginError.style.textAlign = "center" // center the error message
          loginError.textContent = "Invalid email or password" // display an error message
          return
        }

        if (response.ok) {
          // If the response is OK, get the token from the response

          const data = await response.json()
          const token = data.token
          const user = data.user
          const message = data.message

          if (token) {
            // Save the token in localStorage
            localStorage.setItem("token", token)
            localStorage.setItem("username", user.username)
            localStorage.setItem("email", user.email)
            localStorage.setItem("_id", user._id)
            localStorage.setItem("diets", user.diets || "")
            localStorage.setItem("intolerances", user.intolerances || "")
            localStorage.setItem("lastUpdated", user.lastUpdate || "")

            loginError.style.display = "block" // display the error message div
            loginError.textContent = message // display the success message

            // Redirect to the last page the user was on using document.referrer
            const lastPage = document.referrer;
            if (lastPage && lastPage !== window.location.href && !lastPage.includes("/signup") && !lastPage.includes("/reset-password")) {
              window.location.href = lastPage;
            } else {
              window.location.href = "/home";
            }
          } else {
            loginError.style.display = "block" // display the error message div
            loginError.textContent = "Login failed. Please try again." // display an error message
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
  } // >>>>>>>>>> end of login page specific code <<<<<<<<<<
}) // end of DOMContentLoaded event listener

// modal content
const modalData = {
  privacy: { title: "Privacy Policy", content: `Effective Date: 19 February 2025<br><br>
<ol>
<li>Introduction
WasteNot is a web application developed as part of an academic project. As a student project and not a commercial product, we do not collect, sell, or share personal data for commercial purposes. This Privacy Policy outlines the minimal data handling practices we follow to ensure a responsible and secure user experience.</li>

<li>Data Collection and Use
WasteNot does not require users to provide personally identifiable information to use the core features of the application.
If users create an account, only necessary information such as usernames and preferences may be stored for functionality purposes.
Any stored data is used solely to enhance the user experience within the application and is not shared with third parties.</li>

<li>Cookies and Local Storage
WasteNot may use local storage or session storage to remember user preferences, such as selected dietary filters.
No third-party tracking cookies are implemented in the application.</li>

<li>Third-Party Services
WasteNot retrieves recipe and ingredient data from third-party sources via public APIs.
We do not control the data practices of third-party sources and recommend users review their respective privacy policies.</li>

<li>Data Security
As a student project, we take basic precautions to protect stored data, but we do not guarantee enterprise-level security measures.
User data is not sold, shared, or used for purposes beyond the scope of the project.</li>

<li>Limitations and Disclaimers
WasteNot is an academic project, and data privacy measures are implemented to the best of our ability within the constraints of the project.
As this is not a commercial application, no guarantees of complete data security or regulatory compliance are provided.
Users should use the application with the understanding that it is designed for educational purposes only.</li>

<li>Changes to This Policy
Since WasteNot is a student project, updates may occur based on academic revisions or improvements.
Users will not receive direct notifications of changes, but updated policies will be reflected within the application.</li>

<li>Contact Information
WasteNot is a student project and does not provide direct support or contact options. For any privacy-related inquiries, please refer to the project documentation or academic instructor.</li>
</ol>

By using WasteNot, you acknowledge that this is an academic project with limited data privacy measures and that any data collection is solely for functionality within the application.` 
},
  terms: { title: "Terms of Use", content: `Effective Date: 19 February 2025<br><br>
<ol>
<li>Introduction<br>
Welcome to WasteNot, a mobile-friendly web application developed as part of an academic project. WasteNot is designed to help users minimize food waste by providing recipe suggestions based on available ingredients. By accessing or using the WasteNot platform, you acknowledge that this is a student project and agree to comply with these Terms of Use. If you do not agree with these terms, you must refrain from using the application.<br><br></li>

<li>Definitions<br>
WasteNot refers to the web application developed by Scrum Team 4 for educational purposes. User refers to anyone who accesses or uses WasteNot. Content includes but is not limited to recipes, text, graphics, images, and software. Third-Party Services refers to APIs or external data sources that provide recipe content and other features.<br><br></li>

<li>Eligibility<br>
To use WasteNot, you must be at least 13 years old. If you are under 18, you may only use the application with parental or guardian consent.<br><br></li>

<li>User Accounts<br>
Users may create accounts to save preferences, favorite recipes, and set dietary restrictions. You are responsible for maintaining the confidentiality of your account credentials. WasteNot reserves the right to terminate accounts that violate these Terms of Use.<br><br></li>

<li>Permitted Use<br>
WasteNot grants users a limited, non-exclusive, non-transferable license to use the application for personal, non-commercial purposes. Users may not:<br>
<ul>
<li>Use the application for unlawful activities.</li>
<li>Modify, distribute, sell, or lease any part of WasteNot.</li>
<li>Interfere with the security or functionality of the application.<br><br></li>
</ul>

<li>Recipe and Ingredient Data<br>
WasteNot retrieves recipes and ingredient data from third-party sources. The accuracy, completeness, and reliability of recipe content cannot be guaranteed. Users assume full responsibility for verifying ingredient suitability and dietary compatibility.<br><br></li>

<li>Privacy and Data Collection<br>
WasteNot does not collect personally identifiable information beyond what is necessary for application functionality. Any stored user data is used solely for academic and functional purposes. Users acknowledge that anonymized data may be used to improve application functionality.<br><br></li>

<li>Third-Party Services<br>
WasteNot may include links or integrations with third-party services. WasteNot is not responsible for the content, privacy policies, or security of third-party websites or services. Users interact with third-party services at their own risk.<br><br></li>

<li>Limitation of Liability<br>
WasteNot is provided as is as part of a student project and does not offer any guarantees of accuracy, availability, or security. WasteNot and its developers shall not be liable for any damages, including but not limited to data loss, personal injury, or financial loss, resulting from the use of the application. Users acknowledge that WasteNot does not guarantee uninterrupted or error-free service.<br><br></li>

<li>Modifications to the Terms<br>
WasteNot reserves the right to modify these Terms of Use at any time without prior notice. Continued use of WasteNot after modifications constitutes acceptance of the revised terms.<br><br></li>

<li>Termination<br>
WasteNot reserves the right to suspend or terminate access to users who violate these Terms of Use. Users may delete their accounts at any time through account settings. Upon termination, user data may be retained for academic purposes only.<br><br></li>

<li>Governing Law<br>
These Terms of Use shall be interpreted solely for educational and project-related purposes. Any legal interpretation should recognize that this is a non-commercial student project with no corporate affiliation.<br><br></li>

<li>Contact Information<br>
WasteNot is a student project, and we do not offer direct support or contact options. For any issues or inquiries, please refer to the project documentation or academic instructor.<br><br></li>
</ol>

By using WasteNot, you acknowledge that you have read, understood, and agreed to these Terms of Use.<br>
` },
  accessibility: { title: "Accessibility", content: `Effective Date: 19 February 2025<br><br>
<ol>
<li>Introduction<br>
WasteNot is a web application developed as part of an academic project. We are committed to ensuring that it is accessible to all users, including individuals with disabilities. While WasteNot is a student project and not a commercial product, we strive to follow recognized accessibility standards and best practices.<br><br></li>

<li>Accessibility Standards Compliance<br>
WasteNot is designed with reference to the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. These guidelines help make web content more accessible to a wider range of people with disabilities, including those with visual, auditory, motor, and cognitive impairments.<br><br></li>

<li>Key Accessibility Features<br>
<ul>
  <li>Keyboard Navigation: The app is designed to be navigable using a keyboard, allowing users to interact with essential features without requiring a mouse.</li>
  <li>Screen Reader Compatibility: Content is structured and labeled appropriately to improve compatibility with screen readers such as NVDA, JAWS, and VoiceOver.</li>
  <li>Text Alternatives: Non-text content, including images and icons, includes appropriate alternative text descriptions where applicable.</li>
  <li>Color Contrast: Text and background colors are chosen to maintain a contrast ratio that enhances readability for users with low vision.</li>
  <li>Resizable Text: Users should be able to resize text up to 200% without loss of functionality or readability.</li>
  <li>Accessible Forms: Forms include labels and validation messages to assist users in completing input fields accurately.</li>
  <li>Skip Navigation Links: A skip link is available to allow users to bypass repetitive navigation elements and go directly to the main content.<br><br></li>
</ul>

<li>Testing and Continuous Improvement<br>
As an academic project, WasteNot is tested for accessibility through:<br>
<ul>
  <li>Automated accessibility testing tools such as Axe and WAVE.</li>
  <li>Manual testing with screen readers and keyboard navigation.</li>
  <li>Academic review and feedback to identify and address potential barriers.<br><br></li>
</ul>

<li>Limitations and Disclaimers<br>
WasteNot is a student-developed project and does not guarantee full compliance with all accessibility standards.<br>
While we make efforts to ensure accessibility, certain features may be limited due to resource constraints.<br>
Users should be aware that accessibility improvements will be made based on academic development cycles rather than commercial support timelines.<br><br></li>

<li>Contact Information<br>
WasteNot is a student project, and direct support or contact options are not available. For any accessibility-related feedback, please refer to the project documentation or academic instructor.<br><br></li>
</ol>

By using WasteNot, you acknowledge that this is an academic project and that accessibility efforts are made in good faith to improve user experience where possible.` 
}
}

// open modal function
function openDynamicModal(type) {
  document.getElementById("modalTitle").textContent = modalData[type].title
  document.getElementById("modalContent").innerHTML = modalData[type].content
  document.getElementById("dynamicModal").style.display = "block"
}

// close modal function
function closeModal() {
  document.getElementById("dynamicModal").style.display = "none"
}

// Close the modal when clicking outside the modal content
window.onclick = function(event) {
  let modals = document.querySelectorAll(".modal");
  modals.forEach(modal => {
      if (event.target == modal) {
          modal.style.display = "none";
      }
  });
};

// global code for all pages
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
  const intolerancesCheckboxArea = document.getElementById(
    "intolerancesCheckboxArea"
  )
  const dietCheckboxArea = document.getElementById("dietCheckboxArea")
  const resultLimit = document.getElementById("resultLimit")
  intolerancesCheckboxArea.style.display = "none"
  dietCheckboxArea.style.display = "none"
  resultLimit.value = "2"
}