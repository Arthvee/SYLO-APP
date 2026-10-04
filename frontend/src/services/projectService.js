import api from './api';

/**
 * Project service wrapping Sylo /api/projects endpoints (FR-09 through FR-18)
 */
export const projectService = {
  /**
   * Fetch all projects where user is owner or collaborator (FR-11, FR-34)
   */
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  /**
   * Fetch single project details with populated members and metrics (FR-11, FR-20, AC-08)
   */
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  /**
   * Create a new project (FR-09, FR-10, BR-02, AC-03)
   */
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  /**
   * Update project details (Admin only, FR-12)
   */
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  /**
   * Delete project and cascade child tasks (Admin only, FR-13, BR-03)
   */
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  /**
   * Add a registered collaborator by username (Admin only, FR-14, BR-16, AC-04)
   */
  addCollaborator: async (id, username) => {
    const response = await api.post(`/projects/${id}/collaborators`, { username });
    return response.data;
  },

  /**
   * Remove a collaborator and atomically unassign from tasks (Admin only, FR-15, FR-16, BR-07, AC-10)
   */
  removeCollaborator: async (id, userId) => {
    const response = await api.delete(`/projects/${id}/collaborators/${userId}`);
    return response.data;
  },

  /**
   * Collaborator exits project without deleting project (FR-18, BR-04, AC-12)
   */
  leaveProject: async (id) => {
    const response = await api.post(`/projects/${id}/leave`);
    return response.data;
  },
};

export default projectService;
