import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { loadCalculator } from '../../../utils/loadCalculator';
import { dateUtils } from '../../../utils/dateUtils';

const CalendarView = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, user]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get assignments data
      const dashboardData = await studentService.getDashboardData();
      setAssignments(dashboardData.assignments || []);
      
      // Generate calendar data for the month
      const monthData = generateMonthCalendar(year, month, dashboardData.assignments || []);
      setCalendarData(monthData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse date as local date (not UTC)
  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('T')[0].split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateMonthCalendar = (year, month, assignments) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const calendar = [];
    const today = new Date();
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = currentDate.toDateString() === today.toDateString();
        const dateString = formatLocalDate(currentDate);
        
        // Calculate cognitive load for this day
        const loadScore = loadCalculator.calculateDayLoad(assignments, [], currentDate);
        
        // Get assignments due on this day - compare using local dates
        const dayAssignments = assignments.filter(a => {
          if (!a.deadline_date) return false;
          const assignmentDate = parseLocalDate(a.deadline_date);
          return assignmentDate && formatLocalDate(assignmentDate) === dateString;
        });
        
        weekDays.push({
          date: currentDate,
          dateString,
          day: currentDate.getDate(),
          isCurrentMonth,
          isToday,
          loadScore: loadScore.score,
          loadLevel: loadScore.level,
          assignments: dayAssignments
        });
      }
      calendar.push(weekDays);
      
      // Stop if we've covered the entire month and some of next month
      if (week > 3 && weekDays[0].date.getMonth() !== month) {
        break;
      }
    }
    
    return calendar;
  };

  const getLoadColor = (level, isCurrentMonth) => {
    if (!isCurrentMonth) return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600';
    
    switch (level) {
      case 'critical': return 'bg-red-500 text-white hover:bg-red-600';
      case 'high': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'moderate': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'low': return 'bg-green-500 text-white hover:bg-green-600';
      default: return 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Cognitive Load Calendar - Color-coded by stress level
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Today
            </button>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Load Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Load Levels:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">0-40: Low (Manageable)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">41-60: Moderate (Busy)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">61-80: High (Stressful)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">81-100: Critical (DANGER!)</span>
          </div>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center font-semibold text-gray-700 dark:text-gray-300 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-2">
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    relative h-24 p-2 rounded-lg cursor-pointer transition-all duration-200
                    ${getLoadColor(day.loadLevel, day.isCurrentMonth)}
                    ${day.isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                  `}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-medium ${
                        day.isCurrentMonth ? '' : 'opacity-50'
                      }`}>
                        {day.day}
                      </span>
                      {day.loadScore > 0 && day.isCurrentMonth && (
                        <span className="text-xs font-bold bg-black bg-opacity-20 px-1 rounded">
                          {day.loadScore}
                        </span>
                      )}
                    </div>
                    
                    {/* Assignment indicators */}
                    <div className="flex-1 flex flex-col justify-end">
                      {day.assignments.slice(0, 2).map((assignment, index) => (
                        <div
                          key={assignment._id}
                          className="text-xs bg-black bg-opacity-20 rounded px-1 mb-1 truncate"
                          title={assignment.title}
                        >
                          {assignment.title}
                        </div>
                      ))}
                      {day.assignments.length > 2 && (
                        <div className="text-xs bg-black bg-opacity-20 rounded px-1 text-center">
                          +{day.assignments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Selected Day Modal */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedDay(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedDay.date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDay.isToday ? 'Today' : dateUtils.getRelativeTime(selectedDay.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Load Score Display */}
            <div className={`p-4 rounded-lg mb-4 ${getLoadColor(selectedDay.loadLevel, true)}`}>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">
                  Load Score: {selectedDay.loadScore}
                </div>
                <div className="text-sm opacity-90 capitalize">
                  {selectedDay.loadLevel} Load
                  {selectedDay.loadLevel === 'critical' && ' - DANGER!'}
                  {selectedDay.loadLevel === 'high' && ' - Stressful'}
                  {selectedDay.loadLevel === 'moderate' && ' - Getting Busy'}
                  {selectedDay.loadLevel === 'low' && ' - Manageable'}
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Assignments Due ({selectedDay.assignments.length})
              </h4>
              
              {selectedDay.assignments.length > 0 ? (
                <div className="space-y-2">
                  {selectedDay.assignments.map((assignment) => (
                    <div key={assignment._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {assignment.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {assignment.course_id?.name || 'Unknown Course'} • {assignment.type}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Difficulty: {'●'.repeat(assignment.difficulty || 3)}{'○'.repeat(5-(assignment.difficulty || 3))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No assignments due on this day</p>
                  <p className="text-sm mt-1">Perfect day to get ahead or take a break!</p>
                </div>
              )}
            </div>

            {/* Load Breakdown */}
            {selectedDay.loadScore > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Load Breakdown
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• Base difficulty: {selectedDay.assignments.reduce((sum, a) => sum + a.difficulty, 0)} points</p>
                  <p>• Importance factor: {selectedDay.assignments.reduce((sum, a) => sum + a.importance, 0)} points</p>
                  <p>• Time pressure: Varies by deadline proximity</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Total cognitive load: {selectedDay.loadScore}/100
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setSelectedDay(null)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-1" />
                Add Event
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CalendarView;