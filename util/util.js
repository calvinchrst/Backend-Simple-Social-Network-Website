const fs = require("fs");
const path = require("path");

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const checkValidationError = (req, validation_error_message) => {
  // Check if there's any validation error that was creatd using express-validator
  // Throw error if any

  error = validationResult(req);
  if (!error.isEmpty()) {
    const newError = new Error(validation_error_message);
    newError.details = error.array();
    newError.statusCode = 422;
    throw newError;
  }
};

const clearImage = (filePath) => {
  // Delete image given in the filepath

  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      err.message = "Unable to delete image" + filePath;
      throw err;
    }
  });
};

const replaceBackslashWithSlash = (string) => {
  return string.replace(/\\/g, "/");
};

// Get config file which stores sensitive information
const configPath = "./db_config.json";
const config = JSON.parse(fs.readFileSync(configPath, "UTF-8"));
const getConfig = () => {
  return config;
};

const getJWTToken = (email, userId) => {
  const token = jwt.sign(
    {
      email: email,
      userId: userId.toString(),
    },
    getConfig().json_web_token_secret_key,
    { expiresIn: "1h" }
  );

  return token;
};

exports.checkValidationError = checkValidationError;
exports.clearImage = clearImage;
exports.replaceBackslashWithSlash = replaceBackslashWithSlash;
exports.getConfig = getConfig;
exports.getJWTToken = getJWTToken;
