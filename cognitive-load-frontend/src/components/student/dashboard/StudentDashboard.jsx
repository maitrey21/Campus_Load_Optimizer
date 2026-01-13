import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import LoadingSpinner from '../../shared/LoadingSpinner';
import ErrorMessage from '../../shared/ErrorMessage';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('StudentDashboard mounted, user:', user);
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      setLoading(true);
      setError(null);
      
      const data = await studentService.getDashboardData();
      console.log('Dashboard data loaded:', data);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  console.log('Render state:', { loading, error, dashboardData: !!dashboardData, user: !!user });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" message="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage 
          message={error} 
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorMessage message="No dashboard data available" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Test Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name || 'Student'}!
        </h1>
        <div className="mt-4 text-sm">
          <p>User: {user?.email}</p>
          <p>Role: {user?.role}</p>
          <p>Assignments: {dashboardData.assignments?.length || 0}</p>
          <p>Upcoming Deadlines: {dashboardData.upcomingDeadlines?.length || 0}</p>
        </div>
      </motion.div>

      {/* Simple Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            📚 Assignments ({dashboardData.assignments?.length || 0})
          </h2>
          <div className="space-y-2">
            {dashboardData.assignments?.slice(0, 3).map((assignment) => (
              <div key={assignment._id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{assignment.title}</div>
                <div className="text-sm text-gray-600">
                  {assignment.course_id?.name || 'Unknown Course'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            🤖 AI Tips ({dashboardData.aiRecommendations?.length || 0})
          </h2>
          <div className="space-y-2">
            {dashboardData.aiRecommendations?.slice(0, 2).map((tip) => (
              <div key={tip._id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="font-medium text-blue-900 dark:text-blue-200">{tip.tip_type}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">{tip.tip_text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            📈 Progress ({dashboardData.studyProgress?.length || 0})
          </h2>
          <div className="space-y-2">
            {dashboardData.studyProgress?.slice(0, 2).map((progress, index) => (
              <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{progress.course}</div>
                <div className="text-sm text-gray-600">{progress.percentage}% complete</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;