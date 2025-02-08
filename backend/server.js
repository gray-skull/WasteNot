const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios")
const cors = require("cors")
const { MongoClient, ServerApiVersion } = require("mongodb")

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

// // Protect /profile route with authMiddleware
// app.get("/profile", authMiddleware, (req, res) => {
//   res.sendFile(path.join(__dirname, "../pages/profile.html"))
// })

// Middleware
app.use(bodyParser.json())
app.use(cors()) // Enable CORS for development

// Added for profile integration
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate("savedRecipes")
    res.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ error: "Error fetching user profile" })
  }
  // const user = await User.findById(req.user.userId).populate("savedRecipes")
  // res.json(user)
})

app.use("/auth", authRoutes) //Added for profile integration

// Initialize MongoDB Client
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  },
  connectTimeoutMS: 10000, // Increase timeout to 10 seconds
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

// Routes
// // Serve static files from the WasteNot root directory
// app.get("/", (req, res) => {
//   app.use(express.static(path.join(__dirname, ".."))) // to ensure index.html is served
//   res.sendFile(path.join(__dirname, "..", "index.html"))
// })
// Fetch recipes from Spoonacular API
app.post("/recipes", async (req, res) => {
  // Get ingredients from the request body
  const { ingredients } = req.body
  const { diet } = req.body
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
  if (diet !== "") {
    urlWithIngredients += `&diet=${diet}`
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
      expiresIn: "1h"
    })

    res.json({ token })
  } catch (error) {
    console.error("Login Error:", error)
    res.status(500).json({ error: "Server error" })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
