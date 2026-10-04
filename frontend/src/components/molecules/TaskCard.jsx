import React from 'react';
import Badge from '../common/Badge';
import { AvatarGroup } from '../common/Avatar';
import { formatDate, isOverdue } from '../../utils/formatters';

/**
 * TaskCard molecule for Kanban boards and task collections.
 *
 * @param {object} task
 * @param {boolean} [canEditStatus=true] - Whether user has permission to change status
 * @param {Function} [onStatusChange]
 * @param {Function} [onEdit]
 * @param {Function} [onDelete]
 */
export default function TaskCard({
  task,
  canEditStatus = true,
  onStatusChange,
  onEdit,
  onDelete,
  className = '',
}) {
  if (!task) return null;

  const taskId = task.id || task._id;
  const taskOverdue = isOverdue(task.deadline, task.status);

  // Column transitions
  const handleMovePrev = (e) => {
    e.stopPropagation();
    if (!canEditStatus || !onStatusChange) return;
    const targetStatus = task.status === 'Completed' ? 'In Progress' : 'To Do';
    onStatusChange(taskId, targetStatus);
  };

  const handleMoveNext = (e) => {
    e.stopPropagation();
    if (!canEditStatus || !onStatusChange) return;
    const targetStatus = task.status === 'To Do' ? 'In Progress' : 'Completed';
    onStatusChange(taskId, targetStatus);
  };

  const borderAccent =
    task.status === 'Completed'
      ? 'border-l-4 border-l-[#137333]'
      : task.status === 'In Progress'
      ? 'border-l-4 border-l-primary'
      : 'border-l-4 border-l-outline';

  return (
    <div
      className={`
        rounded-xl bg-surface-container-lowest p-4 border border-surface-container shadow-card hover:shadow-subtle transition-all duration-150 group
        ${borderAccent}
        ${className}
      `}
    >
      {/* Top Header: Priority, Overdue & Admin Actions */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge priority={task.priority || 'Medium'} size="sm" />
          {taskOverdue && <Badge variant="Overdue" size="sm" />}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                title="Edit Task"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1 rounded text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                title="Delete Task"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Content */}
      <h4
        className={`text-xs font-bold text-on-surface mb-1 leading-snug ${
          task.status === 'Completed' ? 'line-through text-outline' : ''
        }`}
      >
        {task.title}
      </h4>

      {task.description && (
        <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Footer: Assignees & Deadline */}
      <div className="flex items-center justify-between pt-2.5 border-t border-surface-container text-xs">
        <div className="flex items-center gap-2">
          {task.assignees && task.assignees.length > 0 ? (
            <AvatarGroup users={task.assignees} max={3} size="xs" />
          ) : (
            <span className="text-[10px] text-outline italic">Unassigned</span>
          )}
        </div>

        {task.deadline && (
          <span
            className={`flex items-center gap-1 text-[11px] ${
              taskOverdue ? 'text-error font-semibold' : 'text-outline'
            }`}
            title={`Deadline: ${formatDate(task.deadline)}`}
          >
            <span className="material-symbols-outlined text-xs">
              {taskOverdue ? 'event_busy' : 'schedule'}
            </span>
            {formatDate(task.deadline)}
          </span>
        )}
      </div>

      {/* Transition Controls */}
      {onStatusChange && (
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-surface-container text-xs">
          {task.status !== 'To Do' ? (
            <button
              type="button"
              disabled={!canEditStatus}
              onClick={handleMovePrev}
              title={canEditStatus ? 'Move Backward' : 'Only assigned members can update status'}
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold transition-colors ${
                canEditStatus
                  ? 'text-outline hover:text-on-surface'
                  : 'text-outline/40 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Prev
            </button>
          ) : (
            <div />
          )}

          {task.status !== 'Completed' ? (
            <button
              type="button"
              disabled={!canEditStatus}
              onClick={handleMoveNext}
              title={canEditStatus ? 'Move Forward' : 'Only assigned members can update status'}
              className={`inline-flex items-center gap-0.5 text-[11px] font-semibold transition-colors ${
                canEditStatus
                  ? 'text-primary hover:underline'
                  : 'text-outline/40 cursor-not-allowed'
              }`}
            >
              Next
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <span className="material-symbols-outlined text-base text-[#137333] ml-auto">
              check_circle
            </span>
          )}
        </div>
      )}
    </div>
  );
}
