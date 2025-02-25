require("dotenv").config() // Added for environment variables

const express = require("express") // Added for API integration
const bodyParser = require("body-parser") // Added for API integration
const axios = require("axios") // Added for API integration
const cors = require("cors") // Enable CORS for security purposes
const { MongoClient, ServerApiVersion, ObjectId, Timestamp } = require("mongodb") // Added for database integration
const nodemailer = require("nodemailer") // Added for password reset
const { google } = require("googleapis") // Added for password reset

const authRoutes = require("./authRoutes") //Added for profile integration
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Sets up the OAuth2 client from Google for nodemailer transport configuration 
const OAuth2 = google.auth.OAuth2

// OAuth2 client for nodemailer transport configuration to send emails from the server using Gmail
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

// set the refresh token for the OAuth2 client from the environment variable
// this token is used to get the access token for nodemailer transport
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// function to get the access token for nodemailer transport from OAuth2 client
// this function is called in the nodemailer transport configuration
async function getAccessToken() {
  try {
    const { token } = await oauth2Client.getAccessToken()
    return token;
  } catch (error) {
    console.error("Error getting access token:", error)
    throw new Error("Error getting access token");
  }
}

// nodemailer transport configuration using OAuth2 client and access token
// this transport is used to send emails from the server
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    accessToken: getAccessToken()
  }
});

const apiKey = process.env.SPOONACULAR_API_KEY // Added for API integration
const mongoURI = process.env.MONGO_URI // Added for database integration
const port = process.env.PORT || 8080 // Added for API integration
const jwtSecret = process.env.JWT_SECRET // Added for profile integration

const app = express() // Added for API integration
const path = require("path") // Added for serving static files

// Added for profile integration
const authMiddleware = require("../middleware/authMiddleware") // handles JWT verification
const User = require("../models/User") // User model for mongoose schema validation

// Middleware
app.use(bodyParser.json()) // Added for API integration
app.use(cors()) // Enable CORS for development
app.use("/auth", authRoutes) //Added for profile integration


// Initialize MongoDB Client
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1, 
    strict: true,
    deprecationErrors: true
  },
  connectTimeoutMS: 5000, // Increase timeout to 5 seconds
  socketTimeoutMS: 45000 // Timeout for socket operations
})

// Connect to MongoDB and confirm connection
async function connectToDatabase() {
  try {
    await client.connect()
    console.log("Successfully connected to MongoDB!")
  } catch (err) {
    console.error("Error connecting to MongoDB:", err)
    process.exit(1) // Exit the application if the connection fails
  }
}

// Call the connection function
connectToDatabase()

// Reference to the database
const database = client.db("wastenot")
const recipesCollection = database.collection("recipes") // Collection for recipes
const usersCollection = database.collection("users") // Collection for users

// Serve static files like images, styles, and scripts
app.use(express.static(path.join(__dirname, "../")))

// Serve HTML pages from the "pages" folder
app.get("/", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/home.html"))
)
app.get("/home", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/home.html"))
)
app.get("/about", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/about.html"))
)
app.get("/list", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/list.html"))
)
app.get("/signup", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/signup.html"))
)
app.get("/login", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/login.html"))
)
app.get("/profile", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/profile.html"))
)
app.get("/forgot-password", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/forgot-password.html"))
)
app.get("/reset-password/:token", (_req, res) =>
  res.sendFile(path.join(__dirname, "../pages/reset-password.html"))
)

// register route
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required." });
  }

  try {
    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object
    const newUser = { username, email, password: hashedPassword };

    // Insert the new user into the database
    await usersCollection.insertOne(newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    // Find user in the database
    const user = await usersCollection.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Compare the hashed password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, jwtSecret, {
      expiresIn: "7h",

    })

    res.json(
      {
        token: token, 
        user: { 
          _id: user._id, 
          username: user.username, 
          email: user.email,
          diets: user.diets,
          intolerances: user.intolerances,
          lastUpdate: user.lastUpdate 
        }
      }
    )
  } catch (error) {
    console.error("Login Error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// JWT verification route
app.post("/verify-token", authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated", valid: false })
  } else {
    return res.status(200).json({ message: "User is authenticated", valid: true })
  }
})

