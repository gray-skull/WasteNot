async function fetchProfile() {
    const token = localStorage.getItem("token")
    const theme = localStorage.getItem("theme") || "light"

    // If no token, show login/register message
    if (!token) {
        document.getElementById("user-info").innerHTML = `
                <p>You are not logged in. Please <a href="/login">Sign in</a> or <a href="/signup">Register</a>.</p>
            `
        return
    }

    // Start fetching user profile
    try {
        const response = await fetch("/userProfile", {
        method: "GET",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json',
            }
        });
        // get the user data
        const user = await response.json();

        // If the token is invalid, prompt login
        if (!response.ok) {
            // Clear local storage
            localStorage.clear()
            localStorage.setItem("theme", theme)
            // display a message to the user
            document.getElementById("user-info").innerHTML = `
                <p>Your session has expired. Please <a href="/login">Sign in</a> again.</p>
            `;
            // throw an error to stop the function
            throw new Error("Your session has expired. Please Log in again.")
        }

        // Save user data to local storage
        const username = document.getElementById("username")
        if (username) {
            username.innerHTML = `${user.username}`
        }

        const email = document.getElementById("email")
        if (email) {
            email.innerHTML = `${user.email}`
        }

        const id = document.getElementById("id")
        if (id) {
            id.innerHTML = `${user._id}`
        }

        const lastUpdated = document.getElementById("lastUpdated")
        const formattedDate = new Date(user.lastUpdate).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        lastUpdated.innerHTML = `${formattedDate}`;


        //Render any saved recipes
        const savedRecipesContainer = document.getElementById("saved-recipes");
        if (user.savedRecipes && user.savedRecipes.length > 0) {
            let recipesHtml = `<h3>Saved Recipes</h3><ul id="saved-recipes-list">`;
            user.savedRecipes.forEach(recipe => {
                recipesHtml += `
                    <li>
                        <a href="recipe.html?id=${recipe.id}">
                        <h3>${recipe.title}</h3>
                        <section class="image-box" style="width: 200px; margin: 0 auto;">
                            <img src="${recipe.image}" alt="${recipe.title}" />
                        </section>
                        </a>
                    </li>
                `;
            });
            recipesHtml += `<ul>`;
            savedRecipesContainer.innerHTML = recipesHtml;
        } else {
            savedRecipesContainer.innerHTML = `<p>You haven't saved any recipes yet.</p>`;
        }

    } catch (error) {
        // If token is invalid or request fails, clear the token and prompt login
        const profileInfoError = document.getElementById("profileInfoError")
        if (profileInfoError) {
            profileInfoError.innerHTML = `Error: ${error.message}`
            profileInfoError.style.color = "red"
        }
        console.error("Profile fetch error:", error)
        
        // Clear local storage
        localStorage.clear()
        localStorage.setItem("theme", theme)

        // Show login/register buttons
        document.getElementById("login-btn").style.display = "inline"
        document.getElementById("signup-btn").style.display = "inline"
        // Hide user info and logout button
        document.getElementById("welcome-user").style.display = "none"
        document.getElementById("logout-btn").style.display = "none"
        // Redirect to login page after 5 seconds
        let countdown = 5
        const countdownInterval = setInterval(() => {
            document.getElementById("user-info").innerHTML += `
                <p>Redirecting to login in ${countdown} seconds...</p>
            `
            countdown -= 1
            if (countdown === 0) {
                clearInterval(countdownInterval)
            window.location.href = "/login"
            }
        }, 1000)
    }
}

// Function to show error messages
function showError(elementId, message, color = "red") {
    const errorElement = document.getElementById(elementId);
    errorElement.innerHTML = message;
    errorElement.style.color = color;
    errorElement.style.display = "block"; // Ensure the error message is visible
}

// Function to hide error messages
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.style.display = "none"; // Hide the error message
}

