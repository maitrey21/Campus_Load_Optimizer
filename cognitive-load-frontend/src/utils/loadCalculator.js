// Cognitive Load Calculator Utilities

/**
 * Parse date string as local date (not UTC)
 * Prevents timezone issues when backend sends dates
 */
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(num => parseInt(num, 10));
  return new Date(year, month - 1, day);
};

export const loadCalculator = {
  /**
   * Calculate cognitive load score for a specific date
   * @param {Array} assignments - Array of assignments
   * @param {Array} personalEvents - Array of personal events
   * @param {Date} targetDate - Date to calculate load for
   * @returns {Object} Load data with score and level
   */
  calculateDayLoad(assignments = [], personalEvents = [], targetDate) {
    const target = parseLocalDate(targetDate);
    target.setHours(0, 0, 0, 0);
    let totalLoad = 0;

    // Calculate assignment load
    assignments.forEach(assignment => {
      const dueDate = parseLocalDate(assignment.deadline_date);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate - target) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue >= 0 && daysUntilDue <= 14) {
        // Load increases as deadline approaches
        const urgencyFactor = Math.max(0.1, (14 - daysUntilDue) / 14);
        const difficultyWeight = (assignment.difficulty || 3) / 5; // difficulty is 1-5 scale
        
        // Type weights: exams > projects > assignments
        let typeWeight = 0.5;
        if (assignment.type === 'exam') typeWeight = 1.0;
        else if (assignment.type === 'project') typeWeight = 0.8;
        else if (assignment.type === 'assignment') typeWeight = 0.5;
        
        const assignmentLoad = urgencyFactor * difficultyWeight * typeWeight * 100;
        totalLoad += assignmentLoad;
      }
    });

    // Add personal events load (lighter impact)
    personalEvents.forEach(event => {
      const eventDate = parseLocalDate(event.date);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate.getTime() === target.getTime()) {
        totalLoad += (event.duration || 1) * 5; // 5 points per hour
      }
    });

    const score = Math.min(100, Math.round(totalLoad));
    const level = this.getLoadLevel(score);

    return { score, level, date: target.toISOString().split('T')[0] };
  },

  /**
   * Calculate load for multiple days
   * @param {Array} assignments - Array of assignments
   * @param {Array} personalEvents - Array of personal events
   * @param {Date} startDate - Start date
   * @param {number} days - Number of days to calculate
   * @returns {Array} Array of load data for each day
   */
  calculateWeekLoad(assignments = [], personalEvents = [], startDate, days = 7) {
    const loadData = [];
    const start = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const dayLoad = this.calculateDayLoad(assignments, personalEvents, currentDate);
      loadData.push(dayLoad);
    }

    return loadData;
  },

  /**
   * Calculate average load from load data array
   * @param {Array} loadData - Array of load objects
   * @returns {number} Average load score
   */
  calculateAverageLoad(loadData = []) {
    if (loadData.length === 0) return 0;
    
    const totalScore = loadData.reduce((sum, day) => sum + day.score, 0);
    return Math.round(totalScore / loadData.length);
  },

  /**
   * Find peak load days (above 70)
   * @param {Array} loadData - Array of load objects
   * @returns {Array} Array of high load days
   */
  findPeakLoadDays(loadData = []) {
    return loadData.filter(day => day.score >= 70);
  },

  /**
   * Get load level based on score
   * @param {number} score - Load score (0-100)
   * @returns {string} Load level
   */
  getLoadLevel(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  },

  /**
   * Get color for load level
   * @param {string} level - Load level
   * @returns {string} CSS color class
   */
  getLoadColor(level) {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  },

  /**
   * Get text color for load level
   * @param {string} level - Load level
   * @returns {string} CSS text color class
   */
  getLoadTextColor(level) {
    switch (level) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'moderate': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  },

  /**
   * Suggest optimal study times based on load data
   * @param {Array} loadData - Array of load objects
   * @returns {Array} Array of suggested study periods
   */
  suggestStudyTimes(loadData = []) {
    const suggestions = [];
    
    loadData.forEach((day, index) => {
      if (day.score <= 50) {
        suggestions.push({
          date: day.date,
          reason: 'Low cognitive load - good for intensive study',
          priority: 'high'
        });
      } else if (day.score <= 70 && index < loadData.length - 1) {
        const nextDay = loadData[index + 1];
        if (nextDay && nextDay.score >= 80) {
          suggestions.push({
            date: day.date,
            reason: 'Prepare for high-load day tomorrow',
            priority: 'medium'
          });
        }
      }
    });

    return suggestions;
  }
};