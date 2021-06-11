const express = require("express");
var cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const checkIfEmailIsAlreadyUsed = require("./helper");

//Initialize the server
const app = express();
const PORT = 8080; // default port 8080

// enable ejs
app.set('view engine', 'ejs');
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
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

//const checkIfEmailIsAlreadyUsed = function (email, database) {
//  const keys = Object.keys(users);
//  console.log("Keys: ", keys)
//  for (const key of keys) {
//    if (database[key].email === email) {
//      console.log("These are the users: ", users);
//      return database[key].user_id;
//    }
//  }
//  
//  return null;
//};
//
//Generate Short URL value
function generateRandomString() {
  const string = Math.random().toString(36).slice(2);
  return string.slice(2, 8);
};



//Redirects to longURL
app.get("/u/:shortURL", (req, res) => {
  console.log("params: ", req.params.shortURL);
  const redirectURL = urlDatabase[req.params.shortURL].longURL;
  
  res.redirect(302, redirectURL);
});

//Collect URLS on our home page and connect them to views
app.get('/urls', (req, res) => {
  //Pass in ID as a parameter
  const filteredData = function (urlDatabase) {
    const filteredURLS = {}
    for (const url in urlDatabase) {
      if (urlDatabase[url].userID === req.session.user_id) {
        filteredURLS[url] = urlDatabase[url];
      }
    }
    return filteredURLS;
  };
  //let newURLS = filteredData(urlDatabase);
  
  //console.log("newURLS: ", newURLS)
  
  const templateVars = { urls: filteredData(urlDatabase), user: users[req.session.user_id]};

  if (!templateVars.user) {
    templateVars.urls = {};
  };
  //console.log("urldata: ", newURLS);
  res.render('urls_index', templateVars);
});

//Create a new form for submitting URLS to be shortened
app.get("/urls/new", (req, res) => {
  if(!req.session.user_id) {
     return res.redirect(302, "/urls/login");
  }
  console.log(req.session.user_id);
  const templateVars = {user: users[req.session.user_id]}
  res.render("urls_new", templateVars);
});

//Add a registration Page
app.get("/urls/register", (req, res) => {
  const templateVars = {user: users[req.session.user_id]}
  res.render("url_register", templateVars);
});

//Add a login Page
app.get("/urls/login", (req, res) => {
  const templateVars = {user: users[req.session.user_id]}

  res.render("urls_login", templateVars);
});

//Generate individul pages for shortURLS connecting to urls_show.ejs
app.get("/urls/:shortURL", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL].longURL);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[req.session.user_id] };
  //console.log(templateVars);
  res.render("urls_show", templateVars);
});

//Path for edit buttons
app.get("/urls/:shortURL/goto", (req, res) => {
  shortURL = req.params.shortURL;
  //console.log("urlID: ", urlDatabase[shortURL], "userID: ", req.cookies["user_id"]);
  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.write("Log in to edit Links").redirect(302, "/urls");
  }
  res.redirect(302, `/urls/${shortURL}`);         
});

// Edits long URL
app.post("/urls/:shortURL", (req, res) => {
  //Creat if logic to abort if unefined, return 404 or some error
  urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
  res.redirect(302, '/urls')
});

//Post new URLS to our database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  //console.log("cookie: ", res.cookies, "longURL", req.body.longURL);
  //This bit is pretty sus we can try again in the morning. User id won't be defined no matter what I do... idk...
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session.user_id};
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);         
});

//Adds new user when they register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  console.log("email: ", email, "password: ", password, "id: ", id);
  //Hash the password
  const salt = bcrypt.genSaltSync(5);
  const hash = bcrypt.hashSync(password, salt);
  console.log("Register hash: ", hash);
  //Ensures an email and password were provided (completely arbitrary since both are already required in ejs file)
  if (email === "" || password === "") {
    return res.send("Error must provide an email and password");
  }
  //Ensure that the user does not already exist
 
  if (checkIfEmailIsAlreadyUsed(email, users)) {
    return res.send(400, "Email already in use");
  }

  users[id] = { email, password: hash, user_id: id };
  console.log("User ID at registration: ", users[id], "All Users: ", users);
  //res.session("user_id", id);
  req.session.user_id = id;
  res.redirect(302, '/urls')
});

//Saves a cookie for new users
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = checkIfEmailIsAlreadyUsed(email, users);
  if (id === null) {
    return res.send(403, "Email doesn't exist");
  }
  console.log("users login:", users, "CheckEmail ID: ", id);
  const passHashed = users[id].password;

  if (checkIfEmailIsAlreadyUsed(email, users) !== null) {
    if (!bcrypt.compareSync(password, passHashed)) {
      console.log("Inside checkPass");
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
  //res.clearCookie("user_id");
  req.session = null;
  res.redirect(302, "/urls");
})

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



