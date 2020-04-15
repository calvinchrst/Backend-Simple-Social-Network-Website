const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Post = require("../models/post");
const util = require("../util/util");
const { clearImage } = require("../util/image");

const NR_TIMES_HASHING = 12;

module.exports = {
  createUser: async function ({ userInput }, req) {
    // Validate user input
    util.checkValidInputForUser(userInput);

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
  login: async function ({ email, password }) {
    // Check if email exists in the system
    const user = await User.findOne({ email: email });
    if (!user) {
      const err = new Error("Wrong email & password combination.");
      err.code = 401;
      return err;
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Wrong email & password combination.");
      err.code = 401;
      return err;
    }

    // Create jsonwebtoken
    token = util.getJWTToken(email, user._id);

    // Return result
    return { token: token, userId: user._id.toString() };
  },
  createPost: async function ({ postInput }, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);
    util.checkValidInputForPost(postInput);

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user.");
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  posts: async function ({ page }, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);

    if (!page) {
      page = 1;
    }

    const NR_POST_PER_PAGE = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * NR_POST_PER_PAGE)
      .limit(NR_POST_PER_PAGE)
      .populate("creator");
    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
  getPost: async function ({ postId }, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);

    // Check if Post with such ID exist
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const err = new Error("Post doesn't exist");
      err.code = 404;
      return err;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async function ({ postId, postInput }, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);
    util.checkValidInputForPost(postInput);

    // Check if Post exist
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const err = new Error("Post doesn't exist");
      err.code = 404;
      return err;
    }

    // Only allow user who created the post to update this post
    if (req.userId.toString() !== post.creator._id.toString()) {
      const err = new Error("Not Authorized");
      err.code = 401;
      return err;
    }

    // Update the post
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
      console.log("UPDATE PIC HAPPEN");
    }
    updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  deletePost: async function ({ postId }, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);

    // Check if Post exist
    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Post doesn't exist");
      err.code = 404;
      return err;
    }

    // Only allow user who created the post to update this post
    if (req.userId.toString() !== post.creator.toString()) {
      const err = new Error("Not Authorized");
      err.code = 401;
      return err;
    }

    // Remove Post from User posts list
    const user = await User.findById(post.creator);
    if (!user) {
      const err = new Error("User somehow doesn't exist.");
      err.code = 404;
      return err;
    }
    user.posts.pull(postId);
    await user.save();

    // Remove image of the post
    if (post.imageUrl !== "undefined") {
      clearImage(post.imageUrl);
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);
    return true;
  },
  getUser: async function (args, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);

    // Check if User Exist
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error("User not found");
      err.code = 404;
      return err;
    }

    // Return user data
    return {
      ...user._doc,
      _id: user._id.toString(),
    };
  },
  updateStatus: async function ({ newStatus }, req) {
    util.throwErrorIfNotAuthenticated(req.isAuth);

    // Check if User Exist
    const user = await User.findById(req.userId);
    if (!user) {
      const err = new Error("User not found");
      err.code = 404;
      return err;
    }

    // Update status
    user.status = newStatus;
    const updatedUser = await user.save();
    return {
      ...updatedUser._doc,
      _id: updatedUser._id.toString(),
    };
  },
};
