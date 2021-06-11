const checkIfEmailIsAlreadyUsed = function (email, database) {
  const keys = Object.keys(database);
  console.log("Keys: ", keys)
  for (const key of keys) {
    if (database[key].email === email) {
      //console.log("These are the users: ", users);
      return database[key].user_id;
    }
  }
  
  return null;
};

module.exports = checkIfEmailIsAlreadyUsed;