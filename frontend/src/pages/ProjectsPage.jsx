import React, { useEffect, useState } from 'react';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';
import ProjectCard from '../components/molecules/ProjectCard';
import ProjectModal from '../components/modals/ProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import { isOverdue } from '../utils/formatters';

export default function ProjectsPage() {
  const {
    projects,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    isLoadingProjects,
  } = useProject();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion confirm state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    project: null,
    isLoading: false,
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (project) => {
    setDeleteDialog({
      isOpen: true,
      project,
      isLoading: false,
    });
  };

  const handleSaveProject = async (formData) => {
    try {
      setIsSubmitting(true);
      if (editingProject) {
        const pId = editingProject.id || editingProject._id;
        await updateProject(pId, formData);
        showToast('Project updated successfully', 'success');
      } else {
        await createProject(formData);
        showToast('Project created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.project) return;
    const pId = deleteDialog.project.id || deleteDialog.project._id;

    try {
      setDeleteDialog((prev) => ({ ...prev, isLoading: true }));
      await deleteProject(pId);
      showToast('Project deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, project: null, isLoading: false });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete project';
      showToast(msg, 'error');
      setDeleteDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const overdue = isOverdue(project.deadline, project.status);
    let matchesStatus = true;

    if (statusFilter === 'Overdue') {
      matchesStatus = overdue;
    } else if (statusFilter !== 'ALL') {
      matchesStatus = project.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Browse and manage your shared workspaces and milestone deliverables.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon="add"
          onClick={handleOpenCreate}
          className="self-start sm:self-auto shrink-0"
        >
          New Project
        </Button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-3.5 border border-surface-container shadow-card">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search projects by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-surface-container-low pl-9 pr-4 py-2 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Active', 'Almost Done', 'Completed', 'Overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoadingProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton variant="text" width="40%" height="16px" />
                <Skeleton variant="text" width="20%" height="16px" />
              </div>
              <Skeleton variant="text" width="75%" height="20px" />
              <Skeleton variant="text" width="90%" height="12px" />
              <Skeleton variant="rect" height="8px" className="mt-4" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface-container-lowest border border-surface-container p-6">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">
            folder_off
          </span>
          <p className="text-sm font-semibold text-on-surface">No projects found</p>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">
            {projects.length === 0
              ? 'Get started by creating your very first workspace project.'
              : 'Try adjusting your search criteria or filter tags.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            icon="add"
            onClick={handleOpenCreate}
          >
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id || project._id}
              project={project}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Project Modal (Create / Edit) */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSaveProject}
        initialData={editingProject}
        isLoading={isSubmitting}
      />

      {/* Destructive Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, project: null, isLoading: false })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDialog.isLoading}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog.project?.title}"? All associated tasks, milestones, and collaborator records will be permanently removed (BR-03).`}
        confirmText="Delete Project"
      />
    </div>
  );
}