// Event listeners for profile page buttons and forms
document.addEventListener("DOMContentLoaded", async () => {
    await fetchProfile();

    // hide all error messages on page load using the hideError function
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach(element => {
        hideError(element.id);
    });

    // Get all the elements we need to add event listeners to
    const deleteProfileBtn = document.getElementById("deleteProfileBtn");
    const updatePasswordBtn = document.getElementById("updatePasswordBtn");
    const updateProfileBtn = document.getElementById("updateProfileBtn");
    const updatePreferencesForm = document.getElementById("updatePreferencesForm");
    const dietPreferenceCheckboxArea = document.getElementById("dietPreferenceCheckboxArea");
    const intolerancePreferenceCheckboxArea = document.getElementById("intolerancePreferenceCheckboxArea");
    
    // Get the token from local storage
    const token = localStorage.getItem("token");

    // Toggle diet and intolerance checkboxes based on user preferences from local storage
    if (dietPreferenceCheckboxArea && intolerancePreferenceCheckboxArea) {
        const diets = localStorage.getItem("diets") ? localStorage.getItem("diets") : [];
        const intolerances = localStorage.getItem("intolerances") ? localStorage.getItem("intolerances") : [];
        Array.from(dietPreferenceCheckboxArea.querySelectorAll('input')).forEach(d => {
            if (diets.includes(d.value)) {
                d.checked = true;
            }
        });
        Array.from(intolerancePreferenceCheckboxArea.querySelectorAll('input')).forEach(i => {
            if (intolerances.includes(i.value)) {
                i.checked = true;
            }
        });
    }

    // Create Delete profile button listener
    if (deleteProfileBtn) {
        deleteProfileBtn.addEventListener("click", async () => {
            // Confirm the user wants to delete their profile
            const userConfirm = confirm("Are you sure you want to delete your profile? This action cannot be undone.");
            // If the user confirms, send the delete request
            if (!userConfirm) {
                return;
            } else {
                // Send the delete request
                try {
                    const response = await fetch("/deleteProfile", {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });
                    // Handle the response
                    if (response.ok) {
                        // Clear local storage and show a success message
                        localStorage.clear();
                        showError("profileInfoError", "Your profile has been deleted. Redirecting to login..."); 
                        // Redirect to the login page after 5 seconds 
                        let countdown = 5;
                        const countdownInterval = setInterval(() => {
                            showError("profileInfoError", `Your profile has been deleted. Redirecting to login in ${countdown} seconds...`);
                            countdown -= 1;
                            if (countdown === 0) {
                                clearInterval(countdownInterval);
                            window.location.href = "/login";
                            }
                        }, 1000);
                    } else {
                        // Show an error message if the request fails
                        showError("deleteProfileError", "Profile deletion failed. Please try again later.");
                        console.error("Profile deletion failed.");
                    }
                } catch (error) {
                    // Show an error message if the request fails
                    showError("deleteProfileError", error.message);
                    console.error(error.message, error.stack.split("\n"));
                }
            }
        });
    }

    // Create Update profile listener
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener("click", async () => {
            try {
                // Get the new username and email values from the form
                const newUsernameElement = document.getElementById("newUsername");
                const newUsernameConfirmElement = document.getElementById("newUsernameConfirm");
                const newEmailElement = document.getElementById("newEmail");
                const newEmailConfirmElement = document.getElementById("newEmailConfirm");
                // Get the values from the form elements or set them to empty strings
                const newUsername = newUsernameElement ? newUsernameElement.value : "";
                const newUsernameConfirm = newUsernameConfirmElement ? newUsernameConfirmElement.value : "";
                const newEmail = newEmailElement ? newEmailElement.value : "";
                const newEmailConfirm = newEmailConfirmElement ? newEmailConfirmElement.value : "";

                
                // set error message to empty string
                hideError("updateProfileError");
                // set conditions for validation errors
                const validationErrors = [
                    { condition: !newUsername && !newEmail, message: "Nothing to update!" },
                    { condition: newUsername && !newUsernameConfirm, message: "Please confirm new username." },
                    { condition: newEmail && !newEmailConfirm, message: "Please confirm new email." },
                    { condition: newUsername !== newUsernameConfirm, message: "New username and confirmation do not match." },
                    { condition: newEmail !== newEmailConfirm, message: "New email and confirmation do not match." }
                ];

                // Check for validation errors
                for (const error of validationErrors) {
                    if (error.condition) {
                        showError("updateProfileError", error.message);
                    return;
                    }
                }

                // Send the update profile request
                const response = await fetch("/updateProfile", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ newUsername, newEmail }),
                });

                // Handle the response
                if (!response.ok) {
                    const errorData = await response.json();
                    showError("updateProfileError", errorData.message || "Profile update failed. Bad response from server.");
                    console.error("Profile update failed.");
                } else {
                    // Update the user's information in local storage
                    const updatedUser = await response.json();
                    localStorage.setItem("username", updatedUser.username);
                    localStorage.setItem("email", updatedUser.email);
                    localStorage.setItem("lastUpdated", updatedUser.lastUpdate);
                    // Update the user's information on the page
                    await fetchProfile();
                    // Update the welcome message
                    const welcomeUser = document.getElementById("welcome-user");
                    welcomeUser.innerHTML = `Welcome, ${localStorage.getItem("username")}!`;
                    // Show the success message
                    showError("updateProfileError", "Profile updated successfully!", "green");
                }
            } catch (error) {
                // Show an error message if the request fails
                showError("updateProfileError", "Profile update failed. Please try again later.");
                console.error(error.message, error.stack.split("\n"));
            }
        });
    }

    // Create Update password listener
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener("click", async () => {
            try {
                const currentPassword = document.getElementById("currentPassword").value;
                const newPassword = document.getElementById("newPassword").value;
                const confirmNewPassword = document.getElementById("confirmNewPassword").value;
                
                // Clear any previous error messages
                hideError("updatePasswordError");

                // create conditions for validation errors
                const errors = [
                    { condition: newPassword !== confirmNewPassword, message: "New password and confirm password do not match." },
                    { condition: currentPassword === newPassword, message: "New password cannot be the same as the current password." },
                    { condition: newPassword.length < 6, message: "Password must be at least 6 characters long." },
                    { condition: newPassword.length > 20, message: "Password must be at most 20 characters long." },
                    { condition: !/^[\x20-\x7E]*$/.test(newPassword), message: "Password can only contain letters, numbers, and common symbols. Allowed symbols: !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" },
                ];
                // Check for validation errors
                for (const error of errors) {
                    if (error.condition) {
                        showError("updatePasswordError", error.message);
                        return;
                    }
                }

                const response = await fetch("/updatePassword", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ currentPassword, newPassword }),
                });
                // Handle the response
                const updatedUser = await response.json();
                // Check if the response is ok
                if (response.ok) {
                    // Clear the password fields
                    document.getElementById("currentPassword").value = "";
                    document.getElementById("newPassword").value = "";
                    document.getElementById("confirmNewPassword").value = "";

                    // update the user's last updated time
                    localStorage.setItem("lastUpdated", updatedUser.lastUpdate);
                    showError("updatePasswordError", "Password updated successfully!", "green");
                } else {
                    // Show an error message if the request fails
                    showError("updatePasswordError", "Password update failed.");
                }
            } catch (error) {
                // Show an error message if the request fails
                console.error(error.message, error.stack.split("\n"));
            }
        });
    }

    // Update preferences
    if (updatePreferencesForm) {
        updatePreferencesForm.addEventListener("submit", async (event) => {
            event.preventDefault();

                const diets = Array.from(event.target.elements.diet)
                    .filter(d => d.checked)
                    .map(d => d.value);
                const intolerances = Array.from(event.target.elements.intolerances)
                    .filter(i => i.checked)
                    .map(i => i.value);

            // Send the update preferences request
            try {
                const response = await fetch("/updatePreferences", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ diets, intolerances }),
                });
                // Handle the response
                if (response.ok) {
                    // Update the user's preferences in local storage
                    localStorage.setItem("diets", diets);
                    localStorage.setItem("intolerances", intolerances);
                    showError("updatePreferencesError", "Preferences updated successfully!", "green");
                } else {
                    // Show an error message if the request fails
                    showError("updatePreferencesError", "Preferences update failed.");
                }
            } catch (error) {
                // Show an error message if the request fails
                console.error(error.message, error.stack.split("\n"));
            }
        });
    }
});
