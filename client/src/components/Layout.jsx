import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiCheckSquare, FiBarChart2, FiSettings, FiLogOut, FiShield, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: FiUsers, label: 'Residents' },
    { to: '/tasks', icon: FiCheckSquare, label: 'Task Manager' },
    { to: '/reports', icon: FiBarChart2, label: 'Reports' },
    ...(user?.role === 'admin' || user?.role === 'manager'
      ? [{ to: '/admin', icon: FiSettings, label: 'Admin' }]
      : [])
  ];

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <FiShield size={20} />
          </div>
          <span className="sidebar-title">The White House Nursing Home</span>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <FiLogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={22} />
          </button>
          <div style={{ flex: 1 }} />
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
