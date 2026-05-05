import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, BarChart2, LogOut, Compass } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTimer } from '../../hooks/useTimer';
import { formatTime } from '../../hooks/useTimer';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isRunning, elapsedSeconds } = useTimer();
  const navigate = useNavigate();

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });


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

      {/* Live clock */}
      <div style={{
        margin: '8px 12px',
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 18,
          fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: 1,
          lineHeight: 1.2,
        }}>
          {timeStr}
        </div>
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 3,
          letterSpacing: 0.3,
        }}>
          {dateStr}
        </div>
      </div>

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
