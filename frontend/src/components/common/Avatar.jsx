import React from 'react';
import { getInitials, getAvatarColor } from '../../utils/formatters';

/**
 * Avatar atomic primitive for user identity visualization.
 *
 * @param {object} [user] - User object { name, username, _id, id }
 * @param {string} [name] - Fallback name
 * @param {string} [username] - Fallback username
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl'} [size='md']
 * @param {boolean} [showTooltip=true]
 */
export default function Avatar({
  user,
  name,
  username,
  size = 'md',
  showTooltip = true,
  className = '',
}) {
  const resolvedName = user?.name || name || '';
  const resolvedUsername = user?.username || username || '';
  const resolvedId = user?.id || user?._id || resolvedUsername || resolvedName || 'default';

  const initials = getInitials(resolvedName, resolvedUsername);
  const color = getAvatarColor(resolvedId);

  const sizes = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs font-semibold',
    lg: 'h-10 w-10 text-sm font-bold',
    xl: 'h-12 w-12 text-base font-extrabold',
  };

  const tooltipText = resolvedName
    ? `${resolvedName} (@${resolvedUsername})`
    : resolvedUsername
    ? `@${resolvedUsername}`
    : 'User';

  return (
    <div
      title={showTooltip ? tooltipText : undefined}
      className={`
        relative inline-flex shrink-0 items-center justify-center rounded-full border border-surface select-none
        ${sizes[size] || sizes.md}
        ${color.bg}
        ${color.text}
        ${className}
      `}
    >
      <span>{initials}</span>
    </div>
  );
}

/**
 * AvatarGroup renders a cluster of overlapping user avatars with overflow counting.
 *
 * @param {Array} users - Array of user objects
 * @param {number} [max=3] - Maximum visible avatars before grouping
 * @param {'xs' | 'sm' | 'md'} [size='sm']
 */
export function AvatarGroup({ users = [], max = 3, size = 'sm', className = '' }) {
  if (!users || users.length === 0) return null;

  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  const overflowSizes = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs font-semibold',
  };

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`}>
      {visibleUsers.map((u, idx) => (
        <Avatar
          key={u.id || u._id || u.username || idx}
          user={u}
          size={size}
          className="ring-2 ring-surface"
        />
      ))}
      {overflowCount > 0 && (
        <div
          title={`${overflowCount} more collaborator${overflowCount > 1 ? 's' : ''}`}
          className={`
            relative inline-flex shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface font-semibold ring-2 ring-surface
            ${overflowSizes[size] || overflowSizes.sm}
          `}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
}