// Forgot password route
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: "Email is required." })
  }

  // Check if the user exists in the database
  const user = await usersCollection.findOne({ email })
  if (!user) {
    return res.status(404).json({ error: "No account associated with that email." })
  }

  // create token valid for 1 hour
  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "1h" })
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await usersCollection.updateOne(
    { email }, 
    { $set: { 
      resetPasswordToken: token, 
      resetPasswordExpires: user.resetPasswordExpires
      } 
    }
  )

  // construct reset URL
  const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`

  // email message
  const mailOptions = {
    to: email,
    from: process.env.EMAIL_USER,
    subject: "WasteNot Password Reset",
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
    `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
    resetUrl + `\n\n` +
    `If you did not request this, please ignore this email and your password will remain unchanged.\n\n` +
    `This link is valid for 1 hour.\n\n` +
    `Thank you,\n` +
    `WasteNot Team`
  }

  // send email
  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error("Error sending email:", err)
      return res.status(500).json({
        error: "Error sending email. Please try again later.",
        success: false
      })
    }
    res.status(200).json({
      message: "Email sent. Please check your email for a link to reset your email.",
      success: true
    })
  })
})

// Reset password route
app.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params
  const { newPassword } = req.body

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required." })
  }

  try {
    // Find user by token
    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })
    if (!user) {
      return res.status(400).json({ error: "Password reset token is invalid or has expired." })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await usersCollection.updateOne( 
      { 
        email: user.email 
      }, 
      { 
        $set: { 
          password: hashedPassword, 
          resetPasswordToken: undefined, 
          resetPasswordExpires: undefined,
          lastUpdate: new Date() 
        }
      }
    )

    res.status(200).json({ message: "Password reset successful" })
  } catch (error) {
    console.error("Error resetting password:", error)
    res.status(500).json({ error: "Error resetting password" })
  }
})

// User profile route
app.get("/userProfile", authMiddleware, async (req, res) => {
  try {
    const authenticatedUserData = req.user

    const user = await usersCollection.findOne(ObjectId.createFromHexString(authenticatedUserData.userId))

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    //Fetch saved recipes
    // If the user has savedRecipes, fetch the full recipe details from the recipes collection
    if (user.savedRecipes && user.savedRecipes.length > 0) {
      const savedRecipes = await recipesCollection
        .find({ _id: { $in: user.savedRecipes } })
        .toArray();
      // Replace the savedRecipes field with the full recipe objects
      user.savedRecipes = savedRecipes;
    } else {
      user.savedRecipes = [];
    }

    if (user.savedDiets && user.savedDiets.length > 0) {
      const savedDiets = await usersCollection
        .find({ _id: { $in: user.savedDiets } })
        .toArray();
      user.savedDiets = savedDiets;
    } else {
      user.savedDiets = [];
    }

    if (user.savedIntolerances && user.savedIntolerances.length > 0) {
      const savedIntolerances = await usersCollection
        .find({ _id: { $in: user.savedIntolerances } })
        .toArray();
      user.savedIntolerances = savedIntolerances;
    } else {
      user.savedIntolerances = [];
    }

    res.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ error: "Error fetching user profile" })
  }
})

// Delete user profile route
app.delete("/deleteProfile", authMiddleware, async (req, res) => {
  const authenticatedUserData = req.user
  const userId = authenticatedUserData.userId

  try {
    await usersCollection.deleteOne({ _id: ObjectId.createFromHexString(userId) })
    res.status(200).json({ message: "Profile deleted successfully" })
  } catch (error) {
    console.error("Error deleting profile:", error)
    res.status(500).json({ error: "Error deleting profile" })
  }
})

app.post("/updateProfile", authMiddleware, async (req, res) => {
  const authenticatedUserData = req.user
  const userId = authenticatedUserData.userId

  const { newUsername, newEmail } = req.body

  if (newUsername === '' && newEmail === '') {
    return res.status(400).json({ error: "At least one of username or email is required." })
  }

  const updateFields = {}
  if (newUsername) updateFields.username = newUsername
  if (newEmail) updateFields.email = newEmail
  updateFields.lastUpdate = new Date()

  try {
    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: updateFields }
    )
    // return updated user from the database
    const updatedUser = await usersCollection.findOne(ObjectId.createFromHexString(userId))
    res.status(200).json({_id: updatedUser._id, username: updatedUser.username, email: updatedUser.email, lastUpdate: updatedUser.lastUpdate})
  } catch (error) {
    console.error('Error updating profile: #%s' , error)
    res.status(500).json({ error: "Error updating profile" })
  }
})

app.post("/updatePassword", authMiddleware, async (req, res) => {
  const { userId } = req.user
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required." })
  }

  try {
    const user = await usersCollection.findOne(ObjectId.createFromHexString(userId))
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid current password" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { password: hashedPassword, lastUpdate: new Date() } }
    )

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error updating password:", error)
    res.status(500).json({ error: "Error updating password" })
  }
})

