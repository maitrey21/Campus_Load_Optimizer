import { Router } from 'express';
import aiService from '../services/aiService.js';
import loadCalculator from '../services/loadCalculator.js';
import conflictDetector from '../services/conflictDetector.js';
import { find } from '../models/studentLoad.js';
import { findById } from '../../models/User.js';
import { findById as _findById } from '../../models/Course.js';
import { find as _find } from '../../models/Deadline.js';
const router = Router();
/**
 * POST /api/ai/student-tip
 * Generate AI tip for student
 */
router.post('/student-tip', async (req, res) => {
  try {
    const { studentId } = req.body;

    // Get student data
    const student = await findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get student's deadlines
    const deadlines = await _find({
      course_id: { $in: student.enrolled_courses || [] }
    }).populate('course_id', 'name');

    // Calculate load for next 7 days
    const loadData = loadCalculator.calculateLoadRange(deadlines, new Date(), 7);

    // Generate AI tip
    const tipResult = await aiService.generateStudentTip(student, loadData);

    res.json({
      success: true,
      tip: tipResult.tip,
      tip_id: tipResult.tip_id,
      priority: tipResult.priority,
      loadData
    });

  } catch (error) {
    console.error('Error in student-tip:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/professor-suggestion
 * Generate suggestions for professor
 */
router.post('/professor-suggestion', async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await _findById(courseId).populate('professor_id', 'name');
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const deadlines = await _find({ course_id: courseId });
    
    // Detect conflicts
    const conflicts = conflictDetector.detectConflicts(deadlines);

    // Calculate class average load for next 14 days
    const classLoadData = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Get all students' loads for this date
      const studentLoads = await find({
        student_id: { $in: course.student_ids },
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      });

      const avgLoad = studentLoads.length > 0
        ? studentLoads.reduce((sum, sl) => sum + sl.load_score, 0) / studentLoads.length
        : 0;

      classLoadData.push({
        date: date.toISOString().split('T')[0],
        average_load: Math.round(avgLoad)
      });
    }

    // Generate AI suggestion
    const courseData = {
      _id: course._id,
      name: course.name,
      professor_id: course.professor_id,
      deadlines
    };

    const suggestion = await aiService.generateProfessorSuggestion(
      courseData,
      classLoadData,
      conflicts
    );

    res.json({
      success: true,
      suggestion,
      classLoadData,
      conflicts
    });

  } catch (error) {
    console.error('Error in professor-suggestion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/conflicts/:courseId
 * Get deadline conflicts for a course
 */
router.get('/conflicts/:courseId', async (req, res) => {
  try {
    const deadlines = await _find({ 
      course_id: req.params.courseId 
    }).populate('course_id', 'name');

    const conflicts = conflictDetector.detectConflicts(deadlines);

    // Get alternative dates for each conflict
    const conflictsWithSuggestions = conflicts.map(conflict => ({
      ...conflict,
      suggested_dates: conflictDetector.suggestAlternativeDates(conflict, deadlines)
    }));

    res.json({
      success: true,
      conflicts: conflictsWithSuggestions
    });

  } catch (error) {
    console.error('Error in conflicts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/load/:studentId
 * Get calculated load data for student
 */
router.get('/load/:studentId', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const student = await findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const deadlines = await _find({
      course_id: { $in: student.enrolled_courses || [] }
    }).populate('course_id', 'name');

    const loadData = loadCalculator.calculateLoadRange(deadlines, new Date(), parseInt(days));

    res.json({
      success: true,
      loadData,
      peakDays: loadCalculator.findPeakLoadDays(loadData)
    });

  } catch (error) {
    console.error('Error in load calculation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ai/tips/:userId
 * Get recent AI tips for a user
 */
router.get('/tips/:userId', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const tips = await aiService.getUserTips(req.params.userId, parseInt(limit));

    res.json({
      success: true,
      tips
    });

  } catch (error) {
    console.error('Error fetching tips:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/ai/tips/:tipId/read
 * Mark tip as read
 */
router.put('/tips/:tipId/read', async (req, res) => {
  try {
    const tip = await aiService.markTipAsRead(req.params.tipId);

    res.json({
      success: true,
      tip
    });

  } catch (error) {
    console.error('Error marking tip as read:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;