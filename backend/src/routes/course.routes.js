const router = require("express").Router();
const Course= require("../controllers/course.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, Course.createCourse);
router.get("/", authMiddleware, Course.getCourses);
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const courses = await Course.findCoursesByUserId(userId);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
