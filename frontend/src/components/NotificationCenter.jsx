import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationService';

export default function NotificationCenter({ id = 'notification-center' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Format time nicely
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Fetch unread count & notifications
  const refreshUnread = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // Ignore background poll errors
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const list = await getMyNotifications();
      setNotifications(list || []);
      const unread = (list || []).filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for unread count every 6 seconds
  useEffect(() => {
    refreshUnread();
    const timer = setInterval(() => {
      refreshUnread();
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // When dropdown opens, fetch full list
  useEffect(() => {
    if (isOpen) {
      fetchList();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (e, notif) => {
    e.stopPropagation();
    if (notif.isRead) return;
    try {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (e, notifId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      refreshUnread();
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await markNotificationAsRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {}
    }
    setIsOpen(false);

    // Context-sensitive navigation
    if (
      notif.type === 'CONNECTION_REQUEST' ||
      notif.type === 'CONNECTION_ACCEPTED' ||
      notif.type === 'CONNECTION_REJECTED' ||
      notif.type === 'PRIVATE_MESSAGE'
    ) {
      navigate('/skill-swapper');
    } else if (
      notif.type === 'PROJECT_JOIN_REQUEST' ||
      notif.type === 'PROJECT_JOIN_ACCEPTED' ||
      notif.type === 'PROJECT_JOIN_REJECTED' ||
      notif.type === 'PROJECT_MESSAGE'
    ) {
      if (notif.referenceId) {
        navigate(`/projects/${notif.referenceId}`);
      } else {
        navigate('/projects');
      }
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'CONNECTION_REQUEST':
        return '🤝';
      case 'CONNECTION_ACCEPTED':
        return '🟢';
      case 'CONNECTION_REJECTED':
        return '⚪';
      case 'PROJECT_JOIN_REQUEST':
        return '📋';
      case 'PROJECT_JOIN_ACCEPTED':
        return '🎉';
      case 'PROJECT_JOIN_REJECTED':
        return '⚠️';
      case 'PRIVATE_MESSAGE':
        return '💬';
      case 'PROJECT_MESSAGE':
        return '👥';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-center-wrapper" ref={dropdownRef} id={id}>
      <button
        type="button"
        className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Notifications, ${unreadCount} unread`}
        title="Notifications"
        id={`${id}-bell-btn`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge" id={`${id}-badge`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu" id={`${id}-dropdown`}>
          <div className="notif-dropdown-header">
            <div className="notif-header-title">
              <span className="notif-header-icon">🔔</span>
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className="notif-count-pill">{unreadCount} new</span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-dropdown-body">
            {loading ? (
              <div className="notif-loading-state">
                <span className="spinner-sm"></span> Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon">✨</div>
                <p>All caught up!</p>
                <span>No new notifications at this time.</span>
              </div>
            ) : (
              <div className="notif-list-items">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item-card ${!n.isRead ? 'unread' : 'read'}`}
                    onClick={() => handleItemClick(n)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="notif-item-icon">{getIconForType(n.type)}</div>
                    <div className="notif-item-content">
                      <div className="notif-item-top">
                        <span className="notif-item-title">{n.title}</span>
                        <span className="notif-item-time">{formatTimeAgo(n.createdAt)}</span>
                      </div>
                      <p className="notif-item-message">{n.message}</p>
                    </div>

                    <div className="notif-item-actions">
                      {!n.isRead && (
                        <button
                          type="button"
                          className="btn-notif-mark"
                          onClick={(e) => handleMarkAsRead(e, n)}
                          title="Mark as read"
                        >
                          ●
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-notif-delete"
                        onClick={(e) => handleDelete(e, n.id)}
                        title="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
