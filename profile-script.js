async function fetchProfile() {
    const token = localStorage.getItem("token")

    // If no token, show login/register message
    if (!token) {
        document.getElementById("user-info").innerHTML = `
                <p>You are not logged in. Please <a href="/login">Sign in</a> or <a href="/signup">Register</a>.</p>
            `
        return
    }

    try {
        const response = await fetch("/userProfile", {
        method: "GET",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json',
            }
        });

        if (!response.ok) {
            window.location.href = "/login"
            throw new Error("Your session has expired. Please Log in again.")
            
        }

        const user = await response.json()

        const username = document.getElementById("username")
        username.innerHTML = `${user.username}`

        const email = document.getElementById("email")
        email.innerHTML = `${user.email}`

        const id = document.getElementById("id")
        id.innerHTML = `${user._id}`

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
                            <h4>${recipe.title}</h4>
                            <img src="${recipe.image}" alt="${recipe.title}" style="width:100px;"/>
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

        // Show login/register buttons
        document.getElementById("login-btn").style.display = "inline"
        document.getElementById("signup-btn").style.display = "inline"
        // Hide user info and logout button
        document.getElementById("welcome-user").style.display = "none"
        document.getElementById("logout-btn").style.display = "none"
         
        document.getElementById("user-info").innerHTML = `
            <p>Your session has expired. Please <a href="/login">Sign in</a> again.</p>
            `

        // Redirect to login page after 5 seconds
        setTimeout(() => {
            window.location.href = "/login"
        }, 5000);
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

    // Update profile listener
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener("click", async () => {
            try {
                const newUsernameElement = document.getElementById("newUsername");
                const newEmailElement = document.getElementById("newEmail");
                const newUsername = newUsernameElement.value;
                const newEmail = newEmailElement.value;

                if (!newUsername && !newEmail) {
                    showError("updateProfileError", "Both fields cannot be empty.");
                    return;
                }

                const response = await fetch("/updateProfile", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ newUsername, newEmail }),
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    showError("updateProfileError", errorData.message || "Profile update failed. Bad response from server.");
                    console.error("Profile update failed.");
                } else {
                    const updatedUser = await response.json();

                    localStorage.setItem("username", updatedUser.username);
                    localStorage.setItem("email", updatedUser.email);
                    localStorage.setItem("lastUpdated", updatedUser.lastUpdate);
                    
                    fetchProfile();

                    const welcomeUser = document.getElementById("welcome-user");
                    welcomeUser.innerHTML = `Welcome, ${localStorage.getItem("username")}!`;

                    showError("updateProfileError", "Profile updated successfully!", "green");
                }
            } catch (error) {
                showError("updateProfileError", "Profile update failed. Please try again later.");
                console.error(error.message, error.stack.split("\n"));
            }
        });
    }

    // Update password
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener("click", async () => {
            try {
                const currentPassword = document.getElementById("currentPassword").value;
                const newPassword = document.getElementById("newPassword").value;
                const confirmNewPassword = document.getElementById("confirmNewPassword").value;
                
                // Validate the new password and confirm password
                hideError("updatePasswordError");
                const errors = [
                    { condition: newPassword !== confirmNewPassword, message: "New password and confirm password do not match." },
                    { condition: currentPassword === newPassword, message: "New password cannot be the same as the current password." },
                    { condition: newPassword.length < 6, message: "Password must be at least 6 characters long." },
                    { condition: newPassword.length > 20, message: "Password must be at most 20 characters long." },
                    { condition: !/^[\x20-\x7E]*$/.test(newPassword), message: "Password can only contain letters, numbers, and common symbols. Allowed symbols: !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~" },
                ];
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
                const updatedUser = await response.json();
                if (response.ok) {
                    // Clear the password fields
                    document.getElementById("currentPassword").value = "";
                    document.getElementById("newPassword").value = "";
                    document.getElementById("confirmNewPassword").value = "";

                    // update the user's last updated time
                    localStorage.setItem("lastUpdated", updatedUser.lastUpdate);
                    showError("updatePasswordError", "Password updated successfully!", "green");
                } else {
                    showError("updatePasswordError", "Password update failed.");
                }
            } catch (error) {
                console.error(error.message, error.stack.split("\n"));
            }
        });
    }

    // Update preferences
    if (updatePreferencesForm) {
        updatePreferencesForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const diets = Array.from(event.target.elements.diet)
                    .filter(d => d.checked)
                    .map(d => d.value);
                const intolerances = Array.from(event.target.elements.intolerances)
                    .filter(i => i.checked)
                    .map(i => i.value);
                const response = await fetch("/updatePreferences", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ diets, intolerances }),
                });
                if (response.ok) {
                    localStorage.setItem("diets", diets);
                    localStorage.setItem("intolerances", intolerances);
                    showError("updatePreferencesError", "Preferences updated successfully!", "green");
                } else {
                    showError("updatePreferencesError", "Preferences update failed.");
                }
            } catch (error) {
                console.error(error.message, error.stack.split("\n"));
            }
        });
    }
});
