const mongoose = require("mongoose");

const studentLoadSchema = new mongoose.Schema({
  student_id: String,
  date: String,
  load_score: Number,
  risk_level: String
});

module.exports = mongoose.model("StudentLoad", studentLoadSchema);
