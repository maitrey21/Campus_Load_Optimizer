const Course = require("../models/course");

exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findCoursesByUserId = async (userId) => {
  return await Course.find({
    $or: [
      { professor_id: userId },
      { student_ids: userId }
    ]
  });
}
