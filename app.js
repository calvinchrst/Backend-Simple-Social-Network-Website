const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const graphqlHttp = require("express-graphql");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const app = express();
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const util = require("./util/util");

// Check if images folder exist. If not create it
images_filepath = path.join(__dirname, "images");
if (!fs.existsSync(images_filepath)) {
  fs.mkdirSync(images_filepath);
}

// Setup multer. This is used to accept image upload
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().split(":").join("_") + "-" + file.originalname
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Additional Middleware for security & logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

// app.use(bodyparser.urlencoded());   // x-www-form-urleconded <form>
app.use(bodyparser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(auth);

app.put("/post-image", (req, res, next) => {
  util.throwErrorIfNotAuthenticated(req.isAuth);
  if (!req.file) {
    return res.status(200).json({
      message: "No file uploaded",
    });
  }

  // TODO: NEED EDIT TESTING
  if (req.body.oldPath) {
    util.clearImage(req.body.oldPath);
  }

  // Replace file path
  const imageUrl = util.replaceBackslashWithSlash(req.file.path); // This is needed because backslash sometimes is used as an escape key

  res.status(201).json({
    message: "File uploaded",
    filePath: imageUrl,
  });
});

app.use(
  "/graphql",
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;
      const message = err.message || "An error occurred.";
      const code = err.originalError.code || 500;
      return { message: message, status: code, data: data };
    },
  })
);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then((result) => {
    app.listen(process.env.PORT || 8080);
    console.log("Server Startup Done");
  })
  .catch((err) => console.log(err));
