import api from '../apis/api';

const getCurrentUserId = () => {
  const user = localStorage.getItem('user');
  if (!user) return null;
  const parsed = JSON.parse(user);
  return parsed.id || parsed._id;
};

export const professorService = {
  async getDashboardData() {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Unauthenticated');

      const [courses, aiTips] = await Promise.all([
        api.getCourse(userId),
        api.getUserTips(userId)
      ]);

      // Get deadlines for all professor's courses
      const allDeadlines = await api.getDeadlinesByUserId(userId);

      const user = JSON.parse(localStorage.getItem('user'));

      return {
        profile: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        courses,
        deadlines: allDeadlines,
        aiTips: aiTips.tips || []
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch dashboard data');
    }
  },

  async getCourses() {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Unauthenticated');
      return await api.getCourse(userId);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch courses');
    }
  },

  async getDeadlines(courseId) {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Unauthenticated');
      const allDeadlines = await api.getDeadlinesByUserId(userId);

      // Filter deadlines for specific course
      return allDeadlines.filter(d => {
        return d.course_id && (d.course_id._id === courseId || d.course_id === courseId);
      });
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch deadlines');
    }
  },

  async createDeadline(courseId, deadlineData) {
    try {
      const response = await api.createDeadline(
        deadlineData.title,
        courseId,
        deadlineData.deadline_date,
        deadlineData.difficulty,
        deadlineData.type
      );
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to create deadline');
    }
  },

  async updateDeadline(deadlineId, deadlineData) {
    try {
      const response = await api.updateDeadline(deadlineId, deadlineData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update deadline');
    }
  },

  async deleteDeadline(deadlineId) {
    try {
      const response = await api.deleteDeadline(deadlineId);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete deadline');
    }
  },

  async getClassLoadOverview(courseId) {
    try {
      // Get AI suggestion which contains classLoadData
      const response = await api.getProfessorSuggestion(courseId);
      return {
        classLoadData: response.classLoadData || [],
        conflicts: response.conflicts || []
      };
    } catch (error) {
      console.error('Failed to fetch class load overview:', error);
      return { classLoadData: [], conflicts: [] };
    }
  },

  async getStudentsAtRisk(courseId) {
    try {
      // This would need a specific backend endpoint
      // For now, returning empty array
      return [];
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch students at risk');
    }
  },

  async getConflictDetection(courseId) {
    try {
      const response = await api.getCourseConflicts(courseId);
      return response.conflicts || [];
    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
      return [];
    }
  },

  async getAIRecommendations(courseId) {
    try {
      // Returns the full response containing suggestion, classLoadData, and conflicts
      const response = await api.getProfessorSuggestion(courseId);
      return {
        suggestion: response.suggestion || null,
        classLoadData: response.classLoadData || [],
        conflicts: response.conflicts || [],
        success: response.success || false
      };
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      return {
        suggestion: null,
        classLoadData: [],
        conflicts: [],
        success: false,
        error: error.message
      };
    }
  },

  async applyAISuggestion(courseId, suggestionId, action) {
    try {
      // Backend doesn't have this endpoint yet
      // This would need to be implemented
      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Failed to apply AI suggestion');
    }
  },

  async getAlternativeDates(courseId, deadlineId) {
    try {
      // This information comes from conflict detection
      const conflictsResponse = await api.getCourseConflicts(courseId);
      const conflicts = conflictsResponse.conflicts || [];

      const relevantConflict = conflicts.find(c =>
        c.deadlines && c.deadlines.some(d => d._id === deadlineId)
      );

      return relevantConflict?.suggested_dates || [];
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch alternative dates');
    }
  }
};