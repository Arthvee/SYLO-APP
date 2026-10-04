import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Avatar from '../common/Avatar';

/**
 * Task creation & editing modal with multi-assignee picker strictly listing project members (FR-19, FR-22, FR-24).
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onSubmit - Async handler returning promise
 * @param {object} project - Active project containing owner and collaborators
 * @param {object} [initialData] - Task object for edit mode
 * @param {boolean} [isLoading=false]
 */
export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  project,
  initialData = null,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    assignees: [], // Array of user IDs
  });
  const [errors, setErrors] = useState({});

  // Build eligible project members list (Owner + Collaborators)
  const eligibleMembers = React.useMemo(() => {
    if (!project) return [];
    const members = [];
    if (project.owner) {
      members.push({
        ...project.owner,
        id: project.owner.id || project.owner._id,
        isOwner: true,
      });
    }
    if (Array.isArray(project.collaborators)) {
      project.collaborators.forEach((c) => {
        const u = c.user || c;
        const uId = u.id || u._id;
        // Avoid duplicate if owner is also in collaborators
        if (!members.some((m) => m.id === uId)) {
          members.push({
            ...u,
            id: uId,
            role: c.role || 'Collaborator',
          });
        }
      });
    }
    return members;
  }, [project]);

  useEffect(() => {
    if (initialData) {
      const existingAssigneeIds = (initialData.assignees || []).map(
        (a) => (typeof a === 'object' ? a.id || a._id : a)
      );

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'Medium',
        deadline: initialData.deadline ? initialData.deadline.slice(0, 10) : '',
        assignees: existingAssigneeIds,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: '',
        assignees: [],
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const toggleAssignee = (userId) => {
    setFormData((prev) => {
      const isSelected = prev.assignees.includes(userId);
      return {
        ...prev,
        assignees: isSelected
          ? prev.assignees.filter((id) => id !== userId)
          : [...prev.assignees, userId],
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      deadline: formData.deadline || undefined,
      assignees: formData.assignees,
    });
  };

  const isEdit = Boolean(initialData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create New Task'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          required
          placeholder="e.g. Implement user authentication API"
          value={formData.title}
          error={errors.title}
          disabled={isLoading}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            if (errors.title) setErrors({ ...errors, title: null });
          }}
        />

        <Input
          label="Description"
          isTextarea
          rows={3}
          placeholder="Acceptance criteria, technical notes, or implementation links..."
          value={formData.description}
          disabled={isLoading}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Priority
            </label>
            <select
              value={formData.priority}
              disabled={isLoading}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2 text-xs sm:text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <Input
              label="Deadline (Optional)"
              type="date"
              value={formData.deadline}
              disabled={isLoading}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>

        {/* Multi-Assignee Picker (FR-22, FR-24) */}
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Assignees ({formData.assignees.length} selected)
          </label>
          <p className="text-[11px] text-on-surface-variant mb-2">
            Select one or more verified project members (FR-24).
          </p>

          {eligibleMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-container p-3 text-center text-xs text-outline">
              No project members available
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-surface-container bg-surface p-2">
              {eligibleMembers.map((member) => {
                const isSelected = formData.assignees.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAssignee(member.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary-fixed text-on-primary-fixed font-semibold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar user={member} size="xs" showTooltip={false} />
                      <span className="truncate">{member.name || member.username}</span>
                      <span className="text-[10px] text-outline font-normal">
                        (@{member.username})
                      </span>
                    </div>

                    <span className="material-symbols-outlined text-base">
                      {isSelected ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3">
          <Button
            variant="secondary"
            size="md"
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
          >
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
