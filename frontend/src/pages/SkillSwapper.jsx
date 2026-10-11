import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLearningSkills, addLearningSkill, deleteLearningSkill } from '../services/learningSkillService';
import { getSkillMatches } from '../services/skillSwapperService';
import {
  sendConnectionRequest,
  getSentRequests,
  getReceivedRequests,
  getMyConnections,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
} from '../services/connectionService';
import LearningSkillManager from '../components/LearningSkillManager';
import MatchStudentCard from '../components/MatchStudentCard';
import StudentProfileModal from '../components/StudentProfileModal';
import PrivateChatModal from '../components/PrivateChatModal';
import { playSendRequestSound, playAcceptRequestSound } from '../utils/soundEffects';

export default function SkillSwapper() {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation tabs: 'matches' | 'connections' | 'received' | 'sent'
  const [activeTab, setActiveTab] = useState('matches');

  // State for accepted connections (Mutual active connections for easy chat)
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // State for received connection requests (who sent request to current user)
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loadingReceived, setLoadingReceived] = useState(false);

  // State for sent connection requests (outgoing)
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);

  // Busy state for action buttons (accept / reject / delete / cancel)
  const [processingId, setProcessingId] = useState(null);

  // 1-on-1 Chat modal state
  const [chatPeer, setChatPeer] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // State for current student's learning skills
  const [learningSkills, setLearningSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [addingSkill, setAddingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);

  // State for matching
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [minMatches, setMinMatches] = useState(1);
  const [connectingUserId, setConnectingUserId] = useState(null);

  // Modal state for Profile
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Feedback notifications
  const [notification, setNotification] = useState({ type: '', message: '' });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4500);
  };

  // Fetch accepted connections
  const fetchConnections = async (silent = false) => {
    if (!silent) setLoadingConnections(true);
    try {
      const data = await getMyConnections();
      setConnections(data || []);
    } catch (err) {
      if (!silent) {
        showNotification('error', err.response?.data?.message || 'Failed to load your connections.');
      }
    } finally {
      if (!silent) setLoadingConnections(false);
    }
  };

  // Fetch received connection requests
  const fetchReceivedRequests = async (silent = false) => {
    if (!silent) setLoadingReceived(true);
    try {
      const data = await getReceivedRequests();
      setReceivedRequests(data || []);
    } catch (err) {
      if (!silent) {
        showNotification('error', err.response?.data?.message || 'Failed to load received connection requests.');
      }
    } finally {
      if (!silent) setLoadingReceived(false);
    }
  };

  // Fetch sent connection requests
  const fetchSentRequests = async (silent = false) => {
    if (!silent) setLoadingSent(true);
    try {
      const data = await getSentRequests();
      setSentRequests(data || []);
    } catch (err) {
      if (!silent) {
        showNotification('error', err.response?.data?.message || 'Failed to load sent connection requests.');
      }
    } finally {
      if (!silent) setLoadingSent(false);
    }
  };

  // Initial load: fetch all connection states
  useEffect(() => {
    fetchConnections(true);
    fetchReceivedRequests(true);
    fetchSentRequests(true);
  }, []);

  // Synchronize activeTab with URL search parameter (?tab=connections | received | sent | matches)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'connections') {
      setActiveTab('connections');
    } else if (tabParam === 'received') {
      setActiveTab('received');
    } else if (tabParam === 'sent') {
      setActiveTab('sent');
    } else {
      setActiveTab('matches');
    }
  }, [location.search]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'connections') {
      navigate('/skill-swapper?tab=connections');
    } else if (newTab === 'matches') {
      navigate('/skill-swapper');
    } else {
      navigate(`/skill-swapper?tab=${newTab}`);
    }
  };

  // On tab switch
  useEffect(() => {
    if (activeTab === 'connections') {
      fetchConnections();
    } else if (activeTab === 'received') {
      fetchReceivedRequests();
    } else if (activeTab === 'sent') {
      fetchSentRequests();
    }
  }, [activeTab]);

  // Accept received connection request
  const handleAcceptRequest = async (connectionId, userName) => {
    setProcessingId(connectionId);
    try {
      await acceptConnectionRequest(connectionId);
      playAcceptRequestSound();
      setReceivedRequests((prev) =>
        prev.map((req) =>
          req.connectionId === connectionId ? { ...req, status: 'ACCEPTED' } : req
        )
      );
      showNotification('success', `Connection accepted! You and ${userName || 'student'} are now connected and can chat.`);
      fetchConnections(true);
      fetchReceivedRequests(true);
      fetchSentRequests(true);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to accept connection request.');
    } finally {
      setProcessingId(null);
    }
  };

  // Reject received connection request
  const handleRejectRequest = async (connectionId, userName) => {
    setProcessingId(connectionId);
    try {
      await rejectConnectionRequest(connectionId);
      setReceivedRequests((prev) =>
        prev.map((req) =>
          req.connectionId === connectionId ? { ...req, status: 'REJECTED' } : req
        )
      );
      showNotification('success', `Declined connection request from ${userName || 'student'}.`);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to decline connection request.');
    } finally {
      setProcessingId(null);
    }
  };

  // Delete / Cancel connection request anytime
  const handleDeleteConnection = async (connectionId, userName) => {
    setProcessingId(connectionId);
    try {
      await removeConnection(connectionId);
      setConnections((prev) => prev.filter((r) => r.connectionId !== connectionId));
      setReceivedRequests((prev) => prev.filter((r) => r.connectionId !== connectionId));
      setSentRequests((prev) => prev.filter((r) => r.connectionId !== connectionId));
      showNotification('success', `Successfully removed connection with ${userName || 'student'}.`);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to delete connection request.');
    } finally {
      setProcessingId(null);
    }
  };

  // 1-on-1 Chat Handlers
  const handleOpenChat = (peer) => {
    setChatPeer({
      userId: peer.userId,
      name: peer.userName || peer.name,
      email: peer.userEmail || peer.email,
      profilePictureUrl: peer.profilePictureUrl,
    });
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    setChatPeer(null);
  };

  // 1. Load initial learning skills
  useEffect(() => {
    let isMounted = true;
    const fetchSkills = async () => {
      setLoadingSkills(true);
      try {
        const data = await getLearningSkills();
        if (isMounted) {
          setLearningSkills(data || []);
        }
      } catch (err) {
        if (isMounted) {
          showNotification(
            'error',
            err.response?.data?.message || 'Failed to load your learning skills.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingSkills(false);
        }
      }
    };

    fetchSkills();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Add Learning Skill
  const handleAddSkill = async (skillName) => {
    setAddingSkill(true);
    try {
      const created = await addLearningSkill(skillName);
      setLearningSkills((prev) => [...prev, created]);
      showNotification('success', `Added "${created.name}" to skills you want to learn!`);
    } catch (err) {
      if (err.response?.status === 409) {
        showNotification('error', `You already added "${skillName}" to your learning list.`);
      } else {
        showNotification(
          'error',
          err.response?.data?.message || 'Failed to add learning skill.'
        );
      }
    } finally {
      setAddingSkill(false);
    }
  };

  // 3. Delete Learning Skill
  const handleDeleteSkill = async (skillId, skillName) => {
    setDeletingSkillId(skillId);
    try {
      await deleteLearningSkill(skillId);
      setLearningSkills((prev) => prev.filter((s) => s.id !== skillId));
      showNotification('success', `Removed "${skillName}".`);
    } catch (err) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to remove learning skill.'
      );
    } finally {
      setDeletingSkillId(null);
    }
  };

  // 4. Find Matches
  const handleFindMatches = async () => {
    if (learningSkills.length === 0) {
      showNotification(
        'error',
        'Please add at least one skill you want to learn before finding matches.'
      );
      return;
    }

    setLoadingMatches(true);
    setHasSearched(true);
    try {
      const results = await getSkillMatches(minMatches);
      setMatches(results || []);
      if (results && results.length > 0) {
        showNotification('success', `Found ${results.length} matching ${results.length === 1 ? 'student' : 'students'}!`);
      }
    } catch (err) {
      showNotification(
        'error',
        err.response?.data?.message || 'Error occurred while finding skill matches.'
      );
    } finally {
      setLoadingMatches(false);
    }
  };

  // 5. Connect with matched student
  const handleConnect = async (targetUserId) => {
    setConnectingUserId(targetUserId);
    try {
      await sendConnectionRequest(targetUserId);
      playSendRequestSound();
      showNotification('success', 'Connection request sent successfully!');

      // Update matching student connection status directly in state
      setMatches((prev) =>
        prev.map((student) =>
          student.userId === targetUserId
            ? { ...student, connectionStatus: 'PENDING_SENT' }
            : student
        )
      );

      // If modal is currently viewing this student, update it too
      if (selectedStudent && selectedStudent.userId === targetUserId) {
        setSelectedStudent((prev) => ({
          ...prev,
          connectionStatus: 'PENDING_SENT',
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send connection request.';
      showNotification('error', msg);
    } finally {
      setConnectingUserId(null);
    }
  };

  // 6. View Profile Modal Handlers
  const handleOpenProfile = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseProfile = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div className="skill-swapper-page" id="skill-swapper-view">
      {/* Flash Notification Banner */}
      {notification.message && (
        <div
          className={`floating-alert alert-${notification.type}`}
          role="alert"
          id="swapper-alert-banner"
        >
          <span className="alert-icon">
            {notification.type === 'success' ? '✓' : '⚠️'}
          </span>
          <span className="alert-message">{notification.message}</span>
        </div>
      )}

      {/* Hero Section — Closely reproduces the reference design (Image 1) */}
      <section className="swapper-hero-section">
        {/* Decorative sparkles */}
        <div className="decorative-sparkle sparkle-1" aria-hidden="true">✦</div>
        <div className="decorative-sparkle sparkle-2" aria-hidden="true">✧</div>
        <div className="decorative-sparkle sparkle-3" aria-hidden="true">⋆</div>

        {/* Hand-drawn annotation: Learn New Tech */}
        <div className="hand-drawn-annotation note-learn" aria-hidden="true">
          <span>Learn<br />New Tech</span>
          <svg width="34" height="34" viewBox="0 0 50 50" fill="none">
            <path d="M10 10 C 25 15, 35 30, 30 45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <polyline points="22,40 30,46 36,38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Left Column: Heading, Subtitle & Action */}
        <div className="hero-left-content">
          <div className="hero-badge-pill">
            <span className="badge-dot"></span>
            <span>LEARN • CONNECT • SWAP</span>
          </div>

          <h1 className="hero-main-title">
            The smarter way to <br />
            <span className="gradient-text">swap your skills</span> together.
          </h1>

          <p className="hero-subtext">
            SkillSync pairs you with students who already know the technologies you want to learn.
            Trade your knowledge, collaborate on engineering projects, and level up your career.
          </p>

          <div className="hero-social-proof">
            <div className="avatar-cluster">
              <span className="cluster-avatar av-1">👨‍💻</span>
              <span className="cluster-avatar av-2">👩‍💻</span>
              <span className="cluster-avatar av-3">🧑‍🔬</span>
              <span className="cluster-avatar av-4">👩‍🎓</span>
            </div>
            <p className="social-proof-text">
              <strong>10k+</strong> students are already swapping skills
            </p>
          </div>
        </div>

        {/* Right Column: Floating interactive preview card with wave graph */}
        <div className="hero-right-preview">
          {/* Hand-drawn annotation: Share Skills */}
          <div className="hand-drawn-annotation note-share" aria-hidden="true">
            <span>Share<br />Skills</span>
            <svg width="34" height="34" viewBox="0 0 50 50" fill="none">
              <path d="M40 10 C 25 15, 15 30, 20 45" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <polyline points="28,40 20,46 14,38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="floating-preview-card">
            <div className="preview-card-header">
              <div className="preview-brand-tag">
                <span className="preview-logo-dot"></span>
                <span>SkillSync Live Matcher</span>
              </div>
              <div className="preview-tabs">
                <span className="preview-tab active">Matches</span>
                <span className="preview-tab">Projects</span>
              </div>
            </div>

            <div className="preview-chart-area">
              <div className="preview-chart-title">SKILL COMPATIBILITY WAVE</div>
              {/* Animated glowing wave graph matching reference */}
              <div className="svg-wave-container">
                <svg viewBox="0 0 300 90" className="preview-wave-svg" preserveAspectRatio="none">
                  <path
                    d="M 0 55 C 50 30, 90 75, 140 45 C 190 15, 230 65, 300 35"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="wave-line-1"
                  />
                  <path
                    d="M 0 70 C 60 75, 110 30, 160 55 C 210 80, 250 25, 300 45"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="wave-line-2"
                  />
                </svg>
              </div>
            </div>

            <div className="preview-stats-row">
              <div className="preview-stat-chip chip-progress">
                <span className="stat-icon">↗</span>
                <div className="stat-meta">
                  <strong>+68%</strong>
                  <span>Skill Progress</span>
                </div>
              </div>

              <div className="preview-stat-chip chip-connections">
                <span className="stat-icon">👥</span>
                <div className="stat-meta">
                  <strong>{matches.length > 0 ? matches.length : '12'}</strong>
                  <span>Available Partners</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hand-drawn annotation: Work Together */}
          <div className="hand-drawn-annotation note-work" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 50 50" fill="none">
              <path d="M15 40 C 25 30, 35 20, 40 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <polyline points="30,12 42,8 44,20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Work<br />Together</span>
          </div>
        </div>
      </section>

      {/* Top Navigation Tabs for Skill Swapper */}
      <div className="swapper-tabs-container">
        <div className="finder-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'matches'}
            className={`finder-tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => handleTabChange('matches')}
            id="tab-swapper-matches"
          >
            🔍 Find Matches
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'connections'}
            className={`finder-tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
            onClick={() => handleTabChange('connections')}
            id="tab-swapper-connections"
          >
            🤝 Your Connections ({connections.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'received'}
            className={`finder-tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => handleTabChange('received')}
            id="tab-swapper-received"
          >
            📩 Received Requests
            {receivedRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span
                className="tab-badge-pill"
                title={`${receivedRequests.filter((r) => r.status === 'PENDING').length} pending incoming requests`}
              >
                {receivedRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sent'}
            className={`finder-tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => handleTabChange('sent')}
            id="tab-swapper-sent"
          >
            📤 Sent Requests ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: Find Matches View */}
      {activeTab === 'matches' && (
        <div className="swapper-main-content" id="pane-swapper-matches">
          {/* Step 1: Manage Learning Skills */}
          <LearningSkillManager
            learningSkills={learningSkills}
            onAddSkill={handleAddSkill}
            onDeleteSkill={handleDeleteSkill}
            loading={loadingSkills}
            adding={addingSkill}
            deletingId={deletingSkillId}
          />

          {/* Step 2: Main Match Action Bar */}
          <div className="matcher-cta-bar" id="find-matches-cta-bar">
            <div className="cta-left-meta">
              <span className="cta-step-badge">MATCHING ENGINE</span>
              <h3 className="cta-title">Find Students Who Can Teach You</h3>
              <p className="cta-desc">
                Compare your {learningSkills.length} desired {learningSkills.length === 1 ? 'skill' : 'skills'} against peers' known skills.
              </p>
            </div>

            <div className="cta-actions-group">
              {/* Optional Minimum Match Filter */}
              <div className="min-match-selector">
                <label htmlFor="min-matches-select" className="filter-label">Filter:</label>
                <select
                  id="min-matches-select"
                  value={minMatches}
                  onChange={(e) => setMinMatches(Number(e.target.value))}
                  className="min-matches-dropdown"
                  disabled={loadingMatches}
                >
                  <option value={1}>All Matches (1+)</option>
                  <option value={2}>Strong Matches (2+)</option>
                  <option value={3}>Super Matches (3+)</option>
                </select>
              </div>

              {/* Main CTA Button styled closely after reference */}
              <button
                type="button"
                onClick={handleFindMatches}
                disabled={loadingMatches || learningSkills.length === 0}
                className="btn-find-matches-hero"
                id="find-my-matches-btn"
              >
                {loadingMatches ? (
                  <>
                    <span className="spinner-sm"></span> Finding Matches...
                  </>
                ) : (
                  <>
                    Find My Matches <span className="btn-arrow-icon">→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 3: Match Results Area */}
          <section className="matches-results-section" id="match-results-container">
            <div className="results-header-row">
              <div>
                <h2 className="results-title">Student Matches</h2>
                <p className="results-subtitle">
                  {hasSearched
                    ? `Showing top peer candidates ordered by strongest skill alignment.`
                    : `Click "Find My Matches" above to generate your personalized partner list.`}
                </p>
              </div>

              {hasSearched && (
                <span className="results-count-pill" id="results-count-badge">
                  {matches.length} {matches.length === 1 ? 'Match Found' : 'Matches Found'}
                </span>
              )}
            </div>

            {/* Loading State */}
            {loadingMatches && (
              <div className="matches-loading-grid" id="matches-loading-state">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="match-skeleton-card">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-text line-1"></div>
                    <div className="skeleton-text line-2"></div>
                    <div className="skeleton-chips"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Not Searched Yet State */}
            {!loadingMatches && !hasSearched && (
              <div className="empty-results-card unsearched-state">
                <div className="empty-icon-circle">🎯</div>
                <h3>Ready to discover your learning partners?</h3>
                <p>
                  Add the skills you want to learn above, then click <strong>"Find My Matches"</strong> to find peers with complementary expertise.
                </p>
              </div>
            )}

            {/* No Matches Found State */}
            {!loadingMatches && hasSearched && matches.length === 0 && (
              <div className="empty-results-card no-matches-state" id="no-matches-found">
                <div className="empty-icon-circle">🔍</div>
                <h3>We couldn't find a match yet</h3>
                <p>
                  Try adding more learning skills or lowering your match filter. As other students update their known skills, new matches will appear here automatically.
                </p>
              </div>
            )}

            {/* Matches Grid */}
            {!loadingMatches && hasSearched && matches.length > 0 && (
              <div className="match-cards-grid" id="student-match-cards-grid">
                {matches.map((student) => (
                  <MatchStudentCard
                    key={student.userId}
                    student={student}
                    onViewProfile={handleOpenProfile}
                    onConnect={handleConnect}
                    onChat={handleOpenChat}
                    isConnecting={connectingUserId === student.userId}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 2: Your Connections View (Accepted Peers for Easy Chat) */}
      {activeTab === 'connections' && (
        <div className="swapper-main-content" id="pane-swapper-connections">
          <div className="connection-requests-header">
            <div>
              <h2 className="results-title">Your Connected Peers</h2>
              <p className="results-subtitle">
                Students you are connected with. Click "Chat Now" to start or continue your private conversation!
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchConnections(false)}
              disabled={loadingConnections}
              className="btn-refresh-requests"
              id="refresh-connections-swapper-btn"
            >
              🔄 Refresh
            </button>
          </div>

          {loadingConnections ? (
            <div className="matches-loading-grid">
              {[1, 2].map((n) => (
                <div key={n} className="match-skeleton-card">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-text line-1"></div>
                  <div className="skeleton-chips"></div>
                </div>
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div className="empty-results-card">
              <div className="empty-icon-circle">🤝</div>
              <h3>No active connections yet</h3>
              <p>
                Connect with matching students or accept incoming requests in <strong>Received Requests</strong> to start chatting!
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('matches')}
                className="btn-secondary mt-3"
              >
                Find Matches
              </button>
            </div>
          ) : (
            <div className="sent-requests-cards-grid" id="swapper-connections-grid">
              {connections.map((peer) => {
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
                    className="sent-connection-card"
                    id={`connected-peer-${peer.userId}`}
                  >
                    <div className="connection-card-header">
                      <div className="connection-avatar-circle">{initials}</div>
                      <div className="connection-user-details">
                        <h3 className="connection-user-name">{peer.userName}</h3>
                        <span className="connection-user-email">{peer.userEmail}</span>
                      </div>
                    </div>

                    {/* Skills tags */}
                    <div className="connection-skills-block">
                      <span className="skills-block-label">Skills:</span>
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

                    {/* Status Badge */}
                    <div className="connection-status-row">
                      <span className="badge-request-status badge-accepted">
                        🟢 Connected & Ready to Chat
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="connection-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenProfile({
                            userId: peer.userId,
                            name: peer.userName,
                            email: peer.userEmail,
                            skills: peer.skills || [],
                            connectionStatus: 'ACCEPTED',
                          })
                        }
                        className="btn-view-profile-card"
                      >
                        View Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenChat(peer)}
                        className="btn-chat-connected-card"
                        id={`chat-connected-btn-${peer.userId}`}
                      >
                        💬 Chat Now
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteConnection(peer.connectionId, peer.userName)}
                        disabled={isBusy}
                        className="btn-delete-request"
                        title="Remove connection"
                        id={`remove-connected-btn-${peer.userId}`}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Received Connection Requests View (Who requested to connect with me) */}
      {activeTab === 'received' && (
        <div className="swapper-main-content" id="pane-swapper-received">
          <div className="connection-requests-header">
            <div>
              <h2 className="results-title">Received Connection Requests</h2>
              <p className="results-subtitle">
                Students who requested to connect and swap skills with you. Accept to start chatting!
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchReceivedRequests(false)}
              disabled={loadingReceived}
              className="btn-refresh-requests"
              id="refresh-received-requests-btn"
            >
              🔄 Refresh
            </button>
          </div>

          {loadingReceived ? (
            <div className="matches-loading-grid">
              {[1, 2].map((n) => (
                <div key={n} className="match-skeleton-card">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-text line-1"></div>
                  <div className="skeleton-chips"></div>
                </div>
              ))}
            </div>
          ) : receivedRequests.length === 0 ? (
            <div className="empty-results-card">
              <div className="empty-icon-circle">📩</div>
              <h3>No incoming connection requests</h3>
              <p>
                When other students discover your profile and want to swap skills with you, their requests will appear here.
              </p>
            </div>
          ) : (
            <div className="sent-requests-cards-grid" id="received-connection-requests-grid">
              {receivedRequests.map((req) => {
                const isAccepted = req.status === 'ACCEPTED';
                const isPending = req.status === 'PENDING';
                const isRejected = req.status === 'REJECTED';
                const isBusy = processingId === req.connectionId;
                const initials = req.userName ? req.userName.charAt(0).toUpperCase() : 'S';

                return (
                  <div
                    key={req.connectionId}
                    className="sent-connection-card received-connection-card"
                    id={`received-request-${req.connectionId}`}
                  >
                    <div className="connection-card-header">
                      <div className="connection-avatar-circle">{initials}</div>
                      <div className="connection-user-details">
                        <h3 className="connection-user-name">{req.userName}</h3>
                        <span className="connection-user-email">{req.userEmail}</span>
                      </div>
                    </div>

                    {/* Skills tags */}
                    <div className="connection-skills-block">
                      <span className="skills-block-label">Skills they know:</span>
                      <div className="connection-skills-tags">
                        {req.skills && req.skills.length > 0 ? (
                          req.skills.map((s, idx) => (
                            <span key={idx} className="project-skill-pill">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted text-sm">Skills listed on profile</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="connection-status-row">
                      {isAccepted ? (
                        <span className="badge-request-status badge-accepted">
                          🟢 Connected
                        </span>
                      ) : isPending ? (
                        <span className="badge-request-status badge-pending">
                          📩 Wants to Connect
                        </span>
                      ) : isRejected ? (
                        <span className="badge-request-status badge-rejected">
                          🔴 Declined
                        </span>
                      ) : (
                        <span className="badge-request-status">{req.status}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="connection-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenProfile({
                            userId: req.userId,
                            name: req.userName,
                            email: req.userEmail,
                            skills: req.skills || [],
                            connectionStatus: isAccepted ? 'ACCEPTED' : 'PENDING_RECEIVED',
                          })
                        }
                        className="btn-view-profile-card"
                      >
                        View Profile
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(req.connectionId, req.userName)}
                            disabled={isBusy}
                            className="btn-accept-request"
                            id={`accept-req-btn-${req.connectionId}`}
                          >
                            {isBusy ? 'Processing...' : '✓ Accept'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.connectionId, req.userName)}
                            disabled={isBusy}
                            className="btn-reject-request"
                            id={`reject-req-btn-${req.connectionId}`}
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleOpenChat(req)}
                          className="btn-chat-connected-card"
                          id={`chat-received-btn-${req.connectionId}`}
                        >
                          💬 Chat
                        </button>
                      )}

                      {/* Delete connection / request anytime */}
                      <button
                        type="button"
                        onClick={() => handleDeleteConnection(req.connectionId, req.userName)}
                        disabled={isBusy}
                        className="btn-delete-request"
                        title={isAccepted ? 'Remove connection' : 'Delete request'}
                        id={`delete-received-btn-${req.connectionId}`}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Sent Connection Requests View */}
      {activeTab === 'sent' && (
        <div className="swapper-main-content" id="pane-swapper-sent">
          <div className="connection-requests-header">
            <div>
              <h2 className="results-title">Sent Connection Requests</h2>
              <p className="results-subtitle">
                Connection requests you have sent to other students.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchSentRequests(false)}
              disabled={loadingSent}
              className="btn-refresh-requests"
              id="refresh-sent-requests-btn"
            >
              🔄 Refresh
            </button>
          </div>

          {loadingSent ? (
            <div className="matches-loading-grid">
              {[1, 2].map((n) => (
                <div key={n} className="match-skeleton-card">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-text line-1"></div>
                  <div className="skeleton-chips"></div>
                </div>
              ))}
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="empty-results-card">
              <div className="empty-icon-circle">📨</div>
              <h3>No connection requests sent yet</h3>
              <p>
                Switch to <strong>Find Matches</strong> to discover peers and send your first request!
              </p>
              <button
                type="button"
                onClick={() => handleTabChange('matches')}
                className="btn-secondary mt-3"
              >
                Find Matches
              </button>
            </div>
          ) : (
            <div className="sent-requests-cards-grid" id="sent-connection-requests-grid">
              {sentRequests.map((req) => {
                const isAccepted = req.status === 'ACCEPTED';
                const isPending = req.status === 'PENDING';
                const isRejected = req.status === 'REJECTED';
                const isBusy = processingId === req.connectionId;
                const initials = req.userName ? req.userName.charAt(0).toUpperCase() : 'S';

                return (
                  <div key={req.connectionId} className="sent-connection-card" id={`sent-request-${req.connectionId}`}>
                    <div className="connection-card-header">
                      <div className="connection-avatar-circle">{initials}</div>
                      <div className="connection-user-details">
                        <h3 className="connection-user-name">{req.userName}</h3>
                        <span className="connection-user-email">{req.userEmail}</span>
                      </div>
                    </div>

                    {/* Skills tags */}
                    <div className="connection-skills-block">
                      <span className="skills-block-label">Skills:</span>
                      <div className="connection-skills-tags">
                        {req.skills && req.skills.length > 0 ? (
                          req.skills.map((s, idx) => (
                            <span key={idx} className="project-skill-pill">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted text-sm">Skills shared on profile</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="connection-status-row">
                      {isAccepted ? (
                        <span className="badge-request-status badge-accepted">
                          🟢 Connected
                        </span>
                      ) : isPending ? (
                        <span className="badge-request-status badge-pending">
                          🟡 Request Sent
                        </span>
                      ) : isRejected ? (
                        <span className="badge-request-status badge-rejected">
                          🔴 Rejected
                        </span>
                      ) : (
                        <span className="badge-request-status">{req.status}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="connection-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenProfile({
                            userId: req.userId,
                            name: req.userName,
                            email: req.userEmail,
                            skills: req.skills || [],
                            connectionStatus: isAccepted ? 'ACCEPTED' : 'PENDING_SENT',
                          })
                        }
                        className="btn-view-profile-card"
                      >
                        View Profile
                      </button>

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleOpenChat(req)}
                          className="btn-chat-connected-card"
                          id={`chat-sent-btn-${req.connectionId}`}
                        >
                          💬 Chat
                        </button>
                      )}

                      {/* Cancel/Delete Request anytime */}
                      <button
                        type="button"
                        onClick={() => handleDeleteConnection(req.connectionId, req.userName)}
                        disabled={isBusy}
                        className="btn-delete-request"
                        title={isPending ? 'Cancel connection request' : 'Delete request'}
                        id={`delete-sent-btn-${req.connectionId}`}
                      >
                        {isPending ? '🗑️ Cancel Request' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Student Profile Popup Modal */}
      <StudentProfileModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleCloseProfile}
        onConnect={handleConnect}
        onChat={handleOpenChat}
        isConnecting={connectingUserId === selectedStudent?.userId}
      />

      {/* 1-on-1 Private Chat Modal */}
      <PrivateChatModal
        peer={chatPeer}
        isOpen={isChatOpen}
        onClose={handleCloseChat}
      />
    </div>
  );
}
