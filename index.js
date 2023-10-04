import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import "dotenv/config";
//import cookieParser from "cookie-parser";

const app = express();
const apiKey = process.env.API_KEY;
const apiUrl = "https://api.spoonacular.com/recipes";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

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
  //console.log("Existing Cookie:", req.cookies.recipeOfTheDay);
  try {
    let recipes = []; // Declare the variable at the function scope.
    const filteredRecipes = [];
    // Check if there's data in the recipeOfTheDay cookie.
    // if (
    //   req.cookies.recipeOfTheDay &&
    //   req.cookies.recipeOfTheDay !== "undefined"
    // ) {
    //   recipes = JSON.parse(req.cookies.recipeOfTheDay);
    // } else {
    let selectedDiet = req.body.selectedDiet.toLowerCase();
    let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
    const numberOfRecipes = 7;

    const result = await getRecipe({
      selectedDiet,
      selectedIntolerance,
      numberOfRecipes,
    });

    recipes = result;
    console.log(recipes.length);
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

    // console.log("filteredRecipe 1: " + JSON.stringify(filteredRecipes[0]));
    // res.cookie("recipeOfTheDay", JSON.stringify(filteredRecipes));
    // console.log("Cookie after setting:", req.cookies.recipeOfTheDay);
    recipes = filteredRecipes;
    // }

    res.render("recipe.ejs", {
      content: recipes,
    });
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
  // console.log("body: ", req.body);
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
