const express = require("express");
var cookieParser = require('cookie-parser')
//Initialize the server
const app = express();
const PORT = 8080; // default port 8080

// enable ejs
app.set('view engine', 'ejs');
app.use(cookieParser());

//Declare Database variable
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};


//Include a users object
let users = { 
  "Greg": {
    user_id: "Greg", 
    email: "g@g.com", 
    password: "12345"
  },
 "Harold": {
    user_id: "Greg", 
    email: "h@h.com", 
    password: "12345"
  }
};

const checkIfEmailIsAlreadyUsed = function (email) {
  const keys = Object.keys(users);
  
  for (const key of keys) {
    if (users[key].email === email) {
      return users[key].user_id;
    }
  }
  
  return null;
};

const checkPassword = function (password) {
  const keys = Object.keys(users);

  for (const key of keys) {
    if (users[key].password === password) {
      return true;
    }
  }

  return false
}

//Generate Short URL value
function generateRandomString() {
  const string = Math.random().toString(36).slice(2);
  return string.slice(2, 8);
};

//Parse buffer into a string so it can be used
app.use(express.urlencoded({extended: false}));


//Redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  console.log("params: ", req.params.shortURL);
  const redirectURL = urlDatabase[req.params.shortURL].longURL;
  
  res.redirect(302, redirectURL);
});

//Collect URLS on our home page and connect them to views
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id]};

  if (!templateVars.user) {
    templateVars.urls = {};
  };
  console.log(urlDatabase);
  res.render('urls_index', templateVars);
});

//Create a new form for submitting URLS to be shortened
app.get("/urls/new", (req, res) => {
  if(!req.cookies["user_id"]) {
     return res.redirect(302, "/urls/login");
  }
  
  const templateVars = {user: users[req.cookies["user_id"]]}
  res.render("urls_new", templateVars);
});

//Add a registration Page
app.get("/urls/register", (req, res) => {
  const templateVars = {user: users[req.cookies["user_id"]]}
  res.render("url_register", templateVars);
});

//Add a login Page
app.get("/urls/login", (req, res) => {
  const templateVars = {user: users[req.cookies["user_id"]]}

  res.render("urls_login", templateVars);
});

//Generate individul pages for shortURLS connecting to urls_show.ejs
app.get("/urls/:shortURL", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL].longURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]] };
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
  console.log("cookie: ", res.cookies, "longURL", req.body.longURL);
  //This bit is pretty sus we can try again in the morning. User id won't be defined no matter what I do... idk...
  urlDatabase[shortURL] = {longURL: req.body.longURL, user_id: req.cookies.user_id};
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);         
});

//Adds new user when they register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();

  //Ensures an email and password were provided (completely arbitrary since both are already required in ejs file)
  if (email === "" || password === "") {
    return res.send("Error must provide an email and password");
  }
  //Ensure that the user does not already exist
 
  if (checkIfEmailIsAlreadyUsed(email)) {
    return res.send(400, "Email already in use");
  }

  users[id] = { email, password, user_id: id };
  console.log(users[id]);
  res.cookie("user_id", id);

  res.redirect('/urls')
});

//Saves a cookie for new users
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  
  if (checkIfEmailIsAlreadyUsed(email) !== null) {
    if (!checkPassword(password)) {
      console.log("Inside checkPass");
      return res.send(403, "Passwords do not match");
    }
  } else {
    return res.send(403, "Email doesn't exist");
  }
 
  const id = checkIfEmailIsAlreadyUsed(email);
  console.log("id: ", id)
  res.cookie("user_id", id);

  res.redirect(302, "/urls");
});

//Adds logout functionality
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect(302, "urls");
})

//Delete a tinyURL *This part works, but the button is broken !! Fixed the button, but have to refresh the page to see changes
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(302, "/urls");
});





//Server is listening

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



