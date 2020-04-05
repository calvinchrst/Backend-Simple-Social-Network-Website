const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const User = require("../models/user");

const NR_TIMES_HASH = 12;

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
