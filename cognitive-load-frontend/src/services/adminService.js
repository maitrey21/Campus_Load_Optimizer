import api from '../apis/api';

export const adminService = {
    // Get dashboard data
    async getDashboardData() {
        try {
            const [users, courses] = await Promise.all([
                api.getAllUsers(),
                api.getAllCourses()
            ]);

            const students = users.filter(u => u.role === 'student');
            const professors = users.filter(u => u.role === 'professor');

            // Calculate total students in courses
            const totalEnrolled = courses.reduce((sum, course) =>
                sum + (Array.isArray(course.student_ids) ? course.student_ids.length : 0), 0
            );

            return {
                totalUsers: users.length,
                totalStudents: students.length,
                totalProfessors: professors.length,
                totalCourses: courses.length,
                totalEnrolled,
                users,
                courses,
                students,
                professors
            };
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch dashboard data');
        }
    },

    // Get all users
    async getAllUsers() {
        try {
            return await api.getAllUsers();
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch users');
        }
    },

    // Get professors
    async getProfessors() {
        try {
            return await api.getUsersByRole('professor');
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch professors');
        }
    },

    // Get students
    async getStudents() {
        try {
            return await api.getUsersByRole('student');
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch students');
        }
    },

    // Get all courses
    async getCourses() {
        try {
            return await api.getAllCourses();
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch courses');
        }
    },

    // Create a new course
    async createCourse(name, professorId, studentIds) {
        try {
            return await api.createCourse(name, professorId, studentIds);
        } catch (error) {
            throw new Error(error.message || 'Failed to create course');
        }
    }
};
