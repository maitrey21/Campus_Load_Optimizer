const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: String,
  professor_id: String,
  student_ids: [String]
});

module.exports = mongoose.model("Course", courseSchema);
