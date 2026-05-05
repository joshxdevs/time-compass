import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTimer } from '../../hooks/useTimer';

const AppLayout: React.FC = () => {
  const { isOffline } = useTimer();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {isOffline && (
          <div className="reconnect-banner">
            <span className="spinner" style={{ width: 12, height: 12 }} />
            Reconnecting to server…
          </div>
        )}
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
