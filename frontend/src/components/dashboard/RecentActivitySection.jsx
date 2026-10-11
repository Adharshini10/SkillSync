import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecentActivitySection({
  activities = [],
  loading = false,
  error = null,
  onRetry,
}) {
  const navigate = useNavigate();

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  const handleItemClick = (activity) => {
    if (
      activity.type === 'CONNECTION_REQUEST' ||
      activity.type === 'CONNECTION_ACCEPTED' ||
      activity.type === 'CONNECTION_REJECTED' ||
      activity.type === 'PRIVATE_MESSAGE'
    ) {
      navigate('/skill-swapper');
    } else if (
      activity.type === 'PROJECT_JOIN_REQUEST' ||
      activity.type === 'PROJECT_JOIN_ACCEPTED' ||
      activity.type === 'PROJECT_JOIN_REJECTED' ||
      activity.type === 'PROJECT_MESSAGE'
    ) {
      if (activity.referenceId) {
        navigate(`/projects/${activity.referenceId}`);
      } else {
        navigate('/projects');
      }
    }
  };

  return (
    <aside className="dashboard-activity-panel" aria-labelledby="heading-recent-activity">
      <div className="activity-panel-header">
        <div className="activity-panel-title-wrap">
          <span className="activity-header-icon" aria-hidden="true">⏱️</span>
          <h2 id="heading-recent-activity" className="activity-main-title">
            Recent Activity
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="section-view-all-link"
          id="btn-view-all-activity"
        >
          View All →
        </button>
      </div>

      <div className="activity-panel-body">
        {loading ? (
          <div className="activity-skeleton-list">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="activity-skeleton-item">
                <div className="skeleton-icon-mini"></div>
                <div className="skeleton-content-lines">
                  <div className="skeleton-line-title"></div>
                  <div className="skeleton-line-sub"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="activity-error-box">
            <p>⚠️ {error}</p>
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn-retry-action">
                Retry
              </button>
            )}
          </div>
        ) : activities.length === 0 ? (
          <div className="activity-empty-state" id="empty-recent-activity">
            <div className="activity-empty-icon">✨</div>
            <p className="activity-empty-title">No recent activity</p>
            <span className="activity-empty-sub">
              Your connection updates, messages, and project requests will appear here.
            </span>
          </div>
        ) : (
          <div className="activity-items-list">
            {activities.slice(0, 7).map((item) => (
              <div
                key={item.id}
                className={`activity-feed-item ${!item.isRead ? 'unread' : 'read'}`}
                onClick={() => handleItemClick(item)}
                role="button"
                tabIndex={0}
                title="Click to view details"
              >
                <div className="activity-item-icon" aria-hidden="true">
                  {getIconForActivity(item.type)}
                </div>

                <div className="activity-item-body">
                  <p className="activity-item-text">{item.title}</p>
                  <span className="activity-item-preview">{item.message}</span>
                  <span className="activity-item-time">{formatTimeAgo(item.createdAt)}</span>
                </div>

                {!item.isRead && (
                  <span className="activity-unread-dot" title="Unread" aria-label="Unread item" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
