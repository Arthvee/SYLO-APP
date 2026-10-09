import axiosClient from './axiosClient';

export const projectAPI = {
  getAll: () => axiosClient.get('/projects'),
  getById: (id) => axiosClient.get(`/projects/${id}`),
  create: (data) => axiosClient.post('/projects', data),
  update: (id, data) => axiosClient.put(`/projects/${id}`, data),
  delete: (id) => axiosClient.delete(`/projects/${id}`),
  addCollaborator: (id, username) => axiosClient.post(`/projects/${id}/add-collaborator`, { username }),
  removeCollaborator: (id, collaboratorId) => axiosClient.post(`/projects/${id}/remove-collaborator`, { collaboratorId }),
  leave: (id) => axiosClient.post(`/projects/${id}/leave`),
};

export const taskAPI = {
  getAll: (projectId) => axiosClient.get('/tasks', { params: projectId ? { projectId } : {} }),
  getById: (id) => axiosClient.get(`/tasks/${id}`),
  create: (data) => axiosClient.post('/tasks', data),
  update: (id, data) => axiosClient.put(`/tasks/${id}`, data),
  delete: (id) => axiosClient.delete(`/tasks/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/tasks/${id}/status`, { status }),
};

export const userAPI = {
  getProfile: () => axiosClient.get('/users/profile'),
  updateProfile: (data) => axiosClient.put('/users/profile', data),
  changePassword: (data) => axiosClient.post('/users/change-password', data),
};
