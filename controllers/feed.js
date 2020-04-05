const { validationResult } = require("express-validator");

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

  // Create post in db
  res.status(201).json({
    message: "Post created successfully",
    post: {
      _id: new Date().toISOString(),
      title: title,
      content: content,
      creator: {
        name: "Calvin",
      },
      createdAt: new Date(),
    },
  });
};
