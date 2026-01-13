import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, Lightbulb, AlertTriangle } from 'lucide-react';

const AITipsPanel = ({ recommendations, loadData, deadlines }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate smart recommendations based on load data
  const generateSmartTips = () => {
    const tips = [];
    
    if (!loadData || loadData.length === 0) {
      return [{
        type: 'info',
        title: 'Welcome!',
        message: 'Add some deadlines to get personalized AI recommendations.',
        icon: '👋'
      }];
    }

    const highLoadDays = loadData.filter(day => day.score >= 70);
    const lowLoadDays = loadData.filter(day => day.score <= 40);
    const avgLoad = loadData.reduce((sum, day) => sum + day.score, 0) / loadData.length;

    // High load warning
    if (highLoadDays.length > 0) {
      tips.push({
        type: 'warning',
        title: 'High Load Alert',
        message: `You have ${highLoadDays.length} high-stress day${highLoadDays.length > 1 ? 's' : ''} coming up. Consider redistributing some tasks.`,
        icon: '⚠️'
      });
    }

    // Study schedule optimization
    if (lowLoadDays.length > 0 && deadlines && deadlines.length > 0) {
      tips.push({
        type: 'success',
        title: 'Optimal Study Time',
        message: `You have ${lowLoadDays.length} light day${lowLoadDays.length > 1 ? 's' : ''} perfect for getting ahead on upcoming deadlines.`,
        icon: '📚'
      });
    }

    // Load balance suggestion
    if (avgLoad > 60) {
      tips.push({
        type: 'info',
        title: 'Balance Recommendation',
        message: 'Your average load is high this week. Try to start assignments earlier to spread the workload.',
        icon: '⚖️'
      });
    }

    // Positive reinforcement
    if (avgLoad <= 40) {
      tips.push({
        type: 'success',
        title: 'Great Balance!',
        message: 'Your workload looks well-distributed. Keep up the excellent planning!',
        icon: '🎉'
      });
    }

    return tips.length > 0 ? tips : [{
      type: 'info',
      title: 'All Good!',
      message: 'Your workload looks manageable. Keep up the great work!',
      icon: '✨'
    }];
  };

  // Convert backend AI tips to display format
  const backendTips = (recommendations || []).map(tip => ({
    type: tip.tip_type === 'conflict_warning' ? 'warning' : 
          tip.metadata?.priority === 'high' ? 'warning' : 'info',
    title: tip.tip_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'AI Tip',
    message: tip.tip_text,
    icon: tip.tip_type === 'conflict_warning' ? '⚠️' : 
          tip.tip_type === 'study_tips' ? '📚' : 
          tip.tip_type === 'professor_suggestion' ? '👨‍🏫' : '🤖'
  }));

  const allTips = [...backendTips, ...generateSmartTips()];
  const displayTips = isExpanded ? allTips : allTips.slice(0, 2);

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning': return 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800';
      case 'critical': return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'success': return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      default: return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'success': return <Lightbulb className="w-4 h-4 text-green-600" />;
      default: return <Brain className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          🤖 AI Assistant
        </h3>
        {allTips.length > 2 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {displayTips.map((tip, index) => (
            <motion.div
              key={`${tip.title}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`p-4 rounded-xl border ${getTypeColor(tip.type)} relative overflow-hidden`}
            >
              {/* Background decoration */}
              <div className="absolute top-2 right-2 text-2xl opacity-20">
                {tip.icon}
              </div>
              
              <div className="relative z-10">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(tip.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {tip.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {tip.message}
                    </p>
                    {tip.suggestions && tip.suggestions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tip.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex items-start space-x-1">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {allTips.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>AI recommendations will appear here</p>
          <p className="text-sm">Add some deadlines to get started!</p>
        </div>
      )}
    </div>
  );
};

export default AITipsPanel;