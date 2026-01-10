const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const deadlineRoutes = require("./routes/deadline.routes");
const loadRoutes = require("./routes/load.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/courses", courseRoutes);
app.use("/deadlines", deadlineRoutes);
app.use("/load", loadRoutes);

module.exports = app;
