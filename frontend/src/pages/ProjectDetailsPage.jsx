import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';
import ProjectHeader from '../components/organisms/ProjectHeader';
import TaskTable from '../components/organisms/TaskTable';
import TaskModal from '../components/modals/TaskModal';
import ProjectModal from '../components/modals/ProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Skeleton from '../components/common/Skeleton';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeProject,
    tasks,
    fetchProjectDetails,
    updateProject,
    deleteProject,
    leaveProject,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    isLoadingDetails,
  } = useProject();
  const { showToast } = useToast();

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm dialogs
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // 'delete-project' | 'delete-task' | 'leave-project'
    targetId: null,
    isLoading: false,
  });

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, fetchProjectDetails]);

  // Task Actions
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      setIsSubmitting(true);
      if (editingTask) {
        const taskId = editingTask.id || editingTask._id;
        await updateTask(taskId, taskData);
        showToast('Task updated successfully', 'success');
      } else {
        await createTask(id, taskData);
        showToast('Task created successfully', 'success');
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task status moved to ${newStatus}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update task status';
      showToast(msg, 'error');
    }
  };

  // Project Actions
  const handleSaveProject = async (formData) => {
    try {
      setIsSubmitting(true);
      await updateProject(id, formData);
      showToast('Project updated successfully', 'success');
      setIsProjectModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update project';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Dialog Dispatcher
  const handleConfirmAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      if (confirmDialog.type === 'delete-project') {
        await deleteProject(id);
        showToast('Project deleted successfully', 'success');
        navigate('/projects');
      } else if (confirmDialog.type === 'delete-task' && confirmDialog.targetId) {
        await deleteTask(confirmDialog.targetId);
        showToast('Task deleted successfully', 'success');
      } else if (confirmDialog.type === 'leave-project') {
        await leaveProject(id);
        showToast('You have left the project', 'success');
        navigate('/projects');
      }
      setConfirmDialog({ isOpen: false, type: null, targetId: null, isLoading: false });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      showToast(msg, 'error');
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (isLoadingDetails && !activeProject) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="table-row" count={4} />
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="py-20 text-center rounded-2xl bg-surface-container-lowest border border-surface-container max-w-md mx-auto">
        <span className="material-symbols-outlined text-4xl text-outline mb-2">
          folder_off
        </span>
        <h2 className="text-base font-bold text-on-surface">Project not found</h2>
        <p className="text-xs text-on-surface-variant mt-1 mb-4">
          This project may have been deleted or you do not have permission to view it.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/projects" className="hover:text-primary transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="font-semibold text-on-surface truncate max-w-xs">
          {activeProject.title}
        </span>
      </div>

      {/* Project Overview Header Organism */}
      <ProjectHeader
        project={activeProject}
        activeTab="details"
        onOpenNewTask={handleOpenCreateTask}
        onOpenEditProject={() => setIsProjectModalOpen(true)}
        onOpenDeleteProject={() =>
          setConfirmDialog({
            isOpen: true,
            type: 'delete-project',
            targetId: id,
            isLoading: false,
          })
        }
        onOpenLeaveProject={() =>
          setConfirmDialog({
            isOpen: true,
            type: 'leave-project',
            targetId: id,
            isLoading: false,
          })
        }
      />

      {/* Task Table Organism */}
      <TaskTable
        tasks={tasks}
        project={activeProject}
        onStatusChange={handleStatusChange}
        onEditTask={handleOpenEditTask}
        onDeleteTask={(taskId) =>
          setConfirmDialog({
            isOpen: true,
            type: 'delete-task',
            targetId: taskId,
            isLoading: false,
          })
        }
        onOpenNewTask={handleOpenCreateTask}
        isLoading={isLoadingDetails}
      />

      {/* Task Modal (Create / Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        project={activeProject}
        initialData={editingTask}
        isLoading={isSubmitting}
      />

      {/* Project Modal (Edit) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleSaveProject}
        initialData={activeProject}
        isLoading={isSubmitting}
      />

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, type: null, targetId: null, isLoading: false })
        }
        onConfirm={handleConfirmAction}
        isLoading={confirmDialog.isLoading}
        title={
          confirmDialog.type === 'delete-project'
            ? 'Delete Project'
            : confirmDialog.type === 'delete-task'
            ? 'Delete Task'
            : 'Leave Project'
        }
        message={
          confirmDialog.type === 'delete-project'
            ? `Permanently delete "${activeProject.title}" and cascade delete all its tasks (BR-03)? This action cannot be undone.`
            : confirmDialog.type === 'delete-task'
            ? 'Are you sure you want to delete this task? Parent project progress will be recalculated.'
            : `Are you sure you want to leave ${activeProject.title}? You will lose access until re-invited.`
        }
        confirmText={
          confirmDialog.type === 'delete-project'
            ? 'Delete Project'
            : confirmDialog.type === 'delete-task'
            ? 'Delete Task'
            : 'Leave Project'
        }
      />
    </div>
  );
}
