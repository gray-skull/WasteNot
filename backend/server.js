const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")

const authRoutes = require("./authRoutes") //Added for profile integration
const jwt = require("jsonwebtoken")

require("dotenv").config()
const bcrypt = require("bcryptjs")

const apiKey = process.env.SPOONACULAR_API_KEY
const mongoURI = process.env.MONGO_URI
const port = process.env.PORT || 8080

const app = express()
const path = require("path")

// Added for profile integration
const authMiddleware = require("../middleware/authMiddleware")
const User = require("../models/User")

// Middleware
app.use(bodyParser.json())
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
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/home.html"))
)
app.get("/home", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/home.html"))
)
app.get("/about", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/about.html"))
)
app.get("/settings", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/settings.html"))
)
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/signup.html"))
)
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/login.html"))
)
app.get("/profile", (req, res) =>
  res.sendFile(path.join(__dirname, "../pages/profile.html"))
)

//register route
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
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",

    })

    res.json(
      {
        token: token, 
        user: { 
          _id: user._id, 
          username: user.username, 
          email: user.email,
          diets: user.diets,
          intolerances: user.intolerances 
        }
      }
    )
  } catch (error) {
    console.error("Login Error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Added for profile integration
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

  try {
    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(userId) },
      { $set: updateFields }
    )
    // return updated user from the database
    const updatedUser = await usersCollection.findOne(ObjectId.createFromHexString(userId))
    res.status(200).json({_id: updatedUser._id, username: updatedUser.username, email: updatedUser.email })
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
      { $set: { password: hashedPassword } }
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
      { $set: { diets, intolerances } }
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

    // Transform data and prepare for MongoDB
    const recipes = response.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      ingredients: recipe.missedIngredients
        ? recipe.missedIngredients.map(ing => ing.name)
        : "Ingredients not provided by Spoonacular API", // Placeholder
      instructions: "Instructions not provided by Spoonacular API", // Placeholder
      filters: [], // Add filters if needed
      createdAt: new Date()
    }))

    // Update MongoDB with the recipes and update existing recipes using recipe.id as the unique identifier
    // Upsert is set to true to insert new recipes and update existing ones, preventing duplicates in the database
    const bulkWriteRecipes = recipes.map(recipe => ({
      updateOne: {
        filter: { id: recipe.id },
        update: { $set: recipe },
        upsert: true
      }
    }))

    await recipesCollection.bulkWrite(bulkWriteRecipes)

    res.status(200).json(recipes)
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

  const urlWithId = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}`

  try {
    const response = await axios.get(urlWithId)
    const recipe = response.data

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

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})

//Save recipe feature
app.post("/save-recipe", authMiddleware, async (req, res) => {
  const { recipeExternalId } = req.body; //The external ID from Spoonacular
  if (!recipeExternalId) {
    return res.status(400).json({ error: "Recipe external ID is required." });
  }

  try {
    //Look up the recipe document by its external ID
    const recipeDoc = await recipesCollection.findOne({ id: recipeExternalId });
    if (!recipeDoc){
      return res.status(400).json({ error: "Recipe not found." });
    }

    //Get the mongo _id for the recipe doc
    const recipeObjectId = recipeDoc._id;

    //Get the authenticated user's id from the token (authMiddleware)
    const userId = req.user.userId;

    //Update user's savedRecipes (used $addToSet to avoid duplicates)
    const updatedUser = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $addToSet: { savedRecipes: recipeObjectId } },
      { returnOriginal: false } //return updated doc
    );

    res.status(200).json({
      message: "Recipe saved successfully.",
      user: updatedUser.value
    });
  } catch (error) {
    console.error("Error saving recipe:", error);
    res.status(500).json({ error: "Error saving recipe" });
  }
});