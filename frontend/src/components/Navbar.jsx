import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to={isAuthenticated ? '/dashboard' : '/login'} className="nav-brand">
          <span className="brand-logo-dot"></span>
          SkillSync
        </NavLink>

        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                id="nav-dashboard-link"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                id="nav-profile-link"
              >
                My Profile
              </NavLink>
              <NavLink
                to="/skill-swapper"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                id="nav-skill-swapper-link"
              >
                Skill Swapper
              </NavLink>
              <span className="nav-user-greeting">
                Hi, {user?.name ? user.name.split(' ')[0] : 'Student'}
              </span>
              <ThemeToggle className="nav-theme-toggle" />
              <button onClick={handleLogout} className="btn-nav-logout" id="nav-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                id="nav-login-link"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                id="nav-register-link"
              >
                Register
              </NavLink>
              <ThemeToggle className="nav-theme-toggle" />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
