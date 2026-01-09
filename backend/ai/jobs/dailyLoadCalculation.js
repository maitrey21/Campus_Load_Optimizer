import { schedule } from 'node-cron';
import loadCalculator from '../services/loadCalculator.js';
import aiService from '../services/aiService.js';
import { findOneAndUpdate } from '../models/studentLoad.js';
import { find } from '../../models/User.js';
import { find as _find } from '../../models/Deadline.js';

/**
 * Run every day at 6:00 AM
 * Cron format: minute hour day month dayOfWeek
 */
const dailyLoadJob = schedule('0 6 * * *', async () => {
  console.log('🤖 Running daily load calculation job...');
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all students
    const students = await find({ role: 'student' });
    console.log(`📊 Processing ${students.length} students...`);

    let processedCount = 0;
    let tipsGenerated = 0;

    for (const student of students) {
      try {
        // Get student's deadlines
        const deadlines = await _find({
          course_id: { $in: student.enrolled_courses || [] }
        }).populate('course_id', 'name');

        // Calculate today's load
        const todayLoad = loadCalculator.calculateDailyLoad(deadlines, today);

        // Save to database (upsert)
        await findOneAndUpdate(
          {
            student_id: student._id,
            date: today
          },{
student_id: student._id,
date: today,
load_score: todayLoad.load_score,
risk_level: todayLoad.risk_level,
deadlines_count: todayLoad.deadlines_count,
deadlines: todayLoad.deadlines
},
{
upsert: true,
new: true
}
);
    processedCount++;

    // Generate AI tip if high load
    if (todayLoad.risk_level === 'danger' || todayLoad.risk_level === 'warning') {
      const loadData = loadCalculator.calculateLoadRange(deadlines, today, 7);
      await aiService.generateStudentTip(student, loadData);
      tipsGenerated++;
    }

  } catch (studentError) {
    console.error(`Error processing student ${student._id}:`, studentError.message);
  }
}

console.log(`✅ Daily load calculation complete!`);
console.log(`   - Processed: ${processedCount} students`);
console.log(`   - Generated: ${tipsGenerated} AI tips`);
} catch (error) {
console.error('❌ Error in daily load calculation job:', error);
}
}, {
timezone: "Asia/Kolkata" 
});
// Export for manual triggering
export const job = dailyLoadJob;

export const runNow = async () => {
  console.log('🔧 Manually triggering daily load calculation...');
};
