import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';
import ProjectHeader from '../components/organisms/ProjectHeader';
import KanbanBoard from '../components/organisms/KanbanBoard';
import TaskModal from '../components/modals/TaskModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Skeleton from '../components/common/Skeleton';

export default function KanbanPage() {
  const { id } = useParams();
  const {
    activeProject,
    tasks,
    fetchProjectDetails,
    updateTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    isLoadingDetails,
  } = useProject();
  const { showToast } = useToast();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTaskDialog, setDeleteTaskDialog] = useState({
    isOpen: false,
    taskId: null,
    isLoading: false,
  });

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, fetchProjectDetails]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task moved to ${newStatus}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update task status';
      showToast(msg, 'error');
    }
  };

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

  const handleConfirmDeleteTask = async () => {
    if (!deleteTaskDialog.taskId) return;
    try {
      setDeleteTaskDialog((prev) => ({ ...prev, isLoading: true }));
      await deleteTask(deleteTaskDialog.taskId);
      showToast('Task deleted successfully', 'success');
      setDeleteTaskDialog({ isOpen: false, taskId: null, isLoading: false });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete task';
      showToast(msg, 'error');
      setDeleteTaskDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  if (isLoadingDetails && !activeProject) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton variant="card" height="180px" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton variant="card" height="400px" />
          <Skeleton variant="card" height="400px" />
          <Skeleton variant="card" height="400px" />
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="py-20 text-center rounded-2xl bg-surface-container-lowest border border-surface-container max-w-md mx-auto">
        <h2 className="text-base font-bold text-on-surface">Project not found</h2>
        <Link to="/projects" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
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
        <Link to={`/projects/${id}`} className="hover:text-primary transition-colors truncate max-w-xs">
          {activeProject.title}
        </Link>
        <span>/</span>
        <span className="font-semibold text-on-surface">Kanban</span>
      </div>

      {/* Project Overview Header Organism with activeTab="kanban" */}
      <ProjectHeader
        project={activeProject}
        activeTab="kanban"
        onOpenNewTask={handleOpenCreateTask}
      />

      {/* Kanban Board Organism */}
      <KanbanBoard
        tasks={tasks}
        project={activeProject}
        onStatusChange={handleStatusChange}
        onEditTask={handleOpenEditTask}
        onDeleteTask={(taskId) =>
          setDeleteTaskDialog({ isOpen: true, taskId, isLoading: false })
        }
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

      {/* Task Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteTaskDialog.isOpen}
        onClose={() => setDeleteTaskDialog({ isOpen: false, taskId: null, isLoading: false })}
        onConfirm={handleConfirmDeleteTask}
        isLoading={deleteTaskDialog.isLoading}
        title="Delete Task"
        message="Are you sure you want to delete this task? Parent project progress will be recalculated."
        confirmText="Delete Task"
      />
    </div>
  );
}
