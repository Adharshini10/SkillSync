import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../services/notificationService';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.unreadCount || 0);
      } catch (err) {
        // ignore background poll error
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 6000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
    },
    {
      name: 'Skill Swapper',
      path: '/skill-swapper',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
      ),
    },
    {
      name: 'Project Finder',
      path: '/projects',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          <polygon points="12 11 12 17 17 14"></polygon>
        </svg>
      ),
    },
    {
      name: 'Chat',
      path: '/skill-swapper?tab=connections',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
    },
  ];

  const isLinkActive = (itemPath) => {
    if (itemPath.includes('?')) {
      const [pathname, search] = itemPath.split('?');
      return location.pathname === pathname && location.search.includes(search);
    }
    if (itemPath === '/skill-swapper') {
      return location.pathname === '/skill-swapper' && !location.search.includes('tab=connections');
    }
    return location.pathname === itemPath || (itemPath !== '/' && location.pathname.startsWith(`${itemPath}/`));
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-trigger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="mobile-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-logo-icon">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 2C8.268 2 2 8.268 2 16c0 6.185 3.992 11.436 9.6 13.267.8.147 1.1-.347 1.1-.77 0-.38-.014-1.387-.022-2.723-3.894.846-4.716-1.877-4.716-1.877-.637-1.618-1.555-2.05-1.555-2.05-1.271-.869.096-.851.096-.851 1.405.099 2.145 1.443 2.145 1.443 1.249 2.14 3.277 1.522 4.075 1.164.127-.905.489-1.522.889-1.872-3.109-.353-6.378-1.555-6.378-6.918 0-1.528.546-2.777 1.442-3.756-.144-.354-.625-1.777.137-3.704 0 0 1.175-.376 3.85 1.435A13.4 13.4 0 0 1 16 8.57c1.19.006 2.388.161 3.509.473 2.673-1.811 3.846-1.435 3.846-1.435.764 1.927.283 3.35.139 3.704.898.979 1.44 2.228 1.44 3.756 0 5.377-3.274 6.56-6.393 6.906.502.433.95 1.288.95 2.596 0 1.875-.017 3.388-.017 3.848 0 .427.296.924 1.107.768C26.012 27.43 30 22.182 30 16c0-7.732-6.268-14-14-14z"
                fill="url(#brandGradMobile)"
              />
              <defs>
                <linearGradient id="brandGradMobile" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="brand-title">SkillSync</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle id="mobile-theme-toggle" />
        </div>
      </header>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Logo Header */}
        <div className="sidebar-brand-wrapper">
          <Link to="/dashboard" className="sidebar-brand" onClick={() => setMobileOpen(false)}>
            <div className="brand-logo-icon">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="url(#bgSwirl)" opacity="0.2" />
                <path
                  d="M14 20C14 16.6863 16.6863 14 20 14C23.3137 14 26 16.6863 26 20C26 23.3137 23.3137 26 20 26"
                  stroke="url(#strokeGrad1)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M10 20C10 14.4772 14.4772 10 20 10C25.5228 10 30 14.4772 30 20C30 25.5228 25.5228 30 20 30C15.8 30 12.2 27.4 10.7 23.7"
                  stroke="url(#strokeGrad2)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="20" r="3" fill="#2dd4bf" />
                <defs>
                  <linearGradient id="bgSwirl" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#0d9488" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="strokeGrad1" x1="14" y1="14" x2="26" y2="26">
                    <stop stopColor="#2dd4bf" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="strokeGrad2" x1="10" y1="10" x2="30" y2="30">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-text-block">
              <span className="brand-name">SkillSync</span>
              <span className="brand-tagline">Skill Swapper & Projects</span>
            </div>
          </Link>

          {/* Close button inside mobile drawer */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-section-title">MAIN MENU</div>
          {navLinks.map((item) => {
            const isActive = isLinkActive(item.path);

            return (
              <div key={item.name} className="sidebar-nav-group">
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  id={`sidebar-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-text">{item.name}</span>
                  {item.name === 'Notifications' && unreadCount > 0 && (
                    <span className="sidebar-notif-count-pill" id="sidebar-unread-badge">
                      {unreadCount}
                    </span>
                  )}
                  {isActive && <span className="sidebar-active-indicator" />}
                </Link>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
