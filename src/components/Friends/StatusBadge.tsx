import React from 'react';

export type PresenceStatus = 'online' | 'away' | 'offline';

interface StatusBadgeProps {
  status?: PresenceStatus;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'online',
  isOnline = true,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const currentStatus: PresenceStatus = isOnline ? (status === 'away' ? 'away' : 'online') : 'offline';

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'online':
        return 'bg-emerald-400';
      case 'away':
        return 'bg-amber-400';
      case 'offline':
      default:
        return 'bg-slate-500';
    }
  };

  const getLabel = () => {
    switch (currentStatus) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex items-center justify-center">
        {currentStatus === 'online' && (
          <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 status-ring-pulse-online`} />
        )}
        <span className={`relative inline-flex rounded-full ${sizeClasses[size]} ${getStatusColor()} ${currentStatus === 'online' ? 'status-dot-pulse-online' : ''}`} />
      </span>
      {showLabel && (
        <span className={`text-[11px] font-bold ${
          currentStatus === 'online' ? 'text-emerald-400' : currentStatus === 'away' ? 'text-amber-400' : 'text-slate-400'
        }`}>
          {getLabel()}
        </span>
      )}
    </div>
  );
};
