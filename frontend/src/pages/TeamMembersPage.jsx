import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';
import ProjectHeader from '../components/organisms/ProjectHeader';
import CollaboratorManager from '../components/organisms/CollaboratorManager';
import Skeleton from '../components/common/Skeleton';

export default function TeamMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    activeProject,
    fetchProjectDetails,
    addCollaborator,
    removeCollaborator,
    leaveProject,
    isLoadingDetails,
  } = useProject();
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, fetchProjectDetails]);

  const handleAddCollaborator = async (username) => {
    try {
      await addCollaborator(id, username);
      showToast(`Added @${username} to project`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add collaborator';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await removeCollaborator(id, userId);
      showToast('Collaborator removed from project', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove collaborator';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleLeaveProject = async () => {
    try {
      await leaveProject(id);
      showToast('You have left the project', 'success');
      navigate('/projects');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to leave project';
      showToast(msg, 'error');
      throw err;
    }
  };

  if (isLoadingDetails && !activeProject) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="card" height="300px" />
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
        <span className="font-semibold text-on-surface">Members</span>
      </div>

      {/* Project Header Organism with activeTab="members" */}
      <ProjectHeader
        project={activeProject}
        activeTab="members"
        onOpenLeaveProject={handleLeaveProject}
      />

      {/* Collaborator Manager Organism */}
      <CollaboratorManager
        project={activeProject}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        onLeaveProject={handleLeaveProject}
        isLoading={isLoadingDetails}
      />
    </div>
  );
}
