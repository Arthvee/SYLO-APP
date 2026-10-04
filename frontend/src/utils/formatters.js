/**
 * Data and text formatters for the Sylo application.
 * Adheres to PRD business rules BR-12, BR-13, and BR-14.
 */

/**
 * Extracts 1-2 uppercase initials from a full name or username.
 * @param {string} [name] - User full name
 * @param {string} [username] - User handle
 * @returns {string} Initials string (e.g. "JD" or "U")
 */
export const getInitials = (name, username) => {
  if (name && typeof name === 'string' && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (username && typeof username === 'string' && username.trim()) {
    return username.trim().slice(0, 2).toUpperCase();
  }
  return 'U';
};

/**
 * Deterministically generates a Tailwind color pair from an identifier.
 * @param {string} id - Username or user ID
 * @returns {{ bg: string, text: string }} Tailwind class pair
 */
export const getAvatarColor = (id = '') => {
  const palettes = [
    { bg: 'bg-primary-container', text: 'text-on-primary' },
    { bg: 'bg-primary-fixed', text: 'text-on-primary-fixed' },
    { bg: 'bg-secondary-container', text: 'text-on-secondary' },
    { bg: 'bg-tertiary-container', text: 'text-on-tertiary' },
    { bg: 'bg-tertiary-fixed', text: 'text-on-tertiary-fixed' },
    { bg: 'bg-surface-container-high', text: 'text-on-surface' },
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

/**
 * Formats an ISO date string into a standard readable date.
 * @param {string|Date} date - ISO string or Date instance
 * @returns {string} Formatted date (e.g. "Oct 12, 2026")
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Formats a date with relative day comparison.
 * @param {string|Date} date - ISO string or Date instance
 * @returns {string} Formatted relative string (e.g. "Today", "Tomorrow", "In 3 days")
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const target = new Date(date);
  if (isNaN(target.getTime())) return '';

  const now = new Date();
  // Clear time components for pure day comparison
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

  return formatDate(date);
};

/**
 * Evaluates whether a task or project is overdue (BR-14, FR-30).
 * Incomplete items whose deadline has passed are overdue.
 * @param {string|Date} deadline - Deadline timestamp
 * @param {string} status - Current workflow status ('Completed', 'To Do', 'In Progress')
 * @returns {boolean} True if overdue
 */
export const isOverdue = (deadline, status) => {
  if (!deadline || status === 'Completed') return false;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return false;

  // Deadline considered overdue if end of target day has passed
  deadlineDate.setHours(23, 59, 59, 999);
  return deadlineDate.getTime() < Date.now();
};

/**
 * Calculates project progress strictly guarding against division by zero (BR-12, Section 9.1).
 * Formula: (Completed Tasks / Total Tasks) * 100
 * @param {number} completedTasks - Total completed tasks count
 * @param {number} totalTasks - Total tasks count
 * @returns {number} Integer between 0 and 100
 */
export const calculateProgress = (completedTasks = 0, totalTasks = 0) => {
  if (!totalTasks || totalTasks <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedTasks / totalTasks) * 100)));
};

/**
 * Derives project status from percentage completion (BR-13, FR-33).
 * - Active: 0-74%
 * - Almost Done: 75-99%
 * - Completed: 100%
 * @param {number} progress - Progress integer (0-100)
 * @returns {'Active' | 'Almost Done' | 'Completed'}
 */
export const getDerivedProjectStatus = (progress = 0) => {
  if (progress >= 100) return 'Completed';
  if (progress >= 75) return 'Almost Done';
  return 'Active';
};
