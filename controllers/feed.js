const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

const NR_POST_PER_PAGE = 2;

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * NR_POST_PER_PAGE)
        .limit(NR_POST_PER_PAGE);
    })
    .then((posts) => {
      res.status(200).json({
        message: "Get all posts successfully",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  // Check for validation error
  error = validationResult(req);
  if (!error.isEmpty()) {
    const newError = new Error("Validation Error: Post data is incorrect");
    newError.details = error.array();
    newError.statusCode = 422;
    throw newError;
  }

  // Check for file existence
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace(/\\/g, "/"); // This is needed because backslash sometimes is used as an escape key

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  let Creator;
  post
    .save()
    .then((result) => {
      // Update User object with this new post
      return User.findById(req.userId);
    })
    .then((user) => {
      if (!user) {
        const error = new Error("User in request object not found");
        error.statusCode = 500;
        throw error;
      }

      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "Post created successfully",
        post: post,
        creator: { _id: creator._id.toString(), name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        message: "Get post successfully",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  // Check for validation error
  error = validationResult(req);
  if (!error.isEmpty()) {
    const newError = new Error("Validation Error: Post data is incorrect");
    newError.details = error.array();
    newError.statusCode = 422;
    throw newError;
  }

  // Check for updated file existence
  if (req.file) {
    imageUrl = req.file.path.replace(/\\/g, "/"); // This is needed because backslash sometimes is used as an escape key
  }

  Post.findById(postId)
    .then((post) => {
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
        clearImage(post.imageUrl);
      }

      // Update Post & Save
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Post updated",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      // Check if the current user is the creator of the post

      clearImage(post.imageUrl);
      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      res.status(200).json({
        message: "Post deleted",
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      err.message = "Unable to delete image" + filePath;
      throw err;
    }
  });
};
