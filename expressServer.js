const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const checkIfEmailIsAlreadyUsed = require("./helper");

//Initialize the server
const app = express();
const PORT = 8080; // default port 8080

// enable ejs
app.set('view engine', 'ejs');
//Set up encrypted cookies
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
//Include url encoding
app.use(express.urlencoded({extended: false}));

//Declare Database variable
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "Greg" },
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

//Helper function to generate a string
generateRandomString = () => {
  const string = Math.random().toString(36).slice(2);
  return string.slice(2, 8);
};



//Redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  const redirectURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(302, redirectURL);
});

//Collect URLS on our home page and connect them to views
app.get('/urls', (req, res) => {
  //redirect to login if not logged in
  if (!req.session.user_id) {
    return res.redirect(302, "/urls/login");
  }
  //Pass in ID as a parameter
  const filteredData = function(urlDatabase) {
    const filteredURLS = {};
    for (const url in urlDatabase) {
      if (urlDatabase[url].userID === req.session.user_id) {
        filteredURLS[url] = urlDatabase[url];
      }
    }
    return filteredURLS;
  };

  const templateVars = { urls: filteredData(urlDatabase), user: users[req.session.user_id]};

  if (!templateVars.user) {
    templateVars.urls = {};
  }

  res.render('urls_index', templateVars);
});

//Create a new form for submitting URLS to be shortened
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect(302, "/urls/login");
  }

  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_new", templateVars);
});

//Add a registration Page
app.get("/urls/register", (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  res.render("url_register", templateVars);
});

//Renders the login Page
app.get("/urls/login", (req, res) => {
  const templateVars = {user: users[req.session.user_id]};
  res.render("urls_login", templateVars);
});

//Generate individul pages for shortURLS connecting to urls_show.ejs
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    return res.status(404).send("This shortURL doesn't exist! Sorry, try again?");
  }

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };

  res.render("urls_show", templateVars);
});

//Path for edit buttons
app.get("/urls/:shortURL/goto", (req, res) => {
  shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.write("Log in to edit Links").redirect(302, "/urls");
  }
  res.redirect(302, `/urls/${shortURL}`);
});

// Edits long URL
app.post("/urls/:shortURL", (req, res) => {
  //Creat if logic to abort if unefined, return 404 or some error
  urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  res.redirect(302, '/urls');
});

//Post new URLS to our database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  //This bit is pretty sus we can try again in the morning. User id won't be defined no matter what I do... idk...
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};
  res.redirect(`/urls/${shortURL}`);
});

//Adds new user when they register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  //Hash the password
  const salt = bcrypt.genSaltSync(5);
  const hash = bcrypt.hashSync(password, salt);
  //Ensures an email and password were provided (completely arbitrary since both are already required in ejs file)
  if (email === "" || password === "") {
    return res.send("Error must provide an email and password");
  }
  //Ensure that the user does not already exist
  if (checkIfEmailIsAlreadyUsed(email, users)) {
    return res.send(400, "Email already in use");
  }

  users[id] = { email, password: hash, user_id: id };

  req.session.user_id = id;
  res.redirect(302, '/urls');
});

//Saves a cookie for new users
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = checkIfEmailIsAlreadyUsed(email, users);
  if (id === null) {
    return res.send(403, "Email doesn't exist");
  }

  const passHashed = users[id].password;

  if (checkIfEmailIsAlreadyUsed(email, users) !== null) {
    if (!bcrypt.compareSync(password, passHashed)) {
      return res.send(403, "Passwords do not match");
    }
  } else {
    return res.send(403, "Email doesn't exist");
  }
  
  req.session.user_id = id;
  res.redirect(302, "/urls");
});

//Adds logout functionality
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect(302, "/urls");
});

//Delete a tinyURL *This part works, but the button is broken !! Fixed the button, but have to refresh the page to see changes
app.post('/urls/:shortURL/delete', (req, res) => {
  shortURL = req.params.shortURL;
  
  if (urlDatabase[shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect(302, "/urls");
  }
  
  res.write("You can't delete links that don't belong to you.").redirect(302, "/urls");
});

//Server is listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



