import React, { createContext, useContext, useState, useCallback } from 'react';
import projectService from '../services/projectService';
import taskService from '../services/taskService';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all user projects (owner or collaborator)
   */
  const fetchProjects = useCallback(async (params = {}) => {
    setIsLoadingProjects(true);
    setError(null);
    try {
      const response = await projectService.getProjects(params);
      if (response.success && response.data?.projects) {
        setProjects(response.data.projects);
        return response.data.projects;
      }
      return [];
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch projects';
      setError(message);
      throw err;
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  /**
   * Fetch complete project details and its child tasks
   */
  const fetchProjectDetails = useCallback(async (projectId) => {
    setIsLoadingDetails(true);
    setError(null);
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectService.getProject(projectId),
        taskService.getTasks(projectId),
      ]);

      if (projectRes.success && projectRes.data?.project) {
        setActiveProject(projectRes.data.project);
      }
      if (tasksRes.success && tasksRes.data?.tasks) {
        setTasks(tasksRes.data.tasks);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch project details';
      setError(message);
      throw err;
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  /**
   * Create a new project
   */
  const createProject = async (projectData) => {
    const response = await projectService.createProject(projectData);
    if (response.success && response.data) {
      const newProject = response.data;
      setProjects((prev) => [newProject, ...prev]);
      return newProject;
    }
    throw new Error(response.message || 'Failed to create project');
  };

  /**
   * Update project metadata (title, description, deadline)
   */
  const updateProject = async (projectId, projectData) => {
    const response = await projectService.updateProject(projectId, projectData);
    if (response.success && response.data?.project) {
      const updated = response.data.project;
      setActiveProject((prev) => (prev && (prev.id === projectId || prev._id === projectId) ? { ...prev, ...updated } : prev));
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId || p._id === projectId ? { ...p, ...updated } : p))
      );
      return updated;
    }
    throw new Error(response.message || 'Failed to update project');
  };

  /**
   * Delete project permanently and cascade child tasks
   */
  const deleteProject = async (projectId) => {
    await projectService.deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId && p._id !== projectId));
    if (activeProject && (activeProject.id === projectId || activeProject._id === projectId)) {
      setActiveProject(null);
      setTasks([]);
    }
  };

  /**
   * Add a registered collaborator by username
   */
  const addCollaborator = async (projectId, username) => {
    const response = await projectService.addCollaborator(projectId, username);
    if (response.success && response.data?.collaborator) {
      const newCollab = response.data.collaborator;
      setActiveProject((prev) => {
        if (!prev) return prev;
        const current = prev.collaborators || [];
        return {
          ...prev,
          collaborators: [...current, newCollab],
        };
      });
      return newCollab;
    }
    throw new Error(response.message || 'Failed to add collaborator');
  };

  /**
   * Remove a collaborator and unassign them from all tasks
   */
  const removeCollaborator = async (projectId, userId) => {
    await projectService.removeCollaborator(projectId, userId);
    setActiveProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        collaborators: (prev.collaborators || []).filter(
          (c) => (c.id || c._id || c).toString() !== userId.toString()
        ),
      };
    });
    // Atomic cascade unassignment from local tasks state
    setTasks((prev) =>
      prev.map((task) => ({
        ...task,
        assignees: (task.assignees || []).filter(
          (a) => (a.id || a._id || a).toString() !== userId.toString()
        ),
      }))
    );
  };

  /**
   * Collaborator leaves the project
   */
  const leaveProject = async (projectId) => {
    await projectService.leaveProject(projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId && p._id !== projectId));
    if (activeProject && (activeProject.id === projectId || activeProject._id === projectId)) {
      setActiveProject(null);
      setTasks([]);
    }
  };

  /**
   * Create a new task within a project
   */
  const createTask = async (projectId, taskData) => {
    const response = await taskService.createTask(projectId, taskData);
    if (response.success && response.data?.task) {
      const newTask = response.data.task;
      const metrics = response.data.projectMetrics;

      setTasks((prev) => [newTask, ...prev]);

      if (metrics) {
        syncProjectMetrics(projectId, metrics);
      }
      return newTask;
    }
    throw new Error(response.message || 'Failed to create task');
  };

  /**
   * Update task details (title, description, deadline, assignees)
   */
  const updateTask = async (taskId, taskData) => {
    const response = await taskService.updateTask(taskId, taskData);
    if (response.success && response.data?.task) {
      const updated = response.data.task;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId || t._id === taskId ? { ...t, ...updated } : t))
      );
      return updated;
    }
    throw new Error(response.message || 'Failed to update task');
  };

  /**
   * Delete a task and recalculate parent project progress
   */
  const deleteTask = async (taskId) => {
    const response = await taskService.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId && t._id !== taskId));

    if (response.data?.projectMetrics && activeProject) {
      syncProjectMetrics(activeProject.id || activeProject._id, response.data.projectMetrics);
    }
  };

  /**
   * Update task status (Kanban / Assignee mutation)
   * Recalculates parent project progress and derived status in local state
   */
  const updateTaskStatus = async (taskId, status) => {
    const response = await taskService.updateTaskStatus(taskId, status);
    if (response.success && response.data) {
      const { task: updatedTask, projectMetrics } = response.data;

      // Update task in local tasks state
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId || t._id === taskId) {
            return {
              ...t,
              status: updatedTask.status,
              isOverdue: updatedTask.isOverdue,
            };
          }
          return t;
        })
      );

      // Recalculate and synchronize parent project metrics in real time
      if (projectMetrics && activeProject) {
        syncProjectMetrics(activeProject.id || activeProject._id, projectMetrics);
      }

      return response.data;
    }
    throw new Error(response.message || 'Failed to update task status');
  };

  /**
   * Helper to sync calculated progress metrics across activeProject and projects collection
   */
  const syncProjectMetrics = (projectId, metrics) => {
    const { progress, status } = metrics;

    setActiveProject((prev) => {
      if (!prev || (prev.id !== projectId && prev._id !== projectId)) return prev;
      return {
        ...prev,
        progress,
        status,
        metrics: {
          ...(prev.metrics || {}),
          progress,
          status,
        },
      };
    });

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId || p._id === projectId) {
          return {
            ...p,
            progress,
            status,
          };
        }
        return p;
      })
    );
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        tasks,
        isLoadingProjects,
        isLoadingDetails,
        error,
        fetchProjects,
        fetchProjectDetails,
        createProject,
        updateProject,
        deleteProject,
        addCollaborator,
        removeCollaborator,
        leaveProject,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        setActiveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
