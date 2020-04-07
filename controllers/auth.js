const fs = require("fs");

const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const NR_TIMES_HASH = 12;

// Set up config file which stores sensitive information
const configPath = "./db_config.json";
const config = JSON.parse(fs.readFileSync(configPath, "UTF-8"));

exports.signup = (req, res, next) => {
  // Check for validation error
  error = validationResult(req);
  if (!error.isEmpty()) {
    const newError = new Error("Validation Error: Post data is incorrect");
    newError.details = error.array();
    newError.statusCode = 422;
    throw newError;
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  bcrypt
    .hash(password, NR_TIMES_HASH)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        name: name,
        password: hashedPassword,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "User created successfully",
        userId: result._id,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  email = req.body.email;
  password = req.body.password;
  let userFound;

  User.findOne({ email: email })
    .then((user) => {
      // Check if user exist
      if (!user) {
        const newError = new Error("Wrong Email and Password Combination");
        newError.statusCode = 401;
        throw newError;
      }

      // Check if password is correct
      userFound = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isMatch) => {
      if (!isMatch) {
        const newError = new Error("Wrong Email and Password Combination");
        newError.statusCode = 401;
        throw newError;
      }

      // Email & Password match
      const token = jwt.sign(
        {
          email: userFound.email,
          userId: userFound._id.toString(),
        },
        config.json_web_token_secret_key,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        message: "User successfuly signed in",
        token: token,
        userId: userFound._id.toString(),
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
