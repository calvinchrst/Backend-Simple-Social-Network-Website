const bcrypt = require("bcryptjs");
const validator = require("validator");

const User = require("../models/user");

const NR_TIMES_HASHING = 12;

module.exports = {
  createUser: async function ({ userInput }, req) {
    // Validate user input
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({
        message: "Email is invalid. Please input a valid email address",
      });
    }
    if (!validator.isLength(userInput.password, { min: 5 })) {
      errors.push({
        message: "Password length is too short. Minimum of 5 characters.",
      });
    }
    if (validator.isEmpty(userInput.name)) {
      errors.push({ message: "Name cannot be empty." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    // If existing user already exist with the same email, throw error
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User exists already");
      throw error;
    }

    // Hash password for security purposes
    const hashedPw = await bcrypt.hash(userInput.password, NR_TIMES_HASHING);

    // Create new user object and save it
    const newUser = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });
    const createdUser = await newUser.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
};
