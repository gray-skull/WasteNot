# WasteNot: Cook Smarter, Waste Less!

WasteNot is a mobile-friendly web application that helps users reduce food waste by providing recipe suggestions based on the ingredients they already have at home. This project is being developed as part of an Agile process with iterative sprints to achieve its goals.

**Contact**:
- For questions or feedback, please open an issue or contact the development team via the GitHub repository.

---

## Setup Instructions

To get started with WasteNot locally, follow these steps:

1. **Clone the Repository**:
```bash
git clone https://github.com/gray-skull/WasteNot.git
cd WasteNot
```
2. **Install Dependencies**:
```bash
npm install
```
3. **Run the App Locally**:
```bash
npm start
```
4. **Environment Variables**:
Create a ```.env``` file in the root directory to store API keys and other sensitive data. Add the following variables:
```bash
SPOONACULAR_API_KEY = your_api_key_goes_here
PORT = enter_your_desired_port_here
MONGO_URI= your_mongo_uri_goes_here
```

## Frontend Design

WasteNot is designed with a mobile-first approach, ensuring accessibility and usability across devices. 

**The primary goals for the frontend design include:**

1. Simple and Intuitive User Interface:
- Minimalist design to focus on usability.
- Easy navigation for ingredient input, filtering, and recipe search.

2. Responsive Design:
- Optimized for various screen sizes using CSS3 and media queries.
- Tested for compatibility with common mobile and desktop browsers.

3. Core Components:
- Ingredient Input Field: Allows users to enter ingredients manually.
- Filter Options: Enables users to refine searches based on dietary or religious restrictions.
- Recipe Display: Presents recipe results in a clean, scrollable layout with images, preparation steps, and nutritional information.

4. Frameworks:
- HTML5 and CSS3: Structure and styling.

## Sprint 1 Decisions

**Objectives**
Sprint 1 focused on laying the groundwork for the WasteNot application, including repository setup, API integration, and a basic "Search by Ingredients" function.

**Key Achievements:**
1. Repository Setup:

- Created a GitHub repository to manage version control and collaboration.
Defined branching and merging strategies for smooth development.

2. Development Environment:

- Chose Node.js and Express.js for the backend to handle API requests.
Set up Visual Studio Code as the primary IDE with extensions for linting, formatting, and debugging.

3. Third-Party API Integration:

- Successfully integrated the Spoonacular API to fetch recipe data based on user-provided ingredients.
Configured backend routes to query the API and return results.

4. Frontend Progress:

- Developed a basic "Search by Ingredients" form.
Implemented functionality to display static results, including recipe names and pictures, after querying the API.

5. Challenges:

- Currently, the app only displays static results from the API (recipe names and images). Future sprints will focus on enhancing the results display to include additional details such as ingredients, preparation instructions, and nutritional information.

6. Design Choices:

- Adopted a clean and simple design for initial development, prioritizing usability and functionality.
Ensured basic accessibility standards were met.

**Future Goals**
- Enhance the recipe display to include full details such as preparation instructions and nutritional information.
- Develop user accounts for saving preferences and recipes.
- Expand filtering options for dietary and religious preferences.
