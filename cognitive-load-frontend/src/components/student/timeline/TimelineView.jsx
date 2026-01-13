import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle, AlertTriangle, BookOpen, User, Check, X, Pause, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { dateUtils } from '../../../utils/dateUtils';
import { loadCalculator } from '../../../utils/loadCalculator';

const TimelineView = () => {
  const { user } = useAuth();
  const [timelineData, setTimelineData] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, assignments, events, completed
  const [showActionMenu, setShowActionMenu] = useState(null);

  useEffect(() => {
    loadTimelineData();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActionMenu && !event.target.closest('.action-menu')) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardData();
      setAssignments(data.assignments || []);
      setPersonalEvents(data.personalEvents || []);
      
      // Combine and sort timeline items
      const timeline = createTimelineItems(data.assignments || [], data.personalEvents || []);
      setTimelineData(timeline);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTimelineItems = (assignments, events) => {
    const items = [];
    
    // Add assignments
    assignments.forEach(assignment => {
      items.push({
        id: `assignment-${assignment._id}`,
        type: 'assignment',
        title: assignment.title,
        subtitle: assignment.course_id?.name || 'Unknown Course',
        date: assignment.deadline_date,
        status: assignment.status || 'pending',
        difficulty: assignment.difficulty,
        importance: assignment.importance,
        estimatedHours: assignment.estimatedHours,
        description: assignment.description,
        icon: BookOpen,
        color: getAssignmentColor(assignment.status || 'pending')
      });
    });

    // Add personal events
    events.forEach(event => {
      items.push({
        id: `event-${event.id}`,
        type: 'event',
        title: event.title,
        subtitle: `${event.duration}h event`,
        date: event.date,
        time: event.time,
        status: 'scheduled',
        eventType: event.type,
        icon: User,
        color: getEventColor(event.type)
      });
    });

    // Sort by date
    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getAssignmentColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'overdue': return 'red';
      case 'cancelled': return 'gray';
      case 'postponed': return 'orange';
      default: return 'orange';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'study': return 'purple';
      case 'interview': return 'blue';
      case 'personal': return 'green';
      default: return 'gray';
    }
  };

  const updateAssignmentStatus = (assignmentId, newStatus) => {
    const assignment = assignments.find(a => a.id === parseInt(assignmentId));
    
    setTimelineData(prev => 
      prev.map(item => 
        item.id === `assignment-${assignmentId}` 
          ? { ...item, status: newStatus }
          : item
      )
    );
    
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === parseInt(assignmentId) 
          ? { ...assignment, status: newStatus }
          : assignment
      )
    );
    
    setShowActionMenu(null);
    
    // Show success toast
    const statusMessages = {
      completed: '✅ Assignment marked as completed!',
      cancelled: '❌ Assignment cancelled',
      postponed: '⏸️ Assignment postponed',
      pending: '📋 Assignment marked as pending'
    };
    
    toast.success(statusMessages[newStatus] || 'Assignment status updated');
  };

  const getStatusActions = (item) => {
    if (item.type !== 'assignment') return [];
    
    const actions = [];
    
    if (item.status !== 'completed') {
      actions.push({
        label: 'Mark as Done',
        icon: Check,
        color: 'text-green-600 hover:bg-green-50',
        action: () => updateAssignmentStatus(item.id.replace('assignment-', ''), 'completed')
      });
    }
    
    if (item.status !== 'cancelled') {
      actions.push({
        label: 'Cancel',
        icon: X,
        color: 'text-red-600 hover:bg-red-50',
        action: () => updateAssignmentStatus(item.id.replace('assignment-', ''), 'cancelled')
      });
    }
    
    if (item.status !== 'postponed') {
      actions.push({
        label: 'Postpone',
        icon: Pause,
        color: 'text-orange-600 hover:bg-orange-50',
        action: () => updateAssignmentStatus(item.id.replace('assignment-', ''), 'postponed')
      });
    }
    
    if (item.status !== 'pending') {
      actions.push({
        label: 'Mark as Pending',
        icon: Clock,
        color: 'text-blue-600 hover:bg-blue-50',
        action: () => updateAssignmentStatus(item.id.replace('assignment-', ''), 'pending')
      });
    }
    
    return actions;
  };

  const getFilteredItems = () => {
    switch (filter) {
      case 'assignments':
        return timelineData.filter(item => item.type === 'assignment');
      case 'events':
        return timelineData.filter(item => item.type === 'event');
      case 'completed':
        return timelineData.filter(item => item.status === 'completed');
      default:
        return timelineData;
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-500 border-green-200 text-green-800',
      blue: 'bg-blue-500 border-blue-200 text-blue-800',
      red: 'bg-red-500 border-red-200 text-red-800',
      orange: 'bg-orange-500 border-orange-200 text-orange-800',
      purple: 'bg-purple-500 border-purple-200 text-purple-800',
      gray: 'bg-gray-500 border-gray-200 text-gray-800'
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-8 h-8 mr-3 text-blue-500" />
              Timeline View
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Chronological view of all your assignments and events
            </p>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: timelineData.length },
              { key: 'assignments', label: 'Assignments', count: timelineData.filter(i => i.type === 'assignment').length },
              { key: 'events', label: 'Events', count: timelineData.filter(i => i.type === 'event').length },
              { key: 'completed', label: 'Completed', count: timelineData.filter(i => i.status === 'completed').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No items found
            </h3>
            <p className="text-gray-500">
              {filter === 'all' ? 'No assignments or events to display' : `No ${filter} to display`}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="space-y-6">
              {filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isOverdue = new Date(item.date) < new Date() && item.status !== 'completed';
                const daysUntil = dateUtils.getDaysUntil(item.date);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-start"
                  >
                    {/* Timeline Dot */}
                    <div className={`
                      relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 
                      ${getColorClasses(item.color).split(' ')[0]} border-white dark:border-gray-800
                      shadow-lg
                    `}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Content Card */}
                    <div className="flex-1 ml-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            {item.status === 'completed' && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                            {isOverdue && (
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {item.subtitle}
                          </p>
                          {item.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              {item.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Date Info */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {dateUtils.formatDate(item.date, 'short')}
                          </div>
                          {item.time && (
                            <div className="text-xs text-gray-500">
                              {item.time}
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${
                            daysUntil < 0 ? 'text-red-500' : 
                            daysUntil === 0 ? 'text-orange-500' : 
                            daysUntil <= 3 ? 'text-yellow-600' : 'text-gray-500'
                          }`}>
                            {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                             daysUntil === 0 ? 'Due today' :
                             daysUntil === 1 ? 'Due tomorrow' :
                             `Due in ${daysUntil} days`}
                          </div>
                        </div>
                      </div>
                      
                      {/* Assignment Details */}
                      {item.type === 'assignment' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <span>Difficulty:</span>
                                <div className="flex">
                                  {'●'.repeat(Math.max(0, item.difficulty || 0))}
                                  {'○'.repeat(Math.max(0, 5 - (item.difficulty || 0)))}
                                </div>
                              </div>
                              <div>
                                Importance: {item.importance || 0}/10
                              </div>
                              <div>
                                Est. {item.estimatedHours || 0}h
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                item.status === 'postponed' ? 'bg-orange-100 text-orange-800' :
                                isOverdue ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status === 'completed' ? 'Completed' :
                                 item.status === 'in-progress' ? 'In Progress' :
                                 item.status === 'cancelled' ? 'Cancelled' :
                                 item.status === 'postponed' ? 'Postponed' :
                                 isOverdue ? 'Overdue' : 'Pending'}
                              </div>
                            </div>
                            
                            {/* Action Menu - Always visible for assignments */}
                            <div className="relative action-menu">
                              <button
                                onClick={() => setShowActionMenu(showActionMenu === item.id ? null : item.id)}
                                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
                                title="Assignment Actions"
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>
                              
                              {showActionMenu === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20 min-w-[160px]"
                                >
                                  {getStatusActions(item).map((action, actionIndex) => {
                                    const ActionIcon = action.icon;
                                    return (
                                      <button
                                        key={actionIndex}
                                        onClick={action.action}
                                        className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-3 ${action.color} transition-colors hover:bg-gray-50 dark:hover:bg-gray-700`}
                                      >
                                        <ActionIcon className="w-4 h-4" />
                                        <span>{action.label}</span>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Event Details */}
                      {item.type === 'event' && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="capitalize">
                            {item.eventType} event
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                            Scheduled
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TimelineView;