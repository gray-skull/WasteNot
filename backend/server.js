const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios")
const cors = require("cors")
const { MongoClient, ServerApiVersion } = require("mongodb")

require("dotenv").config()

const apiKey = process.env.SPOONACULAR_API_KEY
const mongoURI = process.env.MONGO_URI
const port = process.env.PORT || 8080

const app = express()

// Middleware
app.use(bodyParser.json())
app.use(cors()) // Enable CORS for development

// Initialize MongoDB Client
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
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

// Routes
app.get("/", (req, res) => {
  res.send("Hello from the WasteNot API!")
})

app.post("/recipes", async (req, res) => {
  const { ingredients } = req.body

  if (!ingredients) {
    return res.status(400).json({ error: "Ingredients parameter is required." })
  }

  const urlWithIngredients = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${ingredients}&number=3`

  try {
    // Fetch recipes from Spoonacular API
    const response = await axios.get(urlWithIngredients)

    // Transform data and prepare for MongoDB
    const recipes = response.data.map(recipe => ({
      title: recipe.title,
      ingredients: recipe.missedIngredients.map(ing => ing.name),
      instructions: "Instructions not provided by Spoonacular API", // Placeholder
      filters: [], // Add filters if needed
      createdAt: new Date()
    }))

    // Insert into MongoDB
    await recipesCollection.insertMany(recipes)
    res.status(200).json(recipes)
  } catch (error) {
    console.error("Error fetching recipes:", error)
    res
      .status(500)
      .json({ error: "Error fetching recipes from Spoonacular API" })
  }
})

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
