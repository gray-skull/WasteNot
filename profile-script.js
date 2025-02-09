async function fetchProfile() {
    const userInfo = document.getElementById("user-info")
    const token = localStorage.getItem("token")

    // If no token, show login/register message
    if (!token) {
        document.getElementById("user-info").innerHTML = `
                <p>You are not logged in. Please <a href="/login">Sign in</a> or <a href="/signup">Register</a>.</p>
            `
        return
    }

    try {
        const response = await fetch("http://localhost:8080/userProfile", {
        method: "GET",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error("Unable to authenticate user. Please try again later.")
        }

        const user = await response.json()

        const welcomeMessage = document.getElementById("welcome-message")
        welcomeMessage.innerHTML = `Welcome, ${user.username}!`

        const username = document.getElementById("username")
        username.innerHTML = `Username: <p>${user.username}</p>`

        const email = document.getElementById("email")
        email.innerHTML = `Email: <p>${user.email}</p>`

        const id = document.getElementById("id")
        id.innerHTML = `ID: <p>${user._id}</p>`

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
        alert("error:", error)
        console.error("Profile fetch error:", error)
        /*
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        localStorage.removeItem("email")
        localStorage.removeItem("_id")
        document.getElementById("user-info").innerHTML = `
                <p>Your session has expired. Please <a href="/login">Sign in</a> again.</p>
            `
        */
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await fetchProfile();

    const updatePasswordBtn = document.getElementById("updatePasswordBtn")
    const updateProfileBtn = document.getElementById("updateProfileBtn")
    const token = localStorage.getItem("token")

    // Update profile listener
    if(updateProfileBtn) {
        updateProfileBtn.addEventListener("click", async () => {

            try {
                const newUsername = document.getElementById("newUsername").value
                const newEmail = document.getElementById("newEmail").value
                const response = await fetch("http://localhost:8080/updateProfile", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ newUsername, newEmail }),
                });
                if (!response.ok) {
                    alert("Profile update failed. Please try again later.");
                }
                console.log(response);
                const updatedUser = await response.json();
                const updatedUsername = updatedUser.username;
                const updatedEmail = updatedUser.email;
                const updated_id = updatedUser._id;

                const welcomeUser = document.getElementById("welcome-user");

                localStorage.setItem("username", updatedUsername);
                localStorage.setItem("email", updatedEmail);
                localStorage.setItem("_id", updated_id);
                fetchProfile();
                welcomeUser.innerHTML = `Welcome, ${localStorage.getItem(username)}!`; 
                
                
                window.location.reload();
                alert("Profile updated successfully!");
                

            } catch (error) {
                console.error(error.message, error.stack.split("\n"));
            }
        })
    }

    // Update password
    if(updatePasswordBtn) {
        updatePasswordBtn.addEventListener("click", async () => {

            try {
                const oldPassword = document.getElementById("oldPassword").value
                const newPassword = document.getElementById("newPassword").value
                const response = await fetch("http://localhost:8080/updatePassword", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ oldPassword, newPassword }),
                })
                if (response.ok) {
                    alert("Password updated!")
                } else {
                    alert("Password update failed.")
                }
            } catch (error) {
                console.error(error.message, error.stack.split("\n"))
            }
        })
    }
})
