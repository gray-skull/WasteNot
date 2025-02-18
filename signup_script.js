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

    const errors = [
      { condition: password === "" || confirmPassword === "", message: "Please enter and confirm your new password." },
      { condition: password !== confirmPassword, message: "Password and confirm password do not match." },
      { condition: password.length < 6, message: "Password must be at least 6 characters long." },
      { condition: password.length > 20, message: "Password must be at most 20 characters long." },
      { condition: !/^[\x20-\x7E]*$/.test(password), message: "Password can only contain letters, numbers, and common symbols. Allowed symbols: !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" },
    ];

    for (const error of errors) {
        if (error.condition) {
            signupError.textContent = error.message;
            return;
        }
    }

    // Clear any previous error message
    signupError.textContent = ""

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
        signupError.textContent = "Signup successful. Redirecting to login..."
        setTimeout(() => {
          window.location.href = "/login"
        }, 5000)
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
