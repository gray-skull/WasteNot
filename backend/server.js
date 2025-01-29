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
const path = require("path")

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
// Serve static files from the WasteNot root directory
app.get("/", (req, res) => {
  app.use(express.static(path.join(__dirname, ".."))) // to ensure index.html is served
  res.sendFile(path.join(__dirname, "..", "index.html"))
})
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
  if (diet !== "All Diets") {
    urlWithIngredients += `&diet=${diet}`
  }
  if (intolerances !== "None") {
    urlWithIngredients += `&intolerances=${intolerances}`
  }

  try {
    // Fetch recipes from Spoonacular API
    const response = await axios.get(urlWithIngredients)

    if (response.data.results.length === 0) {
      console.log("No recipes found")
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
