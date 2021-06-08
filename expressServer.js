const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// enable ejs
app.set('view engine', 'ejs');

//Declare Database variable
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Generate Short URL value
function generateRandomString() {
  const string = Math.random().toString(36).slice(2);
  return string.slice(2, 8);
};

//Parse buffer into a string so it can be used
app.use(express.urlencoded({extended: false}));

//Redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  console.log(longURL, req.params.shortURL)
  res.redirect(302, longURL);
});

//Collect URLS on our home page and connect them to views
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase};
  res.render('urls_index', templateVars);
});

//Create a new form for submitting URLS to be shortened
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Generate individul pages for shortURLS connecting to urls_show.ejs
app.get("/urls/:shortURL", (req, res) => {
  //console.log(req.params.shortURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  //console.log(templateVars);
  res.render("urls_show", templateVars);
});

//Path for edit buttons
app.get("/urls/:shortURL/goto", (req, res) => {
  shortURL = req.params.shortURL;
  res.redirect(302, `/urls/${shortURL}`);         
});

// Edits long URL
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.newLongURL;
  res.redirect(302, '/urls')
});

//Post new URLS to our database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);         
});



//Delete a tinyURL *This part works, but the button is broken !! Fixed the button, but have to refresh the page to see changes
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(302, "/urls");
});





//Server is listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



