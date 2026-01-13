import { motion } from 'framer-motion';
import { RefreshCw, User } from 'lucide-react';

const DashboardHeader = ({ user, todayLoad, onRefresh }) => {
  const getLoadBadgeColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 -translate-y-20"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 translate-y-16"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white rounded-full -translate-x-12 -translate-y-12"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
        {/* User Info */}
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
            </h1>
          </div>
        </div>

        {/* Today's Load & Actions */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-blue-100 text-sm mb-1">Today's Load</div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${getLoadBadgeColor(todayLoad.level)} text-white font-bold text-lg shadow-lg`}>
              {todayLoad.score}
            </div>
            <div className="text-blue-100 text-xs mt-1 capitalize">
              {todayLoad.level}
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm border border-white/20"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative z-10 mt-6 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20"
      >
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="font-semibold">AI Insight</h3>
            <p className="text-blue-100 text-sm">
              {todayLoad.level === 'critical' 
                ? "High stress day ahead! Consider rescheduling non-essential tasks."
                : todayLoad.level === 'high'
                ? "Busy day planned. Take breaks and stay hydrated."
                : todayLoad.level === 'moderate'
                ? "Manageable workload today. Good time to tackle challenging tasks."
                : "Light day ahead! Perfect for catching up or getting ahead."
              }
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHeader;