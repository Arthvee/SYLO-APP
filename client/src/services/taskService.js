import api from './api';

/**
 * Task service wrapping Sylo task endpoints (FR-19 through FR-28)
 */
export const taskService = {
  /**
   * Fetch all tasks for a project (FR-20, AC-06)
   */
  getTasks: async (projectId, params = {}) => {
    const response = await api.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  /**
   * Create a new task within a project (Admin only, FR-19, FR-22, FR-24, AC-05)
   */
  createTask: async (projectId, taskData) => {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  /**
   * Get single task by ID
   */
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Update task details (Admin only, FR-21, FR-22, FR-28)
   */
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  /**
   * Delete task and trigger progress recalculation (Admin only, FR-21)
   */
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Update task status and trigger live project progress recalculation (Assignee or Admin, FR-26, FR-27, BR-10, AC-07)
   */
  updateTaskStatus: async (taskId, status) => {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },
};

export default taskService;