app.post("/updatePreferences", authMiddleware, async (req, res) => {
  const { userId } = req.user
  const { diets, intolerances } = req.body

  try {
    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { diets, intolerances, lastUpdate: new Date() } },
      { upsert: true }
    )
    res.status(200).json({ message: "Preferences updated successfully" })
  } catch (error) {
    console.error("Error updating preferences:", error)
    res.status(500).json({ error: "Error updating preferences" })
  }
})

// Fetch recipes from Spoonacular API
app.post("/recipes", async (req, res) => {
  // Get ingredients from the request body
  const { ingredients } = req.body
  const { diets } = req.body
  const { intolerances } = req.body
  const { resultLimit } = req.body

  // Check if ingredients are provided
  if (!ingredients) {
    return res.status(400).json({
      status: "error",
      message: "no ingredients given"
    })
  }

  // Construct the URL with the ingredients
  let urlWithIngredients = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&includeIngredients=${ingredients}&sort=max-used-ingredients&number=${resultLimit}`

  // add diet and intolerances to the URL if provided
  if (diets !== "") {
    urlWithIngredients += `&diet=${diets}`
  }
  if (intolerances !== "") {
    urlWithIngredients += `&intolerances=${intolerances}`
  }

  try {
    // Fetch recipes from Spoonacular API
    const response = await axios.get(urlWithIngredients)

    if (response.data.results.length === 0) {
      console.log("Backend: No recipes found")
      return res.status(200).json("No recipes found")
    }
    
    /*
    // Transform data and prepare for MongoDB
    const recipes = response.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      spoonacularScore: recipe.spoonacularScore,
      image: recipe.image,
      extendedIngredients: recipe.extendedIngredients,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      diets: recipe.diets,
      summary: recipe.summary,
      analyzedInstructions: recipe.analyzedInstructions,
      sourceUrl: recipe.sourceUrl,
      sourceName: recipe.sourceName,
      createdAt: new Date()
    }))
      */
    const responseData = response.data
    const responseHeaders = {
      'x-api-quota-request': response.headers['x-api-quota-request'],
      'x-api-quota-used': response.headers['x-api-quota-used'],
      'x-api-quota-left': response.headers['x-api-quota-left']
    }
    res.status(200).json({ data: responseData, headers: responseHeaders })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    res
      .status(error.status || 500)
      .json({ error: "Error fetching recipes from Spoonacular API" })
  }
})

app.get("/recipe/:id", async (req, res) => {
  const { id } = req.params

  if (!id) {
    return res.status(400).json({ error: "Recipe ID parameter is required." })
  }

  try {
    // Check if the recipe is already in the database
    let recipe = await recipesCollection.findOne({ id: parseInt(id) })
    if(recipe) {
      console.log("Recipe fetched from MongoDB")
    }

    if (!recipe) {
      // If not, fetch from Spoonacular API
      const urlWithId = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`
      const response = await axios.get(urlWithId)
      recipe = response.data

      // Transform data and prepare for MongoDB
      const recipeData = {
        id: recipe.id,
        title: recipe.title,
        spoonacularScore: recipe.spoonacularScore,
        image: recipe.image,
        extendedIngredients: recipe.extendedIngredients,
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes,
        diets: recipe.diets,
        summary: recipe.summary,
        analyzedInstructions: recipe.analyzedInstructions,
        sourceUrl: recipe.sourceUrl,
        sourceName: recipe.sourceName,
        createdAt: new Date()
      }

      // Insert the recipe into the database
      await recipesCollection.updateOne(
        { id: recipe.id },
        { $set: recipeData },
        { upsert: true }
      )

      // Return the newly fetched recipe
      recipe = recipeData
      console.log("Recipe fetched from Spoonacular API")
    }
    
    res.status(200).json(recipe)
  } catch (error) {
    console.error("Error fetching recipe details:", error)
    res
      .status(500)
      .json({ error: "Error fetching recipe details from Spoonacular API" })
  }
})

// Fetch saved recipes from MongoDB
app.get("/saved-recipes", async (req, res) => {
  try {
    const recipes = await recipesCollection.find().toArray()
    res.status(200).json(recipes)
  } catch (error) {
    console.error("Error fetching saved recipes:", error)
    res.status(500).json({ error: "Error fetching saved recipes" })
  }
})


