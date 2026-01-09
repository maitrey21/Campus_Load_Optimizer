import { Schema, model } from 'mongoose';

const aiTipSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tip_text: {
    type: String,
    required: true
  },
  tip_type: {
    type: String,
    enum: ['student_workload', 'professor_suggestion', 'conflict_warning', 'study_tips'],
    default: 'student_workload'
  },
  metadata: {
    load_score: Number,
    risk_level: String,
    course_id: Schema.Types.ObjectId,
    affected_dates: [Date],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  is_read: {
    type: Boolean,
    default: false
  },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});
aiTipSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default model('AiTip', aiTipSchema);