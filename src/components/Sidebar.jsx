import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '◎' },
  { path: '/jobs', label: 'Jobs', icon: '⚡' },
  { path: '/jobs/new', label: 'Create Job', icon: '＋' },
  { path: '/dlq', label: 'Dead Letter Queue', icon: '☠' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-icon">⟐</span>
        </div>
        <div className="sidebar-brand-text">
          <h1>JobScheduler</h1>
          <span className="sidebar-brand-sub">Distributed Engine</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-dot" />
        <span>System Online</span>
      </div>
    </aside>
  );
}
