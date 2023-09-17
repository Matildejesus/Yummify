import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import $ from "jquery";
import getPort from "get-port";

const app = express();
const apiKey = "a059be4aa3dc4bad9dc2e099677d0a00";
const apiUrl = "https://api.spoonacular.com/recipes";
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/faq", (req, res) => {
  res.render("faq.ejs");
});

app.post("/find-recipe", async (req, res) => {
  let selectedDiet = req.body.selectedDiet.toLowerCase();
  let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
  console.log(selectedDiet, selectedIntolerance);
  const numberOfRecipes = 3;
  let result;
  try {
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
    const recipes = result.data.recipes;
    res.render("find-recipe.ejs", { content: recipes });
    // res.json(result.data);
  } catch (error) {
    res.render("find-recipe.ejs", { content: error.response.data });

    setTimeout(function () {
      window.location.reload();
    }, 1000);
  }
});

app.post("/recipe", async (req, res) => {
  let selectedDiet = req.body.selectedDiet.toLowerCase();
  let selectedIntolerance = req.body.selectedIntolerance.toLowerCase();
  console.log(selectedDiet, selectedIntolerance);
  const numberOfRecipes = 7;
  let result;
  try {
    if (
      (selectedDiet == "omnivore" || selectedDiet == "select a diet") &&
      selectedIntolerance == "select an intolerance"
    ) {
      console.log("success");
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=main course`
      );
    } else if (selectedDiet == "omnivore" || selectedDiet == "select a diet") {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=main course,${selectedIntolerance}`
      );
    } else if (selectedIntolerance == "select an intolerance") {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=main course,${selectedDiet}`
      );
    } else {
      result = await axios.get(
        `${apiUrl}/random?apiKey=${apiKey}&number=${numberOfRecipes}&tags=main course,${selectedDiet},${selectedIntolerance}`
      );
    }
    const recipes = result.data.recipes;
    console.log(recipes);
    const filteredRecipes = [];
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
    console.log("Recipe: " + filteredRecipes[0].data);
    console.log("Succceeeessss!!!!");
    res.render("recipe.ejs", { content: filteredRecipes });
    // res.json(result.data);
  } catch (error) {
    res.render("recipe.ejs", { content: error.response.data });
    setTimeout(function () {
      console.log("Try again");
      res.render("recipe.ejs", { content: filteredRecipes });
    }, 1000);
  }
});

async function startServer() {
  const port = await getPort({ port: 3000 });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
startServer();
