const { validationResult } = require("express-validator");

const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First Post",
        content: "This is my first post",
        imageUrl: "images/headset.jpg",
        creator: {
          name: "Calvin",
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  title = req.body.title;
  content = req.body.content;

  // Check for validation error
  error = validationResult(req);
  if (!error.isEmpty()) {
    res.status(422).json({
      message: "Validation Error: Post data is incorrect",
      errors: error.array(),
    });
  }

  post = new Post({
    title: title,
    content: content,
    imageUrl: "images/headset.jpg",
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
    .catch((err) => console.log(err));
};
