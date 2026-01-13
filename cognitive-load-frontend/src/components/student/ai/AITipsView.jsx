import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, Clock, Target, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { loadCalculator } from '../../../utils/loadCalculator';

const AITipsView = () => {
  const { user } = useAuth();
  const [aiTips, setAiTips] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadAITips();
  }, [user]);

  const loadAITips = async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardData();
      setDashboardData(data);
      
      // Generate AI tips based on current data
      const tips = generateAITips(data);
      setAiTips(tips);
    } catch (error) {
      console.error('Error loading AI tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTips = async () => {
    setRefreshing(true);
    await loadAITips();
    setRefreshing(false);
  };

  // Helper to parse dates correctly
  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  };

  const generateAITips = (data) => {
    const tips = [];
    const assignments = data.assignments || [];
    const personalEvents = data.personalEvents || [];
    
    // Calculate load for next 7 days
    const weekLoad = loadCalculator.calculateWeekLoad(assignments, personalEvents, new Date());
    const peakDays = loadCalculator.findPeakLoadDays(weekLoad);
    const avgLoad = loadCalculator.calculateAverageLoad(weekLoad);

    // High Load Warning
    if (peakDays.length > 0) {
      tips.push({
        id: 'high-load-warning',
        type: 'workload',
        priority: 'high',
        title: 'High Cognitive Load Detected',
        message: `You have ${peakDays.length} high-stress day(s) coming up. Consider redistributing some tasks to maintain balance.`,
        icon: AlertCircle,
        color: 'red',
        actionable: true,
        suggestions: [
          'Break large assignments into smaller chunks',
          'Start working on upcoming deadlines early',
          'Consider asking for extensions if possible',
          'Schedule breaks between intensive tasks'
        ]
      });
    }

    // Optimal Study Time
    const currentHour = new Date().getHours();
    if (currentHour >= 14 && currentHour <= 16) {
      tips.push({
        id: 'optimal-study-time',
        type: 'schedule',
        priority: 'medium',
        title: 'Peak Productivity Window',
        message: 'You\'re in your optimal study window (2-4 PM). This is the perfect time for challenging tasks!',
        icon: Clock,
        color: 'green',
        actionable: true,
        suggestions: [
          'Focus on your most difficult assignment',
          'Tackle complex problem-solving tasks',
          'Review challenging concepts',
          'Minimize distractions during this time'
        ]
      });
    }

    // Deadline Proximity Warnings
    const urgentAssignments = assignments.filter(a => {
      const dueDate = parseLocalDate(a.deadline_date);
      if (!dueDate) return false;
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil <= 3 && daysUntil >= 0;
    });

    if (urgentAssignments.length > 0) {
      tips.push({
        id: 'urgent-deadlines',
        type: 'deadline',
        priority: 'high',
        title: 'Urgent Deadlines Approaching',
        message: `${urgentAssignments.length} assignment(s) due within 3 days. Time to prioritize!`,
        icon: Target,
        color: 'orange',
        actionable: true,
        assignments: urgentAssignments,
        suggestions: [
          'Create a detailed timeline for each assignment',
          'Focus on high-importance tasks first',
          'Eliminate non-essential activities',
          'Consider working in focused time blocks'
        ]
      });
    }

    // Study Pattern Analysis (backend doesn't track status, so we check past deadlines)
    const completedAssignments = assignments.filter(a => {
      const deadlineDate = parseLocalDate(a.deadline_date);
      if (!deadlineDate) return false;
      deadlineDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadlineDate < today;
    });
    if (completedAssignments.length >= 3) {
      tips.push({
        id: 'study-pattern',
        type: 'productivity',
        priority: 'low',
        title: 'Great Progress!',
        message: `You've completed ${completedAssignments.length} assignments. Your consistency is paying off!`,
        icon: TrendingUp,
        color: 'green',
        actionable: false,
        suggestions: [
          'Keep maintaining this momentum',
          'Reward yourself for the progress made',
          'Apply the same strategies to pending tasks',
          'Share your success strategies with peers'
        ]
      });
    }

    // Load Balance Recommendation
    if (avgLoad > 70) {
      tips.push({
        id: 'load-balance',
        type: 'workload',
        priority: 'medium',
        title: 'Consider Load Balancing',
        message: `Your average weekly load is ${avgLoad}/100. Consider spreading tasks more evenly.`,
        icon: Brain,
        color: 'yellow',
        actionable: true,
        suggestions: [
          'Start assignments earlier to avoid cramming',
          'Break study sessions into smaller chunks',
          'Schedule regular breaks and downtime',
          'Use the Pomodoro technique for better focus'
        ]
      });
    }

    // Study Technique Recommendations
    const highDifficultyAssignments = assignments.filter(a => {
      const deadlineDate = parseLocalDate(a.deadline_date);
      if (!deadlineDate) return false;
      deadlineDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return a.difficulty >= 4 && deadlineDate >= today; // difficulty is 1-5 scale
    });
    if (highDifficultyAssignments.length > 0) {
      tips.push({
        id: 'study-techniques',
        type: 'technique',
        priority: 'medium',
        title: 'Advanced Study Techniques Recommended',
        message: `You have ${highDifficultyAssignments.length} challenging assignment(s). Try these proven techniques.`,
        icon: Lightbulb,
        color: 'blue',
        actionable: true,
        suggestions: [
          'Use active recall and spaced repetition',
          'Create mind maps for complex topics',
          'Form study groups for difficult subjects',
          'Teach concepts to others to reinforce learning'
        ]
      });
    }

    // Motivational Tips
    if (tips.length === 0 || avgLoad < 40) {
      tips.push({
        id: 'motivation',
        type: 'motivation',
        priority: 'low',
        title: 'You\'re Doing Great!',
        message: 'Your workload is well-managed. This is a perfect time to get ahead or explore new learning opportunities.',
        icon: CheckCircle,
        color: 'green',
        actionable: true,
        suggestions: [
          'Start working on future assignments',
          'Explore additional learning resources',
          'Help classmates with their studies',
          'Take time for personal development'
        ]
      });
    }

    return tips.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getFilteredTips = () => {
    if (selectedCategory === 'all') return aiTips;
    return aiTips.filter(tip => tip.type === selectedCategory);
  };

  const getIconColor = (color) => {
    const colors = {
      red: 'text-red-500 bg-red-100',
      orange: 'text-orange-500 bg-orange-100',
      yellow: 'text-yellow-500 bg-yellow-100',
      green: 'text-green-500 bg-green-100',
      blue: 'text-blue-500 bg-blue-100',
      purple: 'text-purple-500 bg-purple-100'
    };
    return colors[color] || colors.blue;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return badges[priority] || badges.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredTips = getFilteredTips();
  const categories = [
    { key: 'all', label: 'All Tips', count: aiTips.length },
    { key: 'workload', label: 'Workload', count: aiTips.filter(t => t.type === 'workload').length },
    { key: 'schedule', label: 'Schedule', count: aiTips.filter(t => t.type === 'schedule').length },
    { key: 'deadline', label: 'Deadlines', count: aiTips.filter(t => t.type === 'deadline').length },
    { key: 'technique', label: 'Techniques', count: aiTips.filter(t => t.type === 'technique').length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Brain className="w-8 h-8 mr-3" />
              AI Study Assistant
            </h1>
            <p className="text-purple-100 mt-2">
              Personalized recommendations based on your cognitive load and study patterns
            </p>
          </div>
          
          <button
            onClick={refreshTips}
            disabled={refreshing}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Tips</span>
          </button>
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex flex-wrap gap-2">
          {categories.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Tips */}
      <div className="space-y-4">
        {filteredTips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center"
          >
            <Brain className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No tips available
            </h3>
            <p className="text-gray-500">
              {selectedCategory === 'all' 
                ? 'Check back later for personalized recommendations'
                : `No ${selectedCategory} tips available right now`
              }
            </p>
          </motion.div>
        ) : (
          filteredTips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${getIconColor(tip.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tip.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityBadge(tip.priority)}`}>
                        {tip.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {tip.message}
                    </p>
                    
                    {tip.assignments && tip.assignments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Urgent Assignments:
                        </h4>
                        <div className="space-y-1">
                          {tip.assignments.map(assignment => (
                            <div key={assignment._id} className="text-sm text-gray-600 dark:text-gray-400">
                              • {assignment.title} ({assignment.course_id?.name || 'Unknown Course'}) - Due {new Date(assignment.deadline_date).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {tip.suggestions && tip.suggestions.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                          <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                          Suggestions:
                        </h4>
                        <ul className="space-y-1">
                          {tip.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AITipsView;