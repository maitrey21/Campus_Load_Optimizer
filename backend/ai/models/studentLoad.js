import { Schema, model } from 'mongoose';

const studentLoadSchema = new Schema({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  load_score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  risk_level: {
    type: String,
    enum: ['safe', 'warning', 'danger'],
    required: true
  },
  deadlines_count: {
    type: Number,
    default: 0
  },
  deadlines: [{
    deadline_id: Schema.Types.ObjectId,
    title: String,
    course_name: String,
    days_until: Number,
    load_points: Number
  }]
}, {
  timestamps: true
});

studentLoadSchema.index({ student_id: 1, date: 1 }, { unique: true });

export default model('StudentLoad', studentLoadSchema);