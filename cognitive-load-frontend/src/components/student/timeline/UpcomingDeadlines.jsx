import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { dateUtils } from '../../../utils/dateUtils';

const UpcomingDeadlines = ({ deadlines, loadData }) => {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'overdue': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'today': return 'border-red-400 bg-red-50 dark:bg-red-900/20';
      case 'tomorrow': return 'border-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'urgent': return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'soon': return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-700/20';
    }
  };

  const getDifficultyStars = (difficulty) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          📋 Next 7 Days
        </h3>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {deadlines && deadlines.length > 0 ? (
          deadlines.slice(0, 10).map((deadline, index) => {
            const urgency = dateUtils.getUrgencyLevel(deadline.deadline_date);
            const daysUntil = dateUtils.getDaysUntilDeadline(deadline.deadline_date);
            
            return (
              <motion.div
                key={deadline._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`p-4 rounded-xl border-l-4 ${getUrgencyColor(urgency)} hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {deadline.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{deadline.course_id?.name || 'Unknown Course'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateUtils.getRelativeDate(deadline.deadline_date)}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {deadline.type} • {getDifficultyStars(deadline.difficulty || 3)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        urgency === 'overdue' || urgency === 'today' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        urgency === 'tomorrow' || urgency === 'urgent' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {daysUntil === 0 ? 'Today' : 
                         daysUntil === 1 ? 'Tomorrow' :
                         daysUntil < 0 ? 'Overdue' :
                         `${daysUntil} days`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming deadlines</p>
            <p className="text-sm">Enjoy your free time! 🎉</p>
          </div>
        )}
      </div>

      {deadlines && deadlines.length > 10 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all {deadlines.length} deadlines
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingDeadlines;