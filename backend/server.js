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

// Fetch recipes from Spoonacular API
app.post("/recipes", async (req, res) => {
  // Get ingredients from the request body
  const { ingredients } = req.body

  // Check if ingredients are provided
  if (!ingredients) {
    return res.status(400).json({ error: "Ingredients parameter is required." })
  }

  // Construct the URL with the ingredients
  const urlWithIngredients = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${apiKey}&ingredients=${ingredients}&number=3`
  

  try {
    // Fetch recipes from Spoonacular API
    const response = await axios.get(urlWithIngredients)

    // Transform data and prepare for MongoDB
    const recipes = response.data.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
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
});

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
