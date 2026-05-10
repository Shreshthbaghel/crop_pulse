import React from 'react';
import { useMQTT } from '../contexts/MQTTContext';
import { AlertCircle } from 'lucide-react';

export default function ConnectionStatus() {
  const { connectionStatus, errorMessage } = useMQTT();

  const states = {
    connecting: {
      dot: 'bg-gray-400 animate-pulse',
      text: 'Connecting...',
      bg: 'bg-gray-50',
      color: 'text-gray-500'
    },
    connected: {
      dot: 'bg-green-500',
      text: 'Live',
      bg: 'bg-green-50',
      color: 'text-green-700'
    },
    disconnected: {
      dot: 'bg-amber-500 animate-bounce',
      text: 'Reconnecting...',
      bg: 'bg-amber-50',
      color: 'text-amber-700'
    },
    error: {
      dot: 'bg-red-500',
      text: 'Error',
      bg: 'bg-red-50',
      color: 'text-red-700'
    }
  };

  const status = states[connectionStatus] || states.connecting;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} border border-white shadow-sm transition-all duration-500 group relative cursor-help`}>
      <div className={`w-2 h-2 rounded-full ${status.dot}`} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${status.color}`}>
        {status.text}
      </span>
      
      {connectionStatus === 'error' && (
        <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-gray-900 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {errorMessage || 'Check HiveMQ credentials'}
        </div>
      )}
    </div>
  );
}
