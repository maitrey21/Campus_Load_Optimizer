import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Trash2, Check, Filter } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { dateUtils } from '../../../utils/dateUtils';

const NotificationsView = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, warnings, info, success
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await studentService.getDashboardData();
      
      // Get notifications and add some generated ones
      const baseNotifications = data.notifications || [];
      const generatedNotifications = generateSystemNotifications(data);
      
      const allNotifications = [...baseNotifications, ...generatedNotifications]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSystemNotifications = (data) => {
    const generated = [];
    const assignments = data.assignments || [];
    const now = new Date();

    // Helper to parse dates correctly
    const parseLocalDate = (dateString) => {
      if (!dateString) return null;
      const datePart = dateString.split('T')[0];
      const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
      return new Date(year, month - 1, day);
    };

    // Generate deadline reminders
    assignments.forEach(assignment => {
      const dueDate = parseLocalDate(assignment.deadline_date);
      if (!dueDate) return;
      
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil === 1) {
        generated.push({
          id: `deadline-${assignment._id}`,
          type: 'warning',
          title: 'Assignment Due Tomorrow',
          message: `${assignment.title} (${assignment.course_id?.name || 'Unknown Course'}) is due tomorrow. Make sure you're ready!`,
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          read: false,
          category: 'deadline',
          assignmentId: assignment._id
        });
      } else if (daysUntil === 3) {
        generated.push({
          id: `reminder-${assignment._id}`,
          type: 'info',
          title: '3-Day Deadline Reminder',
          message: `${assignment.title} (${assignment.course_id?.name || 'Unknown Course'}) is due in 3 days. Time to finalize your work!`,
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          read: Math.random() > 0.5,
          category: 'deadline',
          assignmentId: assignment._id
        });
      } else if (daysUntil <= 0 && daysUntil > -7) {
        generated.push({
          id: `overdue-${assignment._id}`,
          type: 'error',
          title: 'Assignment Overdue',
          message: `${assignment.title} (${assignment.course_id?.name || 'Unknown Course'}) was due ${Math.abs(daysUntil)} day(s) ago. Contact your professor if needed.`,
          timestamp: new Date(dueDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          read: false,
          category: 'overdue',
          assignmentId: assignment._id
        });
      }
    });

    // Generate load warnings
    const highLoadDays = data.weekLoad?.filter(day => day.score >= 80) || [];
    if (highLoadDays.length > 0) {
      generated.push({
        id: 'high-load-warning',
        type: 'warning',
        title: 'High Cognitive Load Alert',
        message: `You have ${highLoadDays.length} day(s) with critically high cognitive load this week. Consider redistributing tasks.`,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        read: false,
        category: 'load'
      });
    }

    // Generate study reminders
    const inProgressAssignments = assignments.filter(a => a.status === 'in-progress');
    if (inProgressAssignments.length > 0) {
      generated.push({
        id: 'study-reminder',
        type: 'info',
        title: 'Study Session Reminder',
        message: `You have ${inProgressAssignments.length} assignment(s) in progress. Keep up the momentum!`,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: Math.random() > 0.3,
        category: 'study'
      });
    }

    return generated;
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'warnings':
        return notifications.filter(n => n.type === 'warning' || n.type === 'error');
      case 'info':
        return notifications.filter(n => n.type === 'info');
      case 'success':
        return notifications.filter(n => n.type === 'success');
      default:
        return notifications;
    }
  };

  const markAsRead = (notificationIds) => {
    setNotifications(prev => 
      prev.map(notification => 
        notificationIds.includes(notification.id) 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotifications = (notificationIds) => {
    setNotifications(prev => 
      prev.filter(notification => !notificationIds.includes(notification.id))
    );
    setSelectedNotifications([]);
  };

  const toggleSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAll = () => {
    const filteredIds = getFilteredNotifications().map(n => n.id);
    setSelectedNotifications(filteredIds);
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
      case 'error':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      case 'info':
      default:
        return Info;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-500 bg-red-100';
      case 'warning':
        return 'text-orange-500 bg-orange-100';
      case 'success':
        return 'text-green-500 bg-green-100';
      case 'info':
      default:
        return 'text-blue-500 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

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
              <Bell className="w-8 h-8 mr-3 text-blue-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Stay updated with your assignments, deadlines, and system alerts
            </p>
          </div>
          
          <div className="flex space-x-2">
            {selectedNotifications.length > 0 && (
              <>
                <button
                  onClick={() => markAsRead(selectedNotifications)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Read</span>
                </button>
                <button
                  onClick={() => deleteNotifications(selectedNotifications)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Mark All Read
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'warnings', label: 'Warnings', count: notifications.filter(n => n.type === 'warning' || n.type === 'error').length },
              { key: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length },
              { key: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length }
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
          
          <div className="flex items-center space-x-2">
            {filteredNotifications.length > 0 && (
              <>
                <button
                  onClick={selectedNotifications.length === filteredNotifications.length ? clearSelection : selectAll}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  {selectedNotifications.length === filteredNotifications.length ? 'Clear Selection' : 'Select All'}
                </button>
                <span className="text-sm text-gray-500">
                  {selectedNotifications.length} selected
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center"
          >
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'You\'re all caught up! No notifications to display.'
                : `No ${filter} notifications to display.`
              }
            </p>
          </motion.div>
        ) : (
          filteredNotifications.map((notification, index) => {
            const Icon = getNotificationIcon(notification.type);
            const isSelected = selectedNotifications.includes(notification.id);
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                } ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
                onClick={() => toggleSelection(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(notification.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        notification.read 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                        {!notification.read && (
                          <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{dateUtils.getRelativeTime(notification.timestamp)}</span>
                      </div>
                    </div>
                    
                    <p className={`text-sm ${
                      notification.read 
                        ? 'text-gray-500 dark:text-gray-500' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {notification.category && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          {notification.category}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead([notification.id]);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotifications([notification.id]);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default NotificationsView;