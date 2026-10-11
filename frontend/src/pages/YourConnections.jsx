import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyConnections, removeConnection } from '../services/connectionService';
import StudentProfileModal from '../components/StudentProfileModal';
import PrivateChatModal from '../components/PrivateChatModal';

export default function YourConnections() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Modals state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Notification state
  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const data = await getMyConnections();
      setConnections(data || []);
    } catch (err) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to load your connections.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Handle Remove Connection
  const handleRemove = async (connectionId, userName) => {
    if (!window.confirm(`Are you sure you want to remove your connection with ${userName}?`)) {
      return;
    }

    setProcessingId(connectionId);
    try {
      await removeConnection(connectionId);
      setConnections((prev) => prev.filter((c) => c.connectionId !== connectionId));
      showNotification('success', `Removed connection with ${userName}.`);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to remove connection.');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Chat Modal
  const handleOpenChat = (peer) => {
    setChatPeer({
      userId: peer.userId,
      name: peer.userName || peer.name,
      email: peer.userEmail || peer.email,
      profilePictureUrl: peer.profilePictureUrl,
    });
    setIsChatOpen(true);
  };

  // Filter connections by search query
  const filteredConnections = connections.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.userName?.toLowerCase().includes(q);
    const emailMatch = c.userEmail?.toLowerCase().includes(q);
    const skillsMatch = c.skills?.some((s) => s.toLowerCase().includes(q));
    return nameMatch || emailMatch || skillsMatch;
  });

  return (
    <div className="your-connections-page" id="your-connections-view">
      {/* Flash notification banner */}
      {notification.message && (
        <div
          className={`floating-alert alert-${notification.type}`}
          role="alert"
          id="connections-alert-banner"
        >
          <span className="alert-icon">
            {notification.type === 'success' ? '✓' : '⚠️'}
          </span>
          <span className="alert-message">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="connections-hero-header">
        <div className="hero-badge-pill">
          <span className="badge-dot"></span>
          <span>Mutual Learning Network</span>
        </div>

        <h1 className="hero-main-title">
          Your <span className="gradient-text">Connected Peers</span> & Chats
        </h1>

        <p className="hero-subtext">
          Students you have actively connected with. Swap skills, share knowledge, and collaborate
          together in real-time private chat.
        </p>

        {/* Search & Actions Bar */}
        <div className="connections-filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by student name, email, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="connections-search-input"
              id="connections-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-actions-right">
            <span className="connections-count-badge" id="connections-count-badge">
              👥 {connections.length} {connections.length === 1 ? 'Connection' : 'Connections'}
            </span>

            <button
              type="button"
              onClick={fetchConnections}
              disabled={loading}
              className="btn-refresh-connections"
              title="Refresh connections"
              id="refresh-connections-btn"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="connections-main-content">
        {loading ? (
          <div className="matches-loading-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="match-skeleton-card">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-text line-1"></div>
                <div className="skeleton-text line-2"></div>
                <div className="skeleton-chips"></div>
              </div>
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="empty-results-card connections-empty-state">
            <div className="empty-icon-circle">🤝</div>
            <h3>No connected peers yet</h3>
            <p>
              When connection requests are accepted between you and other students, they will
              automatically appear here so you can chat anytime!
            </p>
            <div className="empty-cta-buttons">
              <button
                type="button"
                onClick={() => navigate('/skill-swapper')}
                className="btn-primary mt-3"
                id="find-partners-cta-btn"
              >
                Explore Skill Swapper ➔
              </button>
            </div>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="empty-results-card">
            <div className="empty-icon-circle">🔍</div>
            <h3>No connections match "{searchQuery}"</h3>
            <p>Try searching for a different student name or skill.</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn-secondary mt-3"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="connections-grid" id="accepted-connections-grid">
            {filteredConnections.map((peer) => {
              const initials = peer.userName
                ? peer.userName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'U';

              const isBusy = processingId === peer.connectionId;

              return (
                <div
                  key={peer.connectionId}
                  className="connection-item-card"
                  id={`connection-card-${peer.userId}`}
                >
                  <div className="connection-card-top">
                    <div className="connection-avatar-wrap">
                      <div className="connection-avatar-circle">{initials}</div>
                      <span className="online-badge-dot" title="Connected Peer"></span>
                    </div>

                    <div className="connection-identity-meta">
                      <h3 className="connection-peer-name" title={peer.userName}>
                        {peer.userName}
                      </h3>
                      <span className="connection-peer-email" title={peer.userEmail}>
                        {peer.userEmail}
                      </span>
                      <span className="connected-status-pill">🟢 Connected</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="connection-skills-block">
                    <span className="skills-block-label">Skills & Knowledge:</span>
                    <div className="connection-skills-tags">
                      {peer.skills && peer.skills.length > 0 ? (
                        peer.skills.map((s, idx) => (
                          <span key={idx} className="project-skill-pill">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted text-sm">Skills listed on profile</span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="connection-card-actions-row">
                    <button
                      type="button"
                      onClick={() => handleOpenChat(peer)}
                      className="btn-chat-primary"
                      id={`chat-peer-btn-${peer.userId}`}
                    >
                      💬 Chat Now
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent({
                          userId: peer.userId,
                          name: peer.userName,
                          email: peer.userEmail,
                          skills: peer.skills || [],
                          connectionStatus: 'ACCEPTED',
                        });
                        setIsProfileOpen(true);
                      }}
                      className="btn-profile-secondary"
                      id={`profile-peer-btn-${peer.userId}`}
                    >
                      Profile
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(peer.connectionId, peer.userName)}
                      disabled={isBusy}
                      className="btn-remove-icon"
                      title="Remove connection"
                      id={`remove-peer-btn-${peer.userId}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Profile Popup Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedStudent(null);
        }}
        onConnect={() => {}}
        onChat={(st) => {
          setIsProfileOpen(false);
          handleOpenChat(st);
        }}
      />

      {/* 1-on-1 Private Chat Modal */}
      <PrivateChatModal
        peer={chatPeer}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatPeer(null);
        }}
      />
    </div>
  );
}
