const router = require("express").Router();
const { signup, login, getCurrentUser } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/authMiddleware");
const { runNow } = require("../services/dailyLoadCalculation");
const User = require("../models/user");


router.post("/signup", signup);
router.post("/login", login);
router.get('/me', authMiddleware, getCurrentUser);

// Get all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-supabase_id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by role
router.get('/users/role/:role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.params;
    if (!['student', 'professor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const users = await User.find({ role }, '-supabase_id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trigger', async (req, res) => {
  try {
    await runNow();
    res.json({ message: 'Daily load calculation triggered successfully' });
  } catch (error) {
    console.error('Error triggering daily load calculation:', error);
    res.status(500).json({ error: 'Failed to trigger daily load calculation' });
  }
});

module.exports = router;
