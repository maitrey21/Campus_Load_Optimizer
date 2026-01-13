const router = require("express").Router();
const controller = require("../controllers/deadline.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, controller.createDeadline);
router.get("/", authMiddleware, controller.getDeadlines);
router.put("/:id", authMiddleware, controller.updateDeadline);
router.delete("/:id", authMiddleware, controller.deleteDeadline);
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const deadlines = await controller.getDeadlinesByUserId(userId);
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/assignments/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const deadlines = await controller.getAssignmentDeadlinesByUserId(userId);
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
