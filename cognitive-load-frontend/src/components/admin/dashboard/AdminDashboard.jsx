import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, AlertTriangle, TrendingUp, Activity, Server, Database, Shield, Loader2, RefreshCw, Plus } from 'lucide-react';
import { adminService } from '../../../services/adminService';
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

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [professors, setProfessors] = useState([]);
  const [students, setStudents] = useState([]);
  const [newCourse, setNewCourse] = useState({
    name: '',
    professorId: '',
    studentIds: []
  });
  const [creatingCourse, setCreatingCourse] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardData();
      setDashboardData(data);
      setProfessors(data.professors || []);
      setStudents(data.students || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.professorId) {
      toast.error('Please fill in course name and select a professor');
      return;
    }

    try {
      setCreatingCourse(true);
      await adminService.createCourse(
        newCourse.name,
        newCourse.professorId,
        newCourse.studentIds
      );
      toast.success('Course created successfully!');
      setShowCreateCourse(false);
      setNewCourse({ name: '', professorId: '', studentIds: [] });
      loadDashboardData();
    } catch (error) {
      toast.error(error.message || 'Failed to create course');
    } finally {
      setCreatingCourse(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setNewCourse(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }));
  };

  const selectAllStudents = () => {
    setNewCourse(prev => ({
      ...prev,
      studentIds: students.map(s => s._id)
    }));
  };

  const clearStudentSelection = () => {
    setNewCourse(prev => ({
      ...prev,
      studentIds: []
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Students',
      value: dashboardData?.totalStudents?.toLocaleString() || '0',
      subtitle: 'Registered students',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Professors',
      value: dashboardData?.totalProfessors || '0',
      subtitle: 'Teaching staff',
      icon: BookOpen,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Courses',
      value: dashboardData?.totalCourses || '0',
      subtitle: 'Active courses',
      icon: Activity,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Enrolled',
      value: dashboardData?.totalEnrolled || '0',
      subtitle: 'Course enrollments',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            System overview and management
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Course</span>
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </motion.div>

      {/* Courses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
          All Courses ({dashboardData?.courses?.length || 0})
        </h2>

        {dashboardData?.courses?.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No courses yet. Click "Create Course" to add one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Course Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Professor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dashboardData?.courses?.map((course) => {
                  const professor = professors.find(p => String(p._id) === String(course.professor_id));
                  const studentCount = Array.isArray(course.student_ids) ? course.student_ids.length : 0;
                  return (
                    <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {course.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {professor?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {studentCount} student{studentCount !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Users Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professors List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-500" />
            Professors ({professors.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {professors.map((prof) => (
              <div key={prof._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm text-gray-800 dark:text-white">{prof.name}</span>
                <span className="text-xs text-gray-500">{prof.email}</span>
              </div>
            ))}
            {professors.length === 0 && (
              <p className="text-gray-500 text-center py-4">No professors registered</p>
            )}
          </div>
        </motion.div>

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" />
            Students ({students.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((student) => (
              <div key={student._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm text-gray-800 dark:text-white">{student.name}</span>
                <span className="text-xs text-gray-500">{student.email}</span>
              </div>
            ))}
            {students.length === 0 && (
              <p className="text-gray-500 text-center py-4">No students registered</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Create Course Modal */}
      {showCreateCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateCourse(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Create New Course
            </h3>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g., CS101 - Introduction to Programming"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Professor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign Professor *
                </label>
                {professors.length === 0 ? (
                  <p className="text-yellow-600 text-sm">No professors available. Register professors first.</p>
                ) : (
                  <select
                    value={newCourse.professorId}
                    onChange={(e) => setNewCourse({ ...newCourse, professorId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select a professor...</option>
                    {professors.map((prof) => (
                      <option key={prof._id} value={prof._id}>
                        {prof.name} ({prof.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Student Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enroll Students ({newCourse.studentIds.length} selected)
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={selectAllStudents}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearStudentSelection}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <p className="text-yellow-600 text-sm">No students available.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-1">
                    {students.map((student) => (
                      <label
                        key={student._id}
                        className={`flex items-center p-2 rounded cursor-pointer transition-colors ${newCourse.studentIds.includes(student._id)
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={newCourse.studentIds.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                          className="mr-3 h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-800 dark:text-white flex-1">
                          {student.name}
                        </span>
                        <span className="text-xs text-gray-500">{student.email}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={creatingCourse || !newCourse.name || !newCourse.professorId}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingCourse ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCourse(false)}
                  className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
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

export default AdminDashboard;