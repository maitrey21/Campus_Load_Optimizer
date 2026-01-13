// services/api.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

class APIService {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.refreshTokenTimeout = null;
    this.initializeAuth();
  }

  // ==========================================
  // Auth & Token Management
  // ==========================================

  getTokens() {
    return {
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refresh_token')
    };
  }

  saveTokens(token, refreshToken) {
    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('session'); // Cleanup session if stored
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  isTokenExpired(token) {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return exp - Date.now() < 5 * 60 * 1000; // < 5 mins
    } catch (error) {
      return true;
    }
  }

  async refreshAccessToken() {
    try {
      const { refreshToken } = this.getTokens();
      if (!refreshToken) throw new Error('No refresh token available');

      console.log('🔄 Refreshing access token...');
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error) throw error;
      if (!data.session) throw new Error('No session returned from refresh');

      this.saveTokens(data.session.access_token, data.session.refresh_token);
      this.scheduleTokenRefresh(data.session.access_token);
      console.log('✅ Token refreshed successfully');

      return data.session.access_token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.clearAuth();
      window.location.href = '/login';
      throw error;
    }
  }

  scheduleTokenRefresh(token) {
    if (this.refreshTokenTimeout) clearTimeout(this.refreshTokenTimeout);
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const refreshIn = (payload.exp * 1000) - Date.now() - (5 * 60 * 1000); // 5 mins before

      if (refreshIn > 0) {
        console.log(`⏱️ Token refresh scheduled in ${Math.round(refreshIn / 60000)} mins`);
        this.refreshTokenTimeout = setTimeout(() => this.refreshAccessToken(), refreshIn);
      } else {
        this.refreshAccessToken();
      }
    } catch (err) {
      console.error('Error scheduling refresh:', err);
    }
  }

  initializeAuth() {
    const { token } = this.getTokens();
    if (token) {
      if (this.isTokenExpired(token)) this.refreshAccessToken();
      else this.scheduleTokenRefresh(token);
    }
  }

  // ==========================================
  // HTTP Request Logic
  // ==========================================

  getHeaders(includeAuth = true, tokenOverride = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth) {
      const token = tokenOverride || localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      let { token } = this.getTokens();
      const includeAuth = options.auth !== false;

      // Proactive Refresh
      if (includeAuth && this.isTokenExpired(token)) {
        console.log('Token expired, refreshing before request...');
        token = await this.refreshAccessToken();
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(includeAuth, token),
          ...options.headers
        }
      });

      const data = await response.json();

      // Reactive Refresh (401)
      if (!response.ok) {
        if (response.status === 401 && includeAuth && !options._retry) {
          console.log('401 detected, attempting retry...');
          const newToken = await this.refreshAccessToken();
          return this.request(endpoint, { ...options, auth: true, _retry: true });
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  // ==========================================
  // API Endpoints
  // ==========================================

  async signup(email, password, name, role = 'student') {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password, name, role })
    });
    // If backend returns token immediately
    if (data.token) {
      this.saveTokens(data.token, data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.scheduleTokenRefresh(data.token);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password })
    });

    if (data.token) {
      this.saveTokens(data.token, data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.scheduleTokenRefresh(data.token);
    }
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearAuth();
  }

  // ... Existing Course/Deadline methods preserve their signatures ...

  async getCourses() { return this.request('/courses'); }
  async getCourse(userId) { return this.request(`/courses/user/${userId}`); }

  async createCourse(name, professorId, studentIds) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify({ name, professor_id: professorId, student_ids: studentIds })
    });
  }

  async getDeadlines() { return this.request('/deadlines'); }
  async getDeadlinesByUserId(userId) { return this.request(`/deadlines/user/${userId}`); }
  async getAssignments(userId) { return this.request(`/deadlines/assignments/user/${userId}`); }

  async createDeadline(title, courseId, deadlineDate, difficulty, type) {
    return this.request('/deadlines', {
      method: 'POST',
      body: JSON.stringify({ title, course_id: courseId, deadline_date: deadlineDate, difficulty, type })
    });
  }

  async updateDeadline(deadlineId, updates) {
    return this.request(`/deadlines/${deadlineId}`, { method: 'PUT', body: JSON.stringify(updates) });
  }

  async deleteDeadline(deadlineId) {
    return this.request(`/deadlines/${deadlineId}`, { method: 'DELETE' });
  }

  async getStudentLoad(studentId, days = 30) { return this.request(`/load/${studentId}?days=${days}`); }

  async getStudentTip(studentId) {
    return this.request('/ai/student-tip', { method: 'POST', body: JSON.stringify({ studentId }) });
  }

  async getProfessorSuggestion(courseId) {
    return this.request('/ai/professor-suggestion', { method: 'POST', body: JSON.stringify({ courseId }) });
  }

  async getUserTips(userId, limit = 5) { return this.request(`/ai/tips/${userId}?limit=${limit}`); }
  async getCourseConflicts(courseId) { return this.request(`/ai/conflicts/${courseId}`); }

  async markTipAsRead(tipId) {
    return this.request(`/ai/tips/${tipId}/read`, { method: 'PUT' });
  }

  async getAllUsers() { return this.request('/auth/users'); }
  async getUsersByRole(role) { return this.request(`/auth/users/role/${role}`); }
  async getAllCourses() { return this.request('/courses'); }
}

export default new APIService();
