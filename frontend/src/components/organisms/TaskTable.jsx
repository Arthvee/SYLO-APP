import React, { useState } from 'react';
import Badge from '../common/Badge';
import { AvatarGroup } from '../common/Avatar';
import Skeleton from '../common/Skeleton';
import ProjectAdminGuard from '../guards/ProjectAdminGuard';
import TaskAssigneeGuard from '../guards/TaskAssigneeGuard';
import { formatDate, isOverdue } from '../../utils/formatters';

/**
 * TaskTable organism displaying the project task list with filter toolbar and RBAC-gated actions.
 *
 * @param {Array} tasks
 * @param {object} project - Active project
 * @param {Function} onStatusChange - (taskId, newStatus) => Promise<void>
 * @param {Function} [onEditTask] - (task) => void
 * @param {Function} [onDeleteTask] - (taskId) => void
 * @param {Function} [onOpenNewTask] - () => void
 * @param {boolean} [isLoading=false]
 */
export default function TaskTable({
  tasks = [],
  project,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onOpenNewTask,
  isLoading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-4">
        <Skeleton variant="table-row" count={5} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-card space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-surface-container-low pl-9 pr-4 py-2 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'To Do', 'In Progress', 'Completed'].map((tab) => (
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

      {/* Task Rows */}
      {filteredTasks.length === 0 ? (
        <div className="py-14 text-center rounded-xl border border-dashed border-surface-container">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">
            task_alt
          </span>
          <p className="text-sm font-semibold text-on-surface">No tasks found</p>
          <p className="text-xs text-on-surface-variant mt-1 mb-4">
            {tasks.length === 0
              ? 'No tasks created in this project yet.'
              : 'No tasks matched your search criteria.'}
          </p>

          <ProjectAdminGuard project={project}>
            {onOpenNewTask && (
              <button
                type="button"
                onClick={onOpenNewTask}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-container px-3.5 py-2 text-xs font-semibold text-on-primary hover:bg-primary transition-colors shadow-subtle"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Create Task
              </button>
            )}
          </ProjectAdminGuard>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container text-[11px] font-semibold text-outline uppercase tracking-wider">
                <th className="py-3 px-2 w-10">Status</th>
                <th className="py-3 px-3">Task Details</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Assignees</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {filteredTasks.map((task) => {
                const taskId = task.id || task._id;
                const taskOverdue = isOverdue(task.deadline, task.status);

                return (
                  <tr
                    key={taskId}
                    className="hover:bg-surface-container-low/50 transition-colors group"
                  >
                    {/* Status Checkbox / Quick Toggle */}
                    <td className="py-3.5 px-2 align-middle">
                      <TaskAssigneeGuard
                        task={task}
                        project={project}
                        fallback={
                          <span
                            title="Only assigned members can update this task"
                            className="material-symbols-outlined text-xl text-outline/40 cursor-not-allowed"
                          >
                            {task.status === 'Completed'
                              ? 'check_circle'
                              : 'radio_button_unchecked'}
                          </span>
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onStatusChange &&
                            onStatusChange(
                              taskId,
                              task.status === 'Completed' ? 'To Do' : 'Completed'
                            )
                          }
                          className="text-outline hover:text-primary transition-colors cursor-pointer"
                          title={
                            task.status === 'Completed'
                              ? 'Mark Incomplete'
                              : 'Mark Completed'
                          }
                        >
                          <span className="material-symbols-outlined text-xl">
                            {task.status === 'Completed'
                              ? 'check_circle'
                              : 'radio_button_unchecked'}
                          </span>
                        </button>
                      </TaskAssigneeGuard>
                    </td>

                    {/* Task Title & Description */}
                    <td className="py-3.5 px-3 align-middle max-w-xs sm:max-w-md">
                      <div className="font-semibold text-on-surface">
                        <span
                          className={
                            task.status === 'Completed'
                              ? 'line-through text-outline'
                              : ''
                          }
                        >
                          {task.title}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      <Badge priority={task.priority || 'Medium'} size="sm" />
                    </td>

                    {/* Assignees */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      {task.assignees && task.assignees.length > 0 ? (
                        <AvatarGroup users={task.assignees} max={3} size="xs" />
                      ) : (
                        <span className="text-[11px] text-outline italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="py-3.5 px-3 align-middle whitespace-nowrap">
                      {task.deadline ? (
                        <span
                          className={`flex items-center gap-1 text-[11px] ${
                            taskOverdue ? 'text-error font-semibold' : 'text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {taskOverdue ? 'event_busy' : 'schedule'}
                          </span>
                          {formatDate(task.deadline)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-outline">None</span>
                      )}
                    </td>

                    {/* Actions Cell (RBAC Guarded) */}
                    <td className="py-3.5 px-3 align-middle text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Dropdown */}
                        <TaskAssigneeGuard
                          task={task}
                          project={project}
                          fallback={
                            <Badge status={task.status} size="sm" />
                          }
                        >
                          <select
                            value={task.status}
                            onChange={(e) =>
                              onStatusChange && onStatusChange(taskId, e.target.value)
                            }
                            className="rounded-lg bg-surface border border-surface-container px-2 py-1 text-xs text-on-surface font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </TaskAssigneeGuard>

                        {/* Admin-only Task Editing and Deletion (FR-21) */}
                        <ProjectAdminGuard project={project}>
                          {onEditTask && (
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                              title="Edit Task"
                            >
                              <span className="material-symbols-outlined text-base">
                                edit
                              </span>
                            </button>
                          )}

                          {onDeleteTask && (
                            <button
                              type="button"
                              onClick={() => onDeleteTask(taskId)}
                              className="p-1 rounded text-outline hover:text-error hover:bg-error-container/20 transition-colors"
                              title="Delete Task"
                            >
                              <span className="material-symbols-outlined text-base">
                                delete
                              </span>
                            </button>
                          )}
                        </ProjectAdminGuard>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