//Save recipe feature
app.post("/save-recipe", authMiddleware, async (req, res) => {
  const { recipeExternalId } = req.body; //The external ID from Spoonacular
  if (!recipeExternalId) {
    return res.status(400).json({ error: "Recipe external ID is required." });
  }

  try {
    // Look up the recipe document by its external ID
    const recipeDoc = await recipesCollection.findOne({ id: recipeExternalId });
    if (!recipeDoc) {
      return res.status(400).json({ error: "Recipe not found." });
    }

    // Get the mongo _id for the recipe doc
    const recipeObjectId = recipeDoc._id;

    // Get the authenticated user's id from the token (authMiddleware)
    const userId = req.user.userId;

    // Check if the user already has the recipe saved
    const user = await usersCollection.findOne({ _id: ObjectId.createFromHexString(userId) });
    const savedRecipe = user.savedRecipes.find(recipeId => recipeId.equals(recipeObjectId));

    if (savedRecipe) {
      // Check if it's been longer than 24 hours since the recipe was saved
      const lastUpdate = user.lastUpdate || new Date(0);
      const timeDifference = new Date() - new Date(lastUpdate);
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference > 24) {
        // Update the saved recipe
        await usersCollection.updateOne(
          { _id: ObjectId.createFromHexString(userId), "savedRecipes": recipeObjectId },
          { $set: { "savedRecipes.$": recipeObjectId, lastUpdate: new Date() } }
        );
        return res.status(200).json({ message: "Saved recipe updated." });
      } else {
        return res.status(200).json({ message: "Recipe already saved." });
      }
    } else {
      // Save the recipe to the user's savedRecipes
      const updatedUser = await usersCollection.findOneAndUpdate(
        { _id: ObjectId.createFromHexString(userId) },
        { $addToSet: { savedRecipes: recipeObjectId }, $set: { lastUpdate: new Date() } },
        { returnDocument: 'after' } // return updated doc
      );

      res.status(200).json({
        message: "Recipe saved successfully.",
        user: updatedUser.value
      });
    }
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).json({ error: "Error saving recipe" });
  }
});

// endpoint for saving recipe ingredients to the users shopping list
app.post("/shopping-list/ingredients/add", authMiddleware, async (req, res) => {
  const { ingredients } = req.body
  if (!ingredients) {
    console.log("Ingredients are required.")
    return res.status(400).json({ error: "Ingredients are required." })
  }

  try {
    const { userId } = req.user
    const user = await usersCollection.findOne(ObjectId.createFromHexString(userId))

    if (!user) {
      console.log("User not found")
      return res.status(404).json({ error: "User not found" })
    }

    const updatedShoppingList = user.shoppingList || [];

    ingredients.forEach(ingredient => {
      const existingIngredient = updatedShoppingList.find(item => item.name === ingredient.name && item.unit === ingredient.unit);
      if (existingIngredient) {
      existingIngredient.amount += ingredient.amount;
      } else {
      updatedShoppingList.push(ingredient);
      }
    });

    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { shoppingList: updatedShoppingList } },
      { upsert: true }
    );

    res.status(200).json({ message: "Ingredients saved to shopping list" })
  } catch (error) {
    console.error("Error saving ingredients to shopping list:", error)
    res.status(500).json({ error: "Error saving ingredients to shopping list" })
  }
})

// endpoint for deleting ingredients from the user's shopping list
app.delete("/shopping-list/ingredients/delete", authMiddleware, async (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: "Ingredients array is required." });
  }

  const { userId } = req.user;
  try {
    const user = await usersCollection.findOne(ObjectId.createFromHexString(userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $pull: { shoppingList: { name: { $in: ingredients } } } }
    );

    res.status(200).json({ message: "Ingredients deleted from shopping list" });
  } catch (error) {
    console.error("Error deleting ingredients from shopping list:", error);
    res.status(500).json({ error: "Error deleting ingredients from shopping list" });
  }
});

// endpoint for fetching the user's shopping list
app.get("/shopping-list/get", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const user = await usersCollection.findOne(ObjectId.createFromHexString(userId))
    if (!user) {
      return res.status(200).json({ error: "User not found" })
    }
    if (!user.shoppingList || user.shoppingList.length === 0) {
      return res.status(200).json({ message: "Shopping list is empty" })
    }

    // Sort the shopping list by aisle
    user.shoppingList.sort((a, b) => (a.aisle || "").localeCompare(b.aisle || ""))

    res.status(200).json(user.shoppingList)
  } catch (error) {
    console.error("Error fetching shopping list:", error)
    res.status(500).json({ error: "Error fetching shopping list" })
  }
});

// endpoint for clearing the user's shopping list
app.delete("/shopping-list/clear", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user
    const user = await usersCollection.findOne(ObjectId.createFromHexString(userId))
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }
    if (user.shoppingList.length === 0) {
      return res.status(200).json({ message: "Shopping list is already empty" })
    }

    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: { shoppingList: [] } }
    )

    res.status(200).json({ message: "Shopping list cleared" })
  } catch (error) {
    console.error("Error clearing shopping list:", error)
    res.status(500).json({ error: "Error clearing shopping list" })
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})