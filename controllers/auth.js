const bcrypt = require("bcryptjs");

const User = require("../models/user");
const util = require("../util/util");

const NR_TIMES_HASH = 12;

exports.signup = async (req, res, next) => {
  util.checkValidationError(req, "Validation Error: Sign up data is incorrect");

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
    const hashedPassword = await bcrypt.hash(password, NR_TIMES_HASH);
    const user = new User({
      email: email,
      name: name,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await User.findOne({ email: email });

    // Check if user exist
    if (!user) {
      const newError = new Error("Wrong Email and Password Combination");
      newError.statusCode = 401;
      throw newError;
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const newError = new Error("Wrong Email and Password Combination");
      newError.statusCode = 401;
      throw newError;
    }

    // Email & Password match. Return a response with JSONWEBTOKEN
    const token = util.getJWTToken(user.email, user._id);

    res.status(200).json({
      message: "User successfuly signed in",
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
