import React from 'react';
import { motion } from 'motion/react';
import { Activity, Signal, Zap } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'online' | 'syncing' | 'offline';
  latency?: number;
  syncMessage?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  latency = 0,
  syncMessage = "Everything is up to date" 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'syncing': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'syncing': return 'bg-yellow-400';
      case 'offline': return 'bg-red-400';
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 glass-frost text-[10px] font-black uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <div className={`status-indicator w-2 h-2 ${getStatusBg()}`} />
        <span className={getStatusColor()}>{status}</span>
      </div>
      
      <div className="h-3 w-[1px] bg-white/10" />
      
      <div className="flex items-center gap-1.5 text-white/50">
        <Signal size={12} className={latency > 150 ? 'text-red-400' : 'text-green-400'} />
        <span>{isNaN(latency) ? 0 : latency}ms</span>
      </div>

      <div className="h-3 w-[1px] bg-white/10" />

      <div className="flex items-center gap-1.5 text-white/50">
        <Activity size={12} className={status === 'syncing' ? 'animate-spin' : ''} />
        <span>{syncMessage}</span>
      </div>
    </div>
  );
};
