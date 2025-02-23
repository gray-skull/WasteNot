document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    const errorText = document.getElementById("shopping-list-error");

    const clearButton = document.getElementById("clear-shopping-list");
    const deleteButton = document.getElementById("delete-ingredients");

    // hide the buttons if the shopping list is empty
    clearButton.style.display = "none";
    deleteButton.style.display = "none";

    if (!token) {
        errorText.innerHTML = "You must be logged in. Please <a href='/login'>Login</a> to manage your shopping list.";
        errorText.style.display = "block";
        return;
    }

    const loadShoppingList = async () => {
        const shoppingListTable = document.getElementById("shopping-list");
        shoppingListTable.innerHTML = ""; // Clear the table

        // get the user's shopping list
        try {
            const response = await fetch("/shopping-list/get", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const shoppingListData = await response.json();

            if (!response.ok) {


                errorText.style.display = "block";
                if (response.status === 401) {
                    errorText.innerHTML = "Your session has expired. Please <a href='/login'>login</a> again";
                    throw new Error("User not authenticated");
                } else if (response.status === 404) {
                    errorText.textContent = "Your shopping list is empty.";
                    throw new Error("Shopping list is empty");
                } else {
                    errorText.textContent = shoppingListData.error || "Error loading shopping list.";
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            
            const ingredientName = shoppingListData.length > 0 ? shoppingListData.map(ing => ing.name) : [];
            const ingredientAmountUnit = shoppingListData.length > 0 ? shoppingListData.map(ing => `${ing.amount} ${ing.unit}`) : [];
            const ingredientAisle = shoppingListData.length > 0 ? shoppingListData.map(ing => ing.aisle) : [];


            // add headers to the table
            const tableHeader = document.createElement("thead");
            const headers = ["✓", "Ingredient", "Amount", "Aisle"];
            headers.forEach(headerText => {
                const header = document.createElement("th");
                header.id = headerText.toLowerCase();
                header.textContent = headerText;
                header.style.textAlign = (headerText === "Amount" || headerText === "✓") ? "center" : "left";
                tableHeader.appendChild(header);
            });
            
            // add the table body
            const tableBody = document.createElement("tbody");
            
            // add the ingredients to the table
            if (ingredientName.length > 0) {
                shoppingListTable.appendChild(tableHeader);
                shoppingListTable.appendChild(tableBody);
                ingredientName.forEach((ing, index) => {
                    const tableRowItem = document.createElement("tr");
                    tableRowItem.innerHTML = `
                        <td style="text-align:center;"><input type="checkbox" class="shopping-list-checkbox"></td>
                        <td style="text-align:left;">${ing}</td>
                        <td style="text-align:center;">${ingredientAmountUnit[index]}</td>
                        <td style="text-align:left;">${ingredientAisle[index]}</td>
                    `;
                    tableRowItem.style.borderBottom = "1px solid #ccc";
                    const cells = tableRowItem.querySelectorAll("td");
                    cells.forEach(cell => {
                        cell.style.height = "50px";
                    });
                    tableBody.appendChild(tableRowItem);
                });
                errorText.style.display = "none";
                clearButton.style.display = "inline-block";
                deleteButton.style.display = "inline-block";
            } else {
                errorText.innerHTML = "<p>Your shopping list is empty.</p>";
                errorText.style.display = "block";
            }
            

        } catch (error) {
            errorText.textContent = error.message || "Error loading shopping list.";
            errorText.style.display = "block";
        }
    };

    const clearShoppingList = async () => {
        const shoppingListError = document.getElementById("shopping-list-error");

        const userConfirmed = confirm("Are you sure you want to clear your shopping list?");
        if (!userConfirmed) {
            return;
        }

        try {
            const response = await fetch("/shopping-list/clear", {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
            });

            if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            shoppingListError.textContent = error.message || "Error clearing shopping list.";
            shoppingListError.style.display = "block";
        } finally {
            shoppingListError.textContent = "";
            shoppingListError.style.display = "none";
            deleteButton.style.display = "none";
            clearButton.style.display = "none";
            await loadShoppingList();
        }
    }
    clearButton.addEventListener("click", clearShoppingList);

    const deleteIngredients = async () => {
        const shoppingListError = document.getElementById("shopping-list-error");
        shoppingListError.style.display = "none";
        const checkboxes = document.querySelectorAll(".shopping-list-checkbox");
        const checkedBoxes = Array.from(checkboxes).filter(checkbox => checkbox.checked);
        const checkedIngredients = checkedBoxes.map(checkbox => {
            const row = checkbox.parentElement.parentElement;
            const cells = row.querySelectorAll("td");
            console.log(cells[1].textContent);
            return cells[1].textContent; // Assuming the ingredient name is in the second cell
            
        });

        if (checkedIngredients.length === 0) {
            shoppingListError.textContent = "Please select ingredients to delete.";
            shoppingListError.style.display = "block";
            return;
        }

        try {
            const response = await fetch("/shopping-list/ingredients/delete", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ingredients: checkedIngredients })
            });

            if (!response.ok) {
                const responseError = await response.json();
                shoppingListError.style.display = "block";
                shoppingListError.textContent = responseError.error || "Error deleting ingredients.";
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await loadShoppingList();
            shoppingListError.textContent = "Ingredients deleted successfully!";
            shoppingListError.style.color = "green";
            shoppingListError.style.display = "block";

        } catch (error) {
            shoppingListError.textContent = error.message || "Error deleting ingredients.";
            shoppingListError.style.display = "block";
        } finally {
            setTimeout(() => {
                shoppingListError.textContent = "";
                shoppingListError.style.display = "none";
            }, 5000);
        }
    }
    deleteButton.addEventListener("click", deleteIngredients);

    await loadShoppingList();
}
);