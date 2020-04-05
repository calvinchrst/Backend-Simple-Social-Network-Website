exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{ title: "First Post", content: "This is my first post" }],
  });
};

exports.createPost = (req, res, next) => {
  title = req.body.title;
  content = req.body.content;

  // Create post in db
  res.status(201).json({
    message: "Post created successfully",
    post: { id: new Date().toISOString(), title: title, content: content },
  });
};
