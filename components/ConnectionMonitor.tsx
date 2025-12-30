/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface ConnectionStatus {
  status: string;
  connected: boolean;
}

const ConnectionMonitor: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ 
    status: 'Checking...', 
    connected: false 
  });
  const [lastChecked, setLastChecked] = useState<string>('');

  useEffect(() => {
    // 立即检查一次
    checkConnection();
    
    // 设置定时检查（每30秒）
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const status = await api.db.getConnectionStatus();
      setConnectionStatus(status);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to check connection:', error);
      setConnectionStatus({ status: 'Unknown Error', connected: false });
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  const getStatusColor = () => {
    if (connectionStatus.connected) return 'text-green-600';
    if (connectionStatus.status.includes('Failed') || connectionStatus.status.includes('Error')) {
      return 'text-red-600';
    }
    return 'text-yellow-600';
  };

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border">
      <div className={`w-3 h-3 rounded-full ${connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        云端状态: {connectionStatus.status}
      </span>
      <span className="text-xs text-gray-500 ml-2">({lastChecked})</span>
      <button 
        onClick={checkConnection}
        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        刷新
      </button>
    </div>
  );
};

export default ConnectionMonitor;