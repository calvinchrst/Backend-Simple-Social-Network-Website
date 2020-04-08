const { validationResult } = require("express-validator");

const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");

const util = require("../util/util");

const NR_POST_PER_PAGE = 2;

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find();
    res.status(200).json({
      message: "Get all posts successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  util.checkValidationError(req, "Validation Error: Post data is incorrect");

  // Check for file existence
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = util.replaceBackslashWithSlash(req.file.path); // This is needed because backslash sometimes is used as an escape key

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User in request object not found");
      error.statusCode = 500;
      throw error;
    }
    user.posts.push(post);
    await user.save();
    io.getIO().emit("posts", { action: "create", post: post });
    res.status(201).json({
      message: "Post created successfully",
      post: post,
      creator: { _id: user._id.toString(), name: user.name },
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  try {
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Get post successfully",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  util.checkValidationError(req, "Validation Error: Post data is incorrect");

  // Check for updated file existence
  if (req.file) {
    imageUrl = util.replaceBackslashWithSlash(req.file.path); // This is needed because backslash sometimes is used as an escape key
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    // Check for existence of imageUrl
    // we are checking for equality to undefined because there's a bug in front end that would cause imageUrl to be undefined although we didn't pick any image
    if (!imageUrl || imageUrl == "undefined") {
      imageUrl = post.imageUrl;
    } else if (imageUrl !== post.imageUrl) {
      // Delete old image if a new updated imageUrl exist
      util.clearImage(post.imageUrl);
    }

    // Update Post & Save
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    await post.save();

    res.status(200).json({
      message: "Post updated",
      post: post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    // Check if the current user is the creator of the post
    util.clearImage(post.imageUrl);
    await Post.findByIdAndDelete(postId);
    const user = await User.findById(post.creator);
    user.posts.pull(postId);
    await user.save();
    res.status(200).json({
      message: "Post deleted",
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
