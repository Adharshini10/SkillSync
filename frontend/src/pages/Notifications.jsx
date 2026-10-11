import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationService';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CONNECTIONS' | 'PROJECTS'

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getIconForActivity = (type) => {
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

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }

    if (
      item.type === 'CONNECTION_REQUEST' ||
      item.type === 'CONNECTION_ACCEPTED' ||
      item.type === 'CONNECTION_REJECTED' ||
      item.type === 'PRIVATE_MESSAGE'
    ) {
      navigate('/skill-swapper?tab=connections');
    } else if (
      item.type === 'PROJECT_JOIN_REQUEST' ||
      item.type === 'PROJECT_JOIN_ACCEPTED' ||
      item.type === 'PROJECT_JOIN_REJECTED' ||
      item.type === 'PROJECT_MESSAGE'
    ) {
      if (item.referenceId) {
        navigate(`/projects/${item.referenceId}`);
      } else {
        navigate('/projects');
      }
    }
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'CONNECTIONS') return n.type.startsWith('CONNECTION_') || n.type === 'PRIVATE_MESSAGE';
    if (activeFilter === 'PROJECTS') return n.type.startsWith('PROJECT_');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications-page-container" id="notifications-page">
      {/* Page Header */}
      <div className="notifications-page-header">
        <div className="notifications-header-left">
          <h1 className="notifications-page-title">Notifications</h1>
          <p className="notifications-page-sub">
            Stay updated with your connection invites, project responses, and team messages.
          </p>
        </div>
        <div className="notifications-header-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-mark-all-read"
              id="btn-notifications-mark-all-read"
            >
              ✓ Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notifications-filter-bar">
        <button
          type="button"
          className={`notif-filter-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={`notif-filter-tab ${activeFilter === 'UNREAD' ? 'active' : ''}`}
          onClick={() => setActiveFilter('UNREAD')}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          className={`notif-filter-tab ${activeFilter === 'CONNECTIONS' ? 'active' : ''}`}
          onClick={() => setActiveFilter('CONNECTIONS')}
        >
          Connections
        </button>
        <button
          type="button"
          className={`notif-filter-tab ${activeFilter === 'PROJECTS' ? 'active' : ''}`}
          onClick={() => setActiveFilter('PROJECTS')}
        >
          Projects
        </button>
      </div>

      {/* Main List */}
      <div className="notifications-page-body">
        {loading ? (
          <div className="notifications-loading-skeleton">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="dashboard-skeleton-card" style={{ marginBottom: '12px' }}>
                <div className="skeleton-line-title"></div>
                <div className="skeleton-line-sub"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="dashboard-error-box">
            <p>⚠️ {error}</p>
            <button type="button" onClick={fetchList} className="btn-retry-action">
              Retry
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="dashboard-empty-card" id="empty-notifications-card">
            <div className="empty-card-icon">🔔</div>
            <h3 className="empty-card-title">
              {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="empty-card-desc">
              When peers send you connection requests, project invites, or messages, they will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-empty-action"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="notifications-list-container">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`notifications-full-item ${!item.isRead ? 'unread' : 'read'}`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
              >
                <div className="notif-full-icon" aria-hidden="true">
                  {getIconForActivity(item.type)}
                </div>

                <div className="notif-full-content">
                  <div className="notif-full-title-row">
                    <span className="notif-full-title">{item.title}</span>
                    <span className="notif-full-time">{formatTimeAgo(item.createdAt)}</span>
                  </div>
                  <p className="notif-full-desc">{item.message}</p>
                </div>

                <div className="notif-full-actions" onClick={(e) => e.stopPropagation()}>
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(e, item.id)}
                      className="btn-notif-action-icon"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="btn-notif-action-icon delete"
                    title="Delete notification"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
