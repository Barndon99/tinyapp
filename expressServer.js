const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// enable ejs
app.set('view engine', 'ejs');

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
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//Post new URLS to our database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);         
});

//Redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[`${req.params.shortURL}`];
  res.redirect(`${longURL}`);
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
  console.log(req.params.shortURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});
//Delete a tinyURL *This part works, but the button is broken
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('localhost:8080/urls');
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

