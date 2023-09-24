import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import getPort from "get-port";
import "dotenv/config";
import cookie from "cookie-parser";

const app = express();
const apiKey = process.env.API_KEY;
const apiUrl = "https://api.spoonacular.com/recipes";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookie());

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/faq", (req, res) => {
  res.render("faq.ejs");
});

function getTime() {
  const timeOfDay = new Date();
  timeOfDay.setHours(23, 59, 59, 999);
  return timeOfDay;
}

function getMidnightTime() {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return midnight;
}
async function getRecipe(selectedDiet, selectedIntolerance, numberOfRecipes) {
  try {
    let result;
    if (
      (selectedDiet == "omnivore" || selectedDiet == "select a diet") &&
      selectedIntolerance == "select an intolerance"
    ) {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}`
      );
    } else if (selectedDiet == "omnivore" || selectedDiet == "select a diet") {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=${selectedIntolerance}`
      );
    } else if (selectedIntolerance == "select an intolerance") {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=${selectedDiet}`
      );
    } else {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=${selectedDiet},${selectedIntolerance}`
      );
    }
    return result.data;
  } catch (error) {
    throw error;
  }
}

app.post("/find-recipe", async (req, res) => {
  let selectedDiet = req.body.selectedDiet.toLowerCase();
  let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
  console.log(selectedDiet, selectedIntolerance);
  const numberOfRecipes = 3;
  try {
    const result = await getRecipe(
      selectedDiet,
      selectedIntolerance,
      numberOfRecipes
    );

    const recipes = result.recipes;
    res.render("find-recipe.ejs", { content: recipes });
    // res.json(result.data);
  } catch (error) {
    res.render("find-recipe.ejs", { content: error.response.data });
    res.redirect("index.ejs");
  }
});

app.post("/recipe", async (req, res) => {
  let selectedDiet = req.body.selectedDiet.toLowerCase();
  let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
  const timeOfDay = getTime();
  const endOfDay = getMidnightTime();
  const numberOfRecipes = 7;
  const filteredRecipes = [];

  console.log(selectedDiet, selectedIntolerance);
  console.log(endOfDay.getTime());

  try {
    const result = await getRecipe(
      selectedDiet,
      selectedIntolerance,
      numberOfRecipes
    );

    const recipes = result.recipes;
    let count = 0;
    recipes.forEach((recipe) => {
      if (recipe.extendedIngredients.length <= 8) {
        filteredRecipes.push(recipe);
        count++;
        if (count == 7 && filteredRecipes.length == 0) {
          filteredRecipes.push(recipe);
        }
      }
    });
    // console.log(filteredRecipes[0]);
    console.log(req.cookies.recipeOfTheDay);
    res.cookie("recipeOfTheDay", filteredRecipes[0]);
    console.log(req.cookies.recipeOfTheDay);

    res.render("recipe.ejs", {
      content: JSON.parse(req.cookies.recipeOfTheDay),
    });
    // res.json(result.data);
  } catch (error) {
    res.render("recipe.ejs", { content: error.response.data });
  }
});

async function startServer() {
  const port = await getPort({ port: 3000 });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
startServer();
