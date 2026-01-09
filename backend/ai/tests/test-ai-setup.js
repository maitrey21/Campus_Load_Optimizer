import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import openai from '../config/openai.config.js';
import loadCalculator from '../services/loadcalculator.js';

async function testOpenAI() {
  console.log('🧪 Testing OpenAI connection...\n');
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ 
        role: "user", 
        content: "Say 'AI integration working!' in exactly 5 words." 
      }],
      max_tokens: 20
    });

    console.log('✅ OpenAI Response:', completion.choices[0].message.content);
    console.log('✅ OpenAI connection successful!\n');
    return true;

  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    return false;
  }
}

function testLoadCalculator() {
  console.log('🧪 Testing Load Calculator...\n');

  const sampleDeadlines = [
    {
      _id: '1',
      title: 'Math Homework',
      course_name: 'Calculus',
      deadline_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      difficulty: 3,
      type: 'assignment'
    },
    {
      _id: '2',
      title: 'Physics Exam',
      course_name: 'Physics',
      deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      difficulty: 5,
      type: 'exam'
    }
  ];

  const loadData = loadCalculator.calculateDailyLoad(sampleDeadlines, new Date());
  
  console.log('📊 Load Data:', JSON.stringify(loadData, null, 2));
  console.log('✅ Load Calculator working!\n');
}

async function runAllTests() {
  console.log('🚀 Starting AI Module Tests...\n');
  console.log('='.repeat(50) + '\n');

  const openaiOk = await testOpenAI();
  testLoadCalculator();

  console.log('='.repeat(50));
  console.log(openaiOk ? '✅ All tests passed!' : '⚠️  Some tests failed');
}

runAllTests();