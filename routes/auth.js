const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/auth");
const User = require("../models/user");

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email. Please input a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exists");
          }
        });
      })
      .normalizeEmail(),
    body("name", "Name cannot be empty. Please input a valid name")
      .trim()
      .not()
      .isEmpty(),
    body(
      "password",
      "Invalid Password. Please input password with minimum 5 characters"
    )
      .trim()
      .isLength({ min: 5 }),
  ],
  authController.signup
);

module.exports = router;
