import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, Calendar, Users, CheckCircle, AlertTriangle, RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { professorService } from '../../../services/professorService';

const AIRecommendations = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      generateRecommendations();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await professorService.getCourses();
      setCourses(coursesData || []);
      if (coursesData && coursesData.length > 0) {
        setSelectedCourse(coursesData[0]._id);
      }
    } catch (err) {
      toast.error('Failed to fetch courses');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!selectedCourse) return;

    try {
      setGenerating(true);
      setError(null);

      // Fetch AI recommendations from backend
      const data = await professorService.getAIRecommendations(selectedCourse);
      setAiData(data);

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error('AI recommendation error:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectedCourseData = courses.find(c => c._id === selectedCourse);
  const totalStudents = selectedCourseData?.student_ids?.length || 0;

  // Extract data from API response
  const suggestion = aiData?.suggestion || null;
  const classLoadData = aiData?.classLoadData || [];
  const conflicts = aiData?.conflicts || [];

  // Calculate average load from classLoadData
  const averageLoad = classLoadData.length > 0
    ? Math.round(classLoadData.reduce((sum, d) => sum + (d.average_load || 0), 0) / classLoadData.length)
    : 0;

  // Find peak load day
  const peakDay = classLoadData.length > 0
    ? classLoadData.reduce((max, d) => (d.average_load || 0) > (max.average_load || 0) ? d : max, classLoadData[0])
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading AI recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            🤖 AI Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Intelligent suggestions to optimize student cognitive load
          </p>
        </div>
        <button
          onClick={generateRecommendations}
          disabled={generating || !selectedCourse}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Analyzing...' : 'Generate New Analysis'}</span>
        </button>
      </motion.div>

      {/* Course Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Select Course for AI Analysis
        </h2>
        {courses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No courses available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => setSelectedCourse(course._id)}
                className={`px-4 py-2 rounded-lg transition-colors ${selectedCourse === course._id
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {course.name} ({course.student_ids?.length || 0} students)
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Loading State */}
      {generating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                🤖 AI is analyzing your course data...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Processing {totalStudents} students, deadline patterns, and workload distribution
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && !generating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                Failed to generate AI analysis
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              <button
                onClick={generateRecommendations}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Class Load Overview */}
      {!generating && classLoadData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            Class Load Overview (Next 14 Days)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageLoad}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Load</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {peakDay ? `${peakDay.average_load}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Peak Load</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{conflicts.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conflicts</div>
            </div>
          </div>

          {/* Load Timeline */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Daily Load Distribution
            </h3>
            {classLoadData.slice(0, 7).map((day, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-xs text-gray-600 dark:text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative overflow-hidden">
                  <div
                    className={`h-4 rounded-full transition-all ${day.average_load >= 80 ? 'bg-red-500' :
                        day.average_load >= 60 ? 'bg-orange-500' :
                          day.average_load >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    style={{ width: `${Math.min(100, day.average_load)}%` }}
                  />
                </div>
                <div className="w-12 text-xs text-gray-600 dark:text-gray-400">
                  {day.average_load}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Suggestion */}
      {!generating && suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-purple-500" />
            🧠 AI Analysis & Recommendations
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion, null, 2)}
            </p>
          </div>

          <div className="mt-4 flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-300">
            <Lightbulb className="w-4 h-4" />
            <span>This recommendation is generated based on your course's deadline patterns and student workload data.</span>
          </div>
        </motion.div>
      )}

      {/* Conflicts Section */}
      {!generating && conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Detected Deadline Conflicts ({conflicts.length})
          </h2>

          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Conflict on {new Date(conflict.date).toLocaleDateString()}
                    </h3>
                    {conflict.deadlines && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {conflict.deadlines.length} deadline(s) scheduled
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${conflict.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      conflict.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {conflict.severity || 'warning'}
                  </span>
                </div>

                {conflict.suggested_dates && conflict.suggested_dates.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      💡 Suggested alternative dates:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {conflict.suggested_dates.map((date, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
                        >
                          {new Date(date).toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Data State */}
      {!generating && !error && !suggestion && classLoadData.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            No Analysis Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {totalStudents === 0
              ? 'Add students to your course to get AI recommendations.'
              : 'Add some deadlines to your course to generate AI insights.'}
          </p>
          <button
            onClick={generateRecommendations}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Try Generating Analysis
          </button>
        </motion.div>
      )}

      {/* Success State with No Issues */}
      {!generating && !error && aiData && !suggestion && conflicts.length === 0 && classLoadData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            Great Job! Your Course is Well-Optimized
          </h3>
          <p className="text-green-600 dark:text-green-300">
            No deadline conflicts or high-risk periods detected. Students have a balanced workload.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AIRecommendations;