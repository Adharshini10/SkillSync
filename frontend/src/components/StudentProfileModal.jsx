import React, { useEffect } from 'react';
import MatchProgress from './MatchProgress';

export default function StudentProfileModal({
  student,
  isOpen,
  onClose,
  onConnect,
  onChat,
  isConnecting = false,
}) {
  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const {
    userId,
    name,
    bio,
    location,
    education,
    profilePictureUrl,
    skills = [],
    matchedSkills = [],
    matchCount = 0,
    matchPercentage = 0,
    connectionStatus = 'NONE',
  } = student;

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const getConnectionButtonConfig = () => {
    switch (connectionStatus) {
      case 'ACCEPTED':
        return { text: '✓ Connected', disabled: true, className: 'btn-status-connected' };
      case 'PENDING_SENT':
        return { text: '⌛ Request Sent', disabled: true, className: 'btn-status-pending' };
      case 'PENDING_RECEIVED':
        return { text: '📩 Request Received', disabled: true, className: 'btn-status-received' };
      case 'REJECTED':
      case 'NONE':
      default:
        return {
          text: isConnecting ? 'Connecting...' : 'Connect with Student',
          disabled: isConnecting,
          className: 'btn-status-connect',
        };
    }
  };

  const connConfig = getConnectionButtonConfig();

  return (
    <div className="modal-backdrop" onClick={onClose} id="student-modal-backdrop">
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-student-name"
        id="student-profile-modal"
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close profile modal"
          id="close-profile-modal-btn"
        >
          ✕
        </button>

        {/* Modal Header Card */}
        <div className="modal-header-hero">
          <div className="modal-avatar-area">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={name}
                className="modal-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="modal-avatar-fallback"
              style={{ display: profilePictureUrl ? 'none' : 'flex' }}
            >
              {initials}
            </div>
          </div>

          <div className="modal-header-info">
            <h2 id="modal-student-name" className="modal-title">
              {name}
            </h2>
            <div className="modal-meta-row">
              {education && (
                <span className="modal-meta-badge">
                  🎓 {education}
                </span>
              )}
              {location && (
                <span className="modal-meta-badge">
                  📍 {location}
                </span>
              )}
            </div>
          </div>

          {/* Big Circular Match Gauge */}
          <div className="modal-gauge-box">
            <MatchProgress percentage={matchPercentage} size={74} strokeWidth={6} />
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-content">
          {/* Bio Section */}
          <div className="modal-section">
            <h4 className="modal-section-title">About Student</h4>
            <p className="modal-bio-text">
              {bio || 'This student is passionate about peer collaboration and learning new technologies together on SkillSync.'}
            </p>
          </div>

          {/* Matched Skills Breakdown */}
          <div className="modal-section">
            <div className="modal-section-header">
              <h4 className="modal-section-title">
                ✦ Matched Skills ({matchCount})
              </h4>
              <span className="match-tag-pill">{Math.round(matchPercentage)}% Overlap</span>
            </div>
            <p className="modal-section-desc">
              Skills this student already masters that match what you want to learn:
            </p>
            <div className="modal-skills-grid">
              {matchedSkills.length > 0 ? (
                matchedSkills.map((skill, idx) => (
                  <span key={idx} className="modal-skill-chip matched">
                    <span className="check-icon">✓</span> {skill}
                  </span>
                ))
              ) : (
                <span className="text-muted">No direct matches.</span>
              )}
            </div>
          </div>

          {/* All Known Skills */}
          <div className="modal-section">
            <h4 className="modal-section-title">All Known Skills ({skills.length})</h4>
            <p className="modal-section-desc">
              Every skill this student has listed in their profile:
            </p>
            <div className="modal-skills-grid">
              {skills.map((skill, idx) => {
                const isMatched = matchedSkills.some(
                  (m) => m.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <span
                    key={idx}
                    className={`modal-skill-chip ${isMatched ? 'highlighted' : 'neutral'}`}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-secondary"
          >
            Close
          </button>
          {connectionStatus === 'ACCEPTED' && onChat && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onChat({ userId, name, email: student.email, profilePictureUrl });
              }}
              className="btn-modal-chat"
              id={`modal-chat-btn-${userId}`}
            >
              💬 Chat with Student
            </button>
          )}
          <button
            type="button"
            onClick={() => onConnect(userId)}
            disabled={connConfig.disabled}
            className={`btn-modal-primary ${connConfig.className}`}
            id={`modal-connect-btn-${userId}`}
          >
            {connConfig.text}
          </button>
        </div>
      </div>
    </div>
  );
}
