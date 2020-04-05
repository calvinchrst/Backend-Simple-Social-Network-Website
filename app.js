const fs = require("fs");

const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");

const feedRoutes = require("./routes/feed");

const app = express();

// Set up config file which stores sensitive information
const configPath = "./db_config.json";
const config = JSON.parse(fs.readFileSync(configPath, "UTF-8"));
const MONGODB_URI = config.mongodb_connect_url;

// app.use(bodyparser.urlencoded());   // x-www-form-urleconded <form>
app.use(bodyparser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "Authorization"
  );
  next();
});

app.use("/feed", feedRoutes);

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
    app.listen(8080);
    console.log("Server Startup Done");
  })
  .catch((err) => console.log(err));
