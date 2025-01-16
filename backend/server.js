const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

require('dotenv').config();
const apiKey = process.env.SPOONACULAR_API_KEY;

const app = express();
const port = process.env.PORT;


// setup middleware
app.use(bodyParser.json());
app.use(cors()); // enable CORS - needed during development

// TODO: setup mongoose connection
const mongoose = require('mongoose');
const dbUrl = process.env.MONGO_URL;

// TODO: connect to MongoDB

// setup connection to Spoonacular API
const baseUrl = 'https://api.spoonacular.com/recipes/findByIngredients';
const url = `${baseUrl}?apiKey=${apiKey}`;

// setup routes
// base route
app.get('/', (res) => {
  res.send('Hello from the WasteNot API!');
});

// route to handle recipe search
app.post('/recipes', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients parameter is required.' });
  }

  const urlWithIngredients = `${url}&ingredients=${ingredients}&number=3`; // limit to 3 recipes for now
  
  try {
    const response = await axios.get(urlWithIngredients);
    res.status(200).json(response.data);

  } catch (error) {
    console.error('(Server) Error fetching recipes from Spoonacular:', error);
    res.status(500).json({ error: 'Error fetching recipes from API' });
  }
});

// start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

