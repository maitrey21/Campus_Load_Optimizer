const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema({
  title: String,
  course_id: String,
  deadline_date: Date,
  difficulty: Number,
  type: {
    type: String,
    enum: ["exam", "assignment", "project"]
  },
  created_by: String
});

module.exports = mongoose.model("Deadline", deadlineSchema);
