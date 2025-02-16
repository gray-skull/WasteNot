// function to handle signup form submission
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form")
  const signupError = document.getElementById("signup-error")

  signupForm.addEventListener("submit", async event => {
    event.preventDefault() // Prevent default form submission behavior

    const username = document.getElementById("username").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirm-password").value

    // Validate the form input
    if (!username || !email || !password || !confirmPassword) {
      signupError.textContent = "All fields are required."
      return
    }
    // Validate the password
    if (password !== confirmPassword) {
      signupError.textContent = "Passwords do not match."
      return
    }

    // Clear any previous error message and display a loading spinner
    signupError.textContent = ""
    const spinner = document.createElement("span")
    spinner.classList.add("spinner-border", "spinner-border-sm")
    signupError.appendChild(spinner)


    try {
      // Send a POST request to the /register route
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (response.ok) {
        // Success: Notify the user and redirect to login
        alert("Account created successfully! You can now log in.")
        window.location.href = "/login"
      } else {
        // Display the error message from the server
        signupError.textContent =
          data.error || "Signup failed. Please try again."
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Signup error:", error)
      signupError.textContent =
        "An unexpected error occurred. Please try again."
    }
  })
})
