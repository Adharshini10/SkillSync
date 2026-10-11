import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../services/profileService';
import ThemeToggle from '../ThemeToggle';

export default function DashboardHeader({ profile: propProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(propProfile || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (propProfile) {
      setProfile(propProfile);
    } else if (user) {
      getProfile().then((data) => setProfile(data)).catch(() => {});
    }
  }, [propProfile, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'S';
  const educationText = profile?.education || 'Student';

  return (
    <header className="dashboard-top-header" id="dashboard-header">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="dashboard-search-form" role="search">
        <span className="dashboard-search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search skills, projects, students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dashboard-search-input"
          id="dashboard-global-search"
          aria-label="Search skills, projects, and students"
        />
      </form>

      {/* Header Utilities */}
      <div className="dashboard-header-right">
        {/* Theme Switcher */}
        <ThemeToggle id="dashboard-header-theme" showLabel={false} />

        {/* User Profile Pill with Dropdown */}
        <div className="dashboard-user-menu-wrapper" ref={dropdownRef}>
          <div
            className="dashboard-user-pill"
            onClick={() => setMenuOpen((prev) => !prev)}
            title="Account Options"
            role="button"
            tabIndex={0}
            id="dashboard-user-profile-pill"
          >
            <div className="dashboard-pill-avatar">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={user?.name || 'Profile'}
                  className="dashboard-avatar-img"
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="dashboard-pill-info">
              <span className="dashboard-pill-name">{user?.name || 'Student'}</span>
              <span className="dashboard-pill-sub">{educationText}</span>
            </div>
            <span className="dashboard-pill-chevron" aria-hidden="true">▾</span>
          </div>

          {menuOpen && (
            <div className="dashboard-profile-dropdown" id="dashboard-profile-dropdown-menu">
              <div className="dropdown-user-header">
                <span className="dropdown-user-name">{user?.name || 'Student'}</span>
                <span className="dropdown-user-email">{user?.email || ''}</span>
              </div>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Profile
              </button>
              <button
                type="button"
                className="dropdown-item dropdown-logout-item"
                onClick={handleLogout}
                id="header-dropdown-logout-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Dedicated Quick Logout Header Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="dashboard-header-logout-btn"
          title="Logout"
          id="dashboard-header-logout"
          aria-label="Logout"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span className="header-logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
