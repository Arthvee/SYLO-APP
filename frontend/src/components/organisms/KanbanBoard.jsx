import React from 'react';
import TaskCard from '../molecules/TaskCard';
import Skeleton from '../common/Skeleton';
import { useAuth } from '../../hooks/useAuth';

/**
 * KanbanBoard organism rendering 3 workflow status columns (To Do, In Progress, Completed).
 * Enforces role-based status move permissions (FR-27, BR-10).
 *
 * @param {Array} tasks
 * @param {object} project
 * @param {Function} onStatusChange - (taskId, newStatus) => Promise<void>
 * @param {Function} [onEditTask]
 * @param {Function} [onDeleteTask]
 * @param {boolean} [isLoading=false]
 */
export default function KanbanBoard({
  tasks = [],
  project,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  isLoading = false,
}) {
  const { user } = useAuth();

  const userId = (user?.id || user?._id)?.toString();
  const ownerId = project?.owner
    ? (typeof project.owner === 'object'
        ? project.owner.id || project.owner._id
        : project.owner
      )?.toString()
    : null;

  const isAdmin =
    Boolean(ownerId && userId && ownerId === userId) ||
    project?.role === 'Admin' ||
    project?.role === 'admin';

  const columns = [
    {
      title: 'To Do',
      status: 'To Do',
      icon: 'pending_actions',
      color: 'border-l-outline',
    },
    {
      title: 'In Progress',
      status: 'In Progress',
      icon: 'hourglass_top',
      color: 'border-l-primary',
    },
    {
      title: 'Completed',
      status: 'Completed',
      icon: 'check_circle',
      color: 'border-l-[#137333]',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface-container-low border border-surface-container p-4 min-h-[400px] space-y-3"
          >
            <Skeleton variant="text" width="50%" height="20px" className="mb-4" />
            <Skeleton variant="card" height="120px" count={3} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="rounded-2xl bg-surface-container-low border border-surface-container p-4 shadow-subtle min-h-[520px] flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg text-outline">
                  {col.icon}
                </span>
                <h3 className="text-sm font-bold text-on-surface">{col.title}</h3>
              </div>
              <span className="rounded-full bg-surface-container-lowest px-2 py-0.5 text-xs font-bold text-on-surface shadow-subtle">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Card List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-outline/30 text-xs text-outline">
                  No tasks in {col.title}
                </div>
              ) : (
                columnTasks.map((task) => {
                  const taskId = task.id || task._id;

                  // Check if user is allowed to mutate this task's status (FR-27)
                  const isAssignee =
                    Array.isArray(task.assignees) &&
                    task.assignees.some((a) => {
                      const aId = (typeof a === 'object' ? a.id || a._id : a)?.toString();
                      return aId === userId;
                    });

                  const canEditStatus = isAdmin || isAssignee;

                  return (
                    <TaskCard
                      key={taskId}
                      task={task}
                      canEditStatus={canEditStatus}
                      onStatusChange={onStatusChange}
                      onEdit={isAdmin ? onEditTask : undefined}
                      onDelete={isAdmin ? onDeleteTask : undefined}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
