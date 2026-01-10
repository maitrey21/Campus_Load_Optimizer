const cron = require("node-cron");
const User = require("../models/user");
const Deadline = require("../models/deadline");
const StudentLoad = require("../models/studentload");
const { calculateLoad } = require("./loadCalculator");

cron.schedule("0 0 * * *", async () => {
  const students = await User.find({ role: "student" });
  const deadlines = await Deadline.find();

  for (let student of students) {
    const result = calculateLoad(deadlines);

    await StudentLoad.create({
      student_id: student._id,
      date: new Date().toISOString().split("T")[0],
      load_score: result.load,
      risk_level: result.risk
    });
  }

  console.log("Daily load recalculated");
});
