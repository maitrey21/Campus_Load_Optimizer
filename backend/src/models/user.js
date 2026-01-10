const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  supabase_id: String,
  email: String,
  name: String,
  role: {
    type: String,
    enum: ["student", "professor", "admin"],
    default: "student"
  }
});

module.exports = mongoose.model("User", userSchema);
