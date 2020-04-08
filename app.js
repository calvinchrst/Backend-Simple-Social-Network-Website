const path = require("path");
const fs = require("fs");

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();

// Set up config file which stores sensitive information
const configPath = "./db_config.json";
const config = JSON.parse(fs.readFileSync(configPath, "UTF-8"));
const MONGODB_URI = config.mongodb_connect_url;

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
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message,
    details: error.details,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const server = app.listen(8080);

    const io = require("./socket").init(server);
    io.on("connetion", (socket) => {
      console.log("Client Connected!");
    });

    console.log("Server Startup Done");
  })
  .catch((err) => console.log(err));
