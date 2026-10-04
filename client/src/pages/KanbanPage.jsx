import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useToast } from '../hooks/useToast';

export default function KanbanPage() {
  const { id } = useParams();
  const {
    activeProject,
    tasks,
    fetchProjectDetails,
    updateTaskStatus,
    isLoadingDetails,
  } = useProject();
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProjectDetails(id);
    }
  }, [id, fetchProjectDetails]);

  const handleMove = async (taskId, nextStatus) => {
    try {
      await updateTaskStatus(taskId, nextStatus);
      showToast(`Task moved to ${nextStatus}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to move task';
      showToast(msg, 'error');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-error-container text-on-error-container';
      case 'Medium':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'Low':
        return 'bg-tertiary-fixed text-on-tertiary-fixed';
      default:
        return 'bg-surface-container text-on-surface-variant';
    }
  };

  const columns = [
    { title: 'To Do', status: 'To Do', icon: 'pending_actions', color: 'border-l-outline' },
    { title: 'In Progress', status: 'In Progress', icon: 'hourglass_top', color: 'border-l-primary' },
    { title: 'Completed', status: 'Completed', icon: 'check_circle', color: 'border-l-[#137333]' },
  ];

  if (isLoadingDetails && !activeProject) {
    return (
      <div className="py-20 text-center text-sm text-on-surface-variant">
        Loading board...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
            <Link to="/projects" className="hover:text-primary transition-colors">
              Projects
            </Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-primary transition-colors">
              {activeProject?.title || 'Project'}
            </Link>
            <span>/</span>
            <span className="font-semibold text-on-surface">Kanban Board</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {activeProject?.title} - Board
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-subtle"
          >
            <span className="material-symbols-outlined text-base">table_rows</span>
            List View
          </Link>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);

          return (
            <div
              key={col.status}
              className="rounded-2xl bg-surface-container-low border border-surface-container p-4 shadow-subtle min-h-[500px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-outline">
                    {col.icon}
                  </span>
                  <h2 className="text-sm font-bold text-on-surface">{col.title}</h2>
                </div>
                <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-xs font-bold text-on-surface shadow-subtle">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-outline/30 text-xs text-outline">
                    No tasks here
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const taskId = task.id || task._id;
                    return (
                      <div
                        key={taskId}
                        className={`rounded-xl bg-surface-container-lowest p-4 border border-surface-container shadow-card hover:shadow-subtle transition-all border-l-4 ${col.color}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                          {task.deadline && (
                            <span className="text-[10px] text-outline flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-on-surface mb-1">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mb-3">
                            {task.description}
                          </p>
                        )}

                        {/* Column Transition Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-surface-container text-xs">
                          {col.status !== 'To Do' ? (
                            <button
                              onClick={() =>
                                handleMove(
                                  taskId,
                                  col.status === 'Completed' ? 'In Progress' : 'To Do'
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-outline hover:text-on-surface"
                              title="Move Backward"
                            >
                              <span className="material-symbols-outlined text-sm">arrow_back</span>
                              Prev
                            </button>
                          ) : (
                            <div />
                          )}

                          {col.status !== 'Completed' ? (
                            <button
                              onClick={() =>
                                handleMove(
                                  taskId,
                                  col.status === 'To Do' ? 'In Progress' : 'Completed'
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline ml-auto"
                              title="Move Forward"
                            >
                              Next
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          ) : (
                            <span className="material-symbols-outlined text-base text-[#137333] ml-auto">
                              done_all
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
