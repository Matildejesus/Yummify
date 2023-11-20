import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import "dotenv/config";
import mongoose, { mongo } from "mongoose";

const app = express();
const apiKey = process.env.API_KEY;
const apiUrl = "https://api.spoonacular.com/recipes";
const database = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

mongoose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("database connection successful!");
  });

const recipeSchema = new mongoose.Schema({
  diet: String,
  intolerance: String,
  recipe: Array,
  date: Date,
});

const Recipe = mongoose.model("Recipe", recipeSchema);

app.get("/", (req, res) => {
  res.render("index.ejs", { isFindRecipeRoute: false });
});

app.get("/faq", (req, res) => {
  res.render("faq.ejs");
});

async function getRecipe(inputs) {
  const { selectedDiet, selectedIntolerance, numberOfRecipes, ingredients } =
    inputs;
  let query = `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}`;
  let tags = [];

  if (selectedDiet !== "omnivore" && selectedDiet !== "select a diet") {
    tags.push(selectedDiet);
  }

  if (selectedIntolerance !== "select an intolerance") {
    tags.push(selectedIntolerance);
  }

  if (ingredients) {
    tags.push(ingredients);
  }
  if (tags) {
    query += `&tags=${tags.join(",")}`;
  }
  try {
    const result = await axios.get(query);
    return result.data.recipes;
  } catch (error) {
    throw error;
  }
}

app.post("/recipe", async (req, res) => {
  try {
    let selectedDiet = req.body.selectedDiet.toLowerCase();
    let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    // Check if recipe for today already exists in the database
    let existingRecipe = await Recipe.findOne({
      diet: selectedDiet,
      intolerance: selectedIntolerance,
      date: today,
    });

    if (existingRecipe) {
      res.render("recipe.ejs", {
        content: existingRecipe.recipe,
      });
    } else {
      const filteredRecipes = [];
      const numberOfRecipes = 7;
      let recipes = await getRecipe({
        selectedDiet,
        selectedIntolerance,
        numberOfRecipes,
      });

      console.log(recipes.length);
      // Save the new recipe in the database
      let count = 0;
      recipes.forEach((recipeItem) => {
        if (recipeItem.extendedIngredients.length <= 8) {
          filteredRecipes.push(recipeItem);
          count++;
          if (count == 7 && filteredRecipes.length == 0) {
            filteredRecipes.push(recipeItem);
          }
        }
      });
      recipes = filteredRecipes;
      console.log(recipes);

      const newRecipe = new Recipe({
        diet: selectedDiet,
        intolerance: selectedIntolerance,
        recipe: recipes[0],
        date: today,
      });
      await newRecipe.save();

      // Render the fetched recipes
      res.render("recipe.ejs", {
        content: recipes,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.render("recipe.ejs", {
      content: error.response ? error.response.data : {},
    });
  }
});

app.post("/find-recipe", async (req, res) => {
  let selectedDiet = req.body.selectedDiet.toLowerCase();
  let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
  res.render("find-recipe.ejs", {
    selectedDiet: selectedDiet,
    selectedIntolerance: selectedIntolerance,
    isFindRecipeRoute: true,
  });
});

app.post("/find-recipe-filtered", async (req, res) => {
  let ingredients = req.body.ingredients;
  let numberOfRecipes = req.body.count;
  let selectedDiet = req.body.selectedDiet;
  let selectedIntolerance = req.body.selectedIntolerance;
  console.log(ingredients, numberOfRecipes, selectedDiet, selectedIntolerance);
  try {
    const result = await getRecipe({
      selectedDiet,
      selectedIntolerance,
      numberOfRecipes,
      ingredients,
    });

    const recipes = result;
    console.log(recipes);
    res.render("find-recipe.ejs", {
      content: recipes,
      isFindRecipeRoute: false,
      selectedDiet: selectedDiet,
      selectedIntolerance: selectedIntolerance,
    });
  } catch (error) {
    res.redirect("index.ejs");
  }
});

app.post("/recipe-selected", async (req, res) => {
  try {
    const recipe = JSON.parse(req.body.recipe);
    console.log("Recipe selected:", recipe);
    res.render("recipe.ejs", {
      content: [recipe],
    });
  } catch (error) {
    console.error("Error parsing recipe data:", error);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
