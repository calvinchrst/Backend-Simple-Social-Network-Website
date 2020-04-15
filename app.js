const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const graphqlHttp = require("express-graphql");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const app = express();
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const util = require("./util/util");
const { getAWSUpload, clearImage } = require("./util/image");

// Additional Middleware for security & logging
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);
app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyparser.json());

// Set headers that allows CORS
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

app.put("/post-image", getAWSUpload().single("image"), (req, res, next) => {
  util.throwErrorIfNotAuthenticated(req.isAuth);
  if (!req.file) {
    return res.status(200).json({
      message: "No file uploaded",
    });
  }

  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  res.status(201).json({
    message: "File uploaded",
    filePath: req.file.location,
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
