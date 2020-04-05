const express = require("express");
const bodyparser = require("body-parser");

const feedRoutes = require("./routes/feed");

const app = express();

// app.use(bodyparser.urlencoded());   // x-www-form-urleconded <form>
app.use(bodyparser.json());

app.use("/feed", feedRoutes);

app.listen(8080);

console.log("Server Startup Done");
