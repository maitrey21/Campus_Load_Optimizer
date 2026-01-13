import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, AlertTriangle, TrendingUp, Clock, BookOpen, Plus, Edit, Trash2, Brain, Loader2 } from 'lucide-react';
import { professorService } from '../../../services/professorService';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    onClick={onClick}
    className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg cursor-pointer`}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm opacity-90 mt-1">{subtitle}</p>
      </div>
      <Icon className="w-12 h-12 opacity-80" />
    </div>
  </motion.div>
);

const ProfessorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [aiTips, setAiTips] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCreateDeadline, setShowCreateDeadline] = useState(false);
  const [showStudentsAtRisk, setShowStudentsAtRisk] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    type: 'Exam',
    deadline_date: '',
    difficulty: 3
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await professorService.getDashboardData();
      setCourses(data.courses || []);
      setDeadlines(data.deadlines || []);
      setAiTips(data.aiTips || []);
      setProfile(data.profile);
      if (data.courses && data.courses.length > 0) {
        setSelectedCourse(data.courses[0]._id);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeadline = async (e) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    try {
      await professorService.createDeadline(selectedCourse, newDeadline);
      toast.success('Deadline created successfully!');
      setShowCreateDeadline(false);
      setNewDeadline({ title: '', type: 'Exam', deadline_date: '', difficulty: 3 });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to create deadline');
    }
  };

  const handleDeleteDeadline = async (deadlineId) => {
    if (!window.confirm('Are you sure you want to delete this deadline?')) return;
    try {
      await professorService.deleteDeadline(deadlineId);
      toast.success('Deadline deleted successfully!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete deadline');
    }
  };

  // Calculate stats from real data
  const totalStudents = courses.reduce((sum, course) => sum + (course.student_ids?.length || 0), 0);
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingDeadlines = deadlines.filter(d => {
    const date = new Date(d.deadline_date);
    return date >= now && date <= nextWeek;
  });

  const stats = [
    {
      title: 'Active Courses',
      value: courses.length.toString(),
      subtitle: 'This semester',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      onClick: () => { }
    },
    {
      title: 'Total Students',
      value: totalStudents.toString(),
      subtitle: 'Across all courses',
      icon: Users,
      color: 'from-green-500 to-green-600',
      onClick: () => { }
    },
    {
      title: 'Upcoming Deadlines',
      value: upcomingDeadlines.length.toString(),
      subtitle: 'Next 7 days',
      icon: Calendar,
      color: 'from-yellow-500 to-yellow-600',
      onClick: () => { }
    },
    {
      title: 'AI Tips',
      value: aiTips.length.toString(),
      subtitle: 'Active recommendations',
      icon: Brain,
      color: 'from-purple-500 to-purple-600',
      onClick: () => { }
    }
  ];

  // Filter deadlines for selected course
  const courseDeadlines = deadlines.filter(d => {
    const courseId = d.course_id?._id || d.course_id;
    return courseId === selectedCourse;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome, {profile?.name || 'Professor'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Monitor student cognitive load and manage course deadlines
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </motion.div>

      {/* Course Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Course Selection
        </h2>
        {courses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No courses found. Create a course to get started.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => setSelectedCourse(course._id)}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedCourse === course._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {course.name} ({course.student_ids?.length || 0} students)
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadline Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Manage Deadlines
            </h2>
            <button
              onClick={() => setShowCreateDeadline(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Deadline</span>
            </button>
          </div>

          {courseDeadlines.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No deadlines for this course yet. Click "Add Deadline" to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {courseDeadlines.map((deadline) => (
                <div key={deadline._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {deadline.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {deadline.type} • Due: {new Date(deadline.deadline_date).toLocaleDateString()} •
                      Difficulty: {'●'.repeat(deadline.difficulty || 3)}{'○'.repeat(5 - (deadline.difficulty || 3))}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDeleteDeadline(deadline._id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* AI Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-500" />
            AI Recommendations
          </h2>

          {aiTips.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No AI tips available yet. Add some deadlines to get recommendations.
            </p>
          ) : (
            <div className="space-y-3">
              {aiTips.slice(0, 3).map((tip, index) => (
                <div key={tip._id || index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    {tip.tip_text || tip.content || tip.tip || 'AI recommendation available'}
                  </p>
                  {(tip.metadata?.priority || tip.priority) && (
                    <span className={`mt-2 inline-block px-2 py-1 rounded text-xs font-medium ${(tip.metadata?.priority || tip.priority) === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        (tip.metadata?.priority || tip.priority) === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                      {tip.metadata?.priority || tip.priority} priority
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Deadline Modal */}
      {showCreateDeadline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateDeadline(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Deadline
            </h3>

            <form onSubmit={handleCreateDeadline} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newDeadline.title}
                  onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                  placeholder="Mid-term Exam"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={newDeadline.type}
                  onChange={(e) => setNewDeadline({ ...newDeadline, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option>Exam</option>
                  <option>Assignment</option>
                  <option>Project</option>
                  <option>Quiz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newDeadline.deadline_date}
                  onChange={(e) => setNewDeadline({ ...newDeadline, deadline_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty (1-5): {newDeadline.difficulty}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newDeadline.difficulty}
                  onChange={(e) => setNewDeadline({ ...newDeadline, difficulty: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create Deadline
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateDeadline(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfessorDashboard;