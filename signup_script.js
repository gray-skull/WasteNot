// function to handle signup form submission
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form")
  const signupError = document.getElementById("signup-error")

  signupForm.addEventListener("submit", async event => {
    event.preventDefault() // Prevent default form submission behavior

    const username = document.getElementById("username").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    try {
      // Send a POST request to the /register route
      const response = await fetch("http://localhost:8080/register", {
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
