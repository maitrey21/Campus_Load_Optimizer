import { chat } from '../config/openai.config.js';
import { create, find, findByIdAndUpdate } from '../models/aiTip.js';
import { studentTipPrompt, professorSuggestionPrompt } from '../utils/aiPrompts.js';

class AIService {
  /**
   * Generate personalized tip for student
   */
  async generateStudentTip(studentData, loadData) {
    try {
      // Filter high-load days
      const highLoadDays = loadData.filter(d => d.load_score >= 40);
      
      if (highLoadDays.length === 0) {
        return this.generatePositiveTip(studentData);
      }

      const prompt = studentTipPrompt(
        studentData.name,
        highLoadDays
      );

      const completion = await chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a supportive academic advisor helping students manage their workload. Be encouraging but realistic."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const tipText = completion.choices[0].message.content;

      // Save tip to database
      const savedTip = await create({
        user_id: studentData._id,
        tip_text: tipText,
        tip_type: 'student_workload',
        metadata: {
          load_score: highLoadDays[0].load_score,
          risk_level: highLoadDays[0].risk_level,
          affected_dates: highLoadDays.map(d => d.date),
          priority: highLoadDays[0].risk_level === 'danger' ? 'high' : 'medium'
        }
      });

      return {
        tip: tipText,
        tip_id: savedTip._id,
        priority: savedTip.metadata.priority
      };

    } catch (error) {
      console.error('Error generating student tip:', error);
      throw new Error('Failed to generate AI tip');
    }
  }

  /**
   * Generate positive tip for students with low load
   */
  async generatePositiveTip(studentData) {
    const encouragements = [
      `Great job, ${studentData.name}! Your workload is well-managed. This is a perfect time to review past material or get ahead on readings.`,
      `You're doing excellent, ${studentData.name}! With light workload ahead, consider helping classmates or exploring extra credit opportunities.`,
      `Awesome balance, ${studentData.name}! Use this lighter period to recharge and prepare for busier times ahead.`
    ];

    const randomTip = encouragements[Math.floor(Math.random() * encouragements.length)];

    await create({
      user_id: studentData._id,
      tip_text: randomTip,
      tip_type: 'study_tips',
      metadata: {
        load_score: 0,
        risk_level: 'safe',
        priority: 'low'
      }
    });

    return { tip: randomTip, priority: 'low' };
  }

  /**
   * Generate suggestions for professor
   */
  async generateProfessorSuggestion(courseData, classLoadData, conflicts) {
    try {
      const overloadedDays = classLoadData.filter(d => d.average_load >= 60);

      const prompt = professorSuggestionPrompt(
        courseData.name,
        overloadedDays,
        courseData.deadlines,
        conflicts
      );

      const completion = await chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant helping professors optimize course scheduling. Be professional and data-driven."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      });

      const suggestion = completion.choices[0].message.content;

      // Save suggestion
      await create({
        user_id: courseData.professor_id,
        tip_text: suggestion,
        tip_type: 'professor_suggestion',
        metadata: {
          course_id: courseData._id,
          affected_dates: overloadedDays.map(d => d.date),
          priority: overloadedDays.length > 3 ? 'high' : 'medium'
        }
      });

      return suggestion;

    } catch (error) {
      console.error('Error generating professor suggestion:', error);
      throw new Error('Failed to generate professor suggestion');
    }
  }

  /**
   * Get recent tips for a user
   */
  async getUserTips(userId, limit = 5) {
    return await find({
      user_id: userId,
      expires_at: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Mark tip as read
   */
  async markTipAsRead(tipId) {
    return await findByIdAndUpdate(
      tipId,
      { is_read: true },
      { new: true }
    );
  }
}

export default new AIService();