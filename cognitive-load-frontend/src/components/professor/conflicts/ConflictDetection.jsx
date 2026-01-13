import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Users, Brain, Eye, Filter, Clock, BookOpen, Loader2 } from 'lucide-react';
import { professorService } from '../../../services/professorService';
import toast from 'react-hot-toast';

const ConflictDetection = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showTimeline, setShowTimeline] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchConflicts();
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
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchConflicts = async () => {
    try {
      const conflictsData = await professorService.getConflictDetection(selectedCourse);
      setConflicts(conflictsData || []);
    } catch (error) {
      console.log('Conflicts not available:', error.message);
      setConflicts([]);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'moderate': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'moderate': return '⚡';
      default: return 'ℹ️';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Assignment': return '📘';
      case 'Exam': return '📕';
      case 'Project': return '📗';
      case 'Quiz': return '📙';
      default: return '📄';
    }
  };

  const filteredConflicts = severityFilter === 'all'
    ? conflicts
    : conflicts.filter(c => c.severity === severityFilter);

  const selectedCourseData = courses.find(c => c._id === selectedCourse);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading conflict data...</p>
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
            Conflict Detection
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Identify and resolve deadline conflicts across courses
          </p>
        </div>
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span>{showTimeline ? 'Hide' : 'Show'} Timeline</span>
        </button>
      </motion.div>

      {/* Course Selection and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Select Course
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
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {course.name} ({course.student_ids?.length || 0})
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              Filter by Severity
            </h2>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="moderate">Moderate Only</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conflict Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Detected Conflicts ({filteredConflicts.length})
        </h2>

        {filteredConflicts.length === 0 ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              No Conflicts Detected
            </h3>
            <p className="text-green-600 dark:text-green-300">
              Great news! There are no deadline conflicts for {selectedCourseData?.name || 'this course'}.
            </p>
          </div>
        ) : (
          filteredConflicts.map((conflict, index) => (
            <motion.div
              key={conflict._id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`border-l-4 rounded-lg p-6 ${getSeverityColor(conflict.severity || 'moderate')}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getSeverityIcon(conflict.severity || 'moderate')}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Conflict on {new Date(conflict.date).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {conflict.severity || 'moderate'} severity conflict
                    </p>
                  </div>
                </div>
                {conflict.studentsAffected && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round((conflict.studentsAffected / conflict.totalStudents) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Students Affected</div>
                  </div>
                )}
              </div>

              {/* Deadlines involved */}
              {conflict.deadlines && conflict.deadlines.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                    Deadlines Involved
                  </h4>
                  <div className="space-y-2">
                    {conflict.deadlines.map((deadline, idx) => (
                      <div key={idx} className="flex items-center space-x-3 text-sm">
                        <span className="text-xl">{getTypeIcon(deadline.type)}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {deadline.title}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {deadline.course_id?.name || 'Unknown Course'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested dates */}
              {conflict.suggested_dates && conflict.suggested_dates.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    💡 Suggested Alternative Dates
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {conflict.suggested_dates.map((date, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                        {new Date(date).toLocaleDateString()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedConflict(conflict)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  <span>View AI Suggestions</span>
                </button>
                <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* AI Suggestions Modal */}
      {selectedConflict && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedConflict(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-500" />
              🤖 AI Conflict Resolution Suggestions
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Problem Analysis
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Multiple deadlines are scheduled on {new Date(selectedConflict.date).toLocaleDateString()},
                  which may cause high cognitive load for students.
                </p>
              </div>

              {selectedConflict.suggested_dates && selectedConflict.suggested_dates.length > 0 && (
                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <h5 className="font-medium text-green-900 dark:text-green-200 mb-2">
                    Recommended: Reschedule to Suggested Date
                  </h5>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>✓ Reduces student cognitive load</li>
                    <li>✓ Better distribution of deadlines</li>
                    <li>✓ Improved student performance potential</li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedConflict(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ConflictDetection;