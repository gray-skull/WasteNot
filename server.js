import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

require('dotenv').config();
const API_KEY = process.env.SPOONACULAR_API_KEY;
const Recipe = require('./models/recipe');

const app = express();
const port = 5500;

// setup middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// TODO: setup mongoose connection

// TODO: connect to MongoDB

// setup connection to Spoonacular API
const apiKey = API_KEY;
const baseUrl = 'https://api.spoonacular.com/recipes/findByIngredients';
const url = `${baseUrl}?apiKey=${apiKey}`;

// setup routes
// base route
app.get('/', (req, res) => {
  res.send('Hello from the WasteNot API!');
});

// route to handle recipe search
app.post('/api/recipes', async (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients parameter is required.' });
  }
  const urlWithIngredients = `${url}?ingredients=${ingredients}&number=3`; // limit to 3 recipes for now
  try {
    const response = await axios.get(urlWithIngredients);

    res.json(response.data);
  } catch (error) {
    console.error('API: Error fetching recipes from Spoonacular:', error);
    res.status(500).json({ error: 'Error fetching recipes from API' });
  }
});

// start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

