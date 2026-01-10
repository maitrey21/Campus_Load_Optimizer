const router = require("express").Router();
const { createCourse, getCourses } = require("../controllers/course.controller");

router.post("/", createCourse);
router.get("/", getCourses);

module.exports = router;
