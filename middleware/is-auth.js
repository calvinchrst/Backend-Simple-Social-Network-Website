const jwt = require("jsonwebtoken");

const util = require("../util/util");

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
    decodedToken = jwt.verify(
      token,
      util.getConfig().json_web_token_secret_key
    );
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  if (!decodedToken) {
    const newError = new Error("Not authenticated");
    newError.statusCode = 401;
    throw newError;
  }

  // If token is valid, then we continue with our request
  req.userId = decodedToken.userId;
  next();
};
