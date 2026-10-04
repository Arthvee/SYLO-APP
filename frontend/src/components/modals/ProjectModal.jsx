import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

/**
 * Modal form for creating and editing projects (FR-09, FR-12).
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {Function} onSubmit - Async submission handler
 * @param {object} [initialData] - Data for edit mode
 * @param {boolean} [isLoading=false]
 */
export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        deadline: initialData.deadline ? initialData.deadline.slice(0, 10) : '',
      });
    } else {
      setFormData({ title: '', description: '', deadline: '' });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
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
      deadline: formData.deadline || undefined,
    });
  };

  const isEdit = Boolean(initialData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Project Details' : 'Create New Project'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          required
          placeholder="e.g. Mobile App Redesign"
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
          placeholder="Outline project objectives, deliverables, or scope..."
          value={formData.description}
          disabled={isLoading}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <Input
          label="Deadline (Optional)"
          type="date"
          value={formData.deadline}
          disabled={isLoading}
          helperText="Target completion milestone for the project"
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />

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
            {isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
