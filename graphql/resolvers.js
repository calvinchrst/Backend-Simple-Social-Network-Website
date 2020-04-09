const User = require("../models/user");
const bcrypt = require("bcryptjs");

const NR_TIMES_HASHING = 12;

module.exports = {
  createUser: async function ({ userInput }, req) {
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
