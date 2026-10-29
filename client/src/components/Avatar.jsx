import React, { useState } from 'react';
import { getAvatarUrl } from '../services/api';

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
  '2xl': 'w-28 h-28 text-3xl',
};

const roleBgColors = {
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  BUYER: 'bg-blue-100 text-blue-800 border-blue-200',
  TRANSPORTER: 'bg-amber-100 text-amber-800 border-amber-200',
  FARMER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const Avatar = ({ src, name = '', role = 'FARMER', size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const resolvedUrl = src && !imageError ? getAvatarUrl(src) : '';

  const getInitials = (fullName) => {
    if (!fullName) return 'KB';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const roleClass = roleBgColors[role] || roleBgColors.FARMER;
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt={name || 'User Avatar'}
        onError={() => setImageError(true)}
        className={`${sizeClass} rounded-full object-cover border border-slate-200 shadow-sm shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold tracking-tight uppercase border shadow-sm shrink-0 select-none ${roleClass} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
