import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, BarChart2, LogOut, Compass } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTimer } from '../../hooks/useTimer';
import { formatTime } from '../../hooks/useTimer';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isRunning, elapsedSeconds } = useTimer();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Compass size={16} />
        </div>
        <span className="sidebar-logo-text">TimeCompass</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={16} />
          Dashboard
          {isRunning && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--success)', background: 'var(--success-light)', padding: '1px 6px', borderRadius: 99 }}>
              {formatTime(elapsedSeconds)}
            </span>
          )}
        </NavLink>
        <NavLink to="/activities" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <List size={16} />
          Activities
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <BarChart2 size={16} />
          Analytics
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-link" onClick={handleLogout} id="logout-btn">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
