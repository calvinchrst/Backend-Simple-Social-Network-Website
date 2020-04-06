const fs = require("fs");
const jwt = require("jsonwebtoken");

// Set up config file which stores sensitive information
const configPath = "./db_config.json";
const config = JSON.parse(fs.readFileSync(configPath, "UTF-8"));

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  // Check if authHeader exist or not
  if (!authHeader) {
    const newError = new Error("Not authenticated");
    newError.statusCode = 401;
    throw newError;
  }

  // Token value in authHeader is in form "Bearer xxxxx" where xxxxx is the token we are interested at
  const token = authHeader.split(" ")[1];

  // Check if token is valid
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, config.json_web_token_secret_key);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  console.log("DECODED TOKEN:", decodedToken);
  if (!decodedToken) {
    const newError = new Error("Not authenticated");
    newError.statusCode = 401;
    throw newError;
  }

  // If token is valid, then we continue with our request
  req.userId = decodedToken.userId;
  next();
};
