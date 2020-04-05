const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      return res.status(200).json({
        message: "Get all posts successfully",
        posts: posts,
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
  title = req.body.title;
  content = req.body.content;

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
    console.log("CALVIN NO IMAGE PROVIDED");
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace(/\\/g, "/");
  console.log("FILE PATH:", req.file.path);

  post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: {
      name: "Calvin",
    },
  });
  post
    .save()
    .then((result) => {
      return res.status(201).json({
        message: "Post created successfully",
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

exports.getPost = (req, res, next) => {
  postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      return res.status(200).json({
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
