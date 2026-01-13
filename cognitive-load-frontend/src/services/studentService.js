import api from '../apis/api';
import { mockData, generateCalendarData } from './mockData';

/* =========================
   Helpers
========================= */
const isDemoUser = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('demo_token_');
};

const getDemoUser = () => {
  const demoUser = localStorage.getItem('demo_user');
  return demoUser ? JSON.parse(demoUser) : null;
};

const getCurrentUserId = () => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  const parsed = JSON.parse(user);
  return parsed.id || parsed._id;
};
/* =========================
   Student Service
========================= */

export const studentService = {
  /* -------------------------
     DASHBOARD
  ------------------------- */
  async getDashboardData() {
    /* ===== DEMO MODE ===== */
    if (isDemoUser()) {
      const user = getDemoUser();
      if (!user?.mockData) return null;

      await new Promise(r => setTimeout(r, 400));

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const twoWeeks = new Date(now.getTime() + 14 * 86400000);

      const assignments = user.mockData.assignments;

      return {
        profile: user.mockData.profile,
        courses: user.mockData.courses,
        assignments,
        upcomingDeadlines: assignments.filter(a =>
          new Date(a.dueDate) >= now &&
          new Date(a.dueDate) <= twoWeeks &&
          a.status !== 'completed'
        ),
        todayDeadlines: assignments.filter(
          a => a.dueDate === today && a.status !== 'completed'
        ),
        personalEvents: user.mockData.personalEvents,
        notifications: user.mockData.notifications,
        aiTips: user.mockData.aiTips,
        aiRecommendations: user.mockData.aiTips,
        studyProgress: user.mockData.studyProgress
      };
    }
    const userId = getCurrentUserId();
    if(!userId) throw new Error("Unauthenticated");
    
    /* ===== REAL API ===== */
    const [
      courses,
      assignments,
      loadResponse,
      aiTipsResponse
    ] = await Promise.all([
      api.getCourse(userId),
      api.getDeadlinesByUserId(userId),
      api.getStudentLoad(userId),
      api.getUserTips(userId)
    ]);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const twoWeeks = new Date(now.getTime() + 14 * 86400000);

    const upcomingDeadlines = assignments.filter(a =>
      new Date(a.deadline_date) >= now &&
      new Date(a.deadline_date) <= twoWeeks
    );

    const todayDeadlines = assignments.filter(
      a => a.deadline_date.split('T')[0] === today
    );

    const studyProgress = courses.map(course => {
      const courseAssignments = assignments.filter(a => {
        return a.course_id && (a.course_id._id === course._id || a.course_id === course._id);
      });
      const total = courseAssignments.length;

      return {
        course: course.name,
        courseId: course._id,
        completed: 0,
        total,
        percentage: total ? Math.round((0 / total) * 100) : 0
      };
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const aiTips = aiTipsResponse.tips || [];

    // Transform backend loadData to frontend format
    const transformedLoadData = (loadResponse.loadData || []).map(day => {
      const dayDate = new Date(day.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const isToday = dayDate.toDateString() === now.toDateString();
      
      // Map backend risk_level to frontend level
      let level = 'low';
      if (day.risk_level === 'danger') level = day.load_score >= 80 ? 'critical' : 'high';
      else if (day.risk_level === 'warning') level = 'moderate';
      else level = 'low';

      return {
        date: day.date,
        score: day.load_score,
        level: level,
        dayName: dayNames[dayDate.getDay()],
        isToday: isToday,
        deadlines_count: day.deadlines_count,
        deadlines: day.deadlines
      };
    });

    return {
      profile: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      courses,
      assignments,
      upcomingDeadlines,
      todayDeadlines,
      personalEvents: [],
      notifications: [],
      aiTips,
      aiRecommendations: aiTips,
      studyProgress,
      loadData: transformedLoadData,
      peakDays: loadResponse.peakDays || []
    };
  },

  /* -------------------------
     CALENDAR
  ------------------------- */
  async getCalendarData(year, month) {
    if (isDemoUser()) {
      const user = getDemoUser();
      await new Promise(r => setTimeout(r, 300));
      return generateCalendarData(year, month, user.mockData.assignments);
    }
    
    const userId = getCurrentUserId();
    if(!userId) throw new Error("Unauthenticated");
    
    const assignments = await api.getDeadlinesByUserId(userId);

    return assignments.filter(a => {
      const d = new Date(a.deadline_date);
      return d.getFullYear() === year && d.getMonth() === month - 1;
    });
  },

  /* -------------------------
     ASSIGNMENTS
  ------------------------- */
  async getAssignments() {
    if (isDemoUser()) {
      const user = getDemoUser();
      await new Promise(r => setTimeout(r, 300));
      return user.mockData.assignments;
    }
    
    const userId = getCurrentUserId();
    if(!userId) throw new Error("Unauthenticated");
    return api.getAssignments(userId);
  },

  /* -------------------------
     AI
  ------------------------- */
  async generateAITip() {
    const userId = getCurrentUserId();
    if(!userId) throw new Error("Unauthenticated");
    return api.getStudentTip(userId);
  },

  // async markNotificationRead(tipId) {
  //   return api.markTipAsRead(tipId);
  // }

  async addPersonalEvent(eventData) {
      // Simulate adding to mock data
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id: Date.now(),
        ...eventData,
        type: 'personal'
      };
    // try {
    //   const response = await api.post('/student/events', eventData);
    //   return response.data;
    // } catch (error) {
    //   throw new Error(error.response?.data?.message || 'Failed to add personal event');
    // }
  },

  async markNotificationRead(notificationId) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { success: true };
  
    // try {
    //   const response = await api.patch(`/student/notifications/${notificationId}/read`);
    //   return response.data;
    // } catch (error) {
    //   throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    // }
  }
};
