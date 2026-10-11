import React from 'react';
import MatchProgress from './MatchProgress';

export default function MatchStudentCard({
  student,
  onViewProfile,
  onConnect,
  onChat,
  isConnecting = false,
}) {
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

  // Determine Connect Button state and text
  const getConnectionButtonConfig = () => {
    switch (connectionStatus) {
      case 'ACCEPTED':
        return {
          text: '✓ Connected',
          disabled: true,
          className: 'btn-status-connected',
        };
      case 'PENDING_SENT':
        return {
          text: '⌛ Request Sent',
          disabled: true,
          className: 'btn-status-pending',
        };
      case 'PENDING_RECEIVED':
        return {
          text: '📩 Request Received',
          disabled: true,
          className: 'btn-status-received',
        };
      case 'REJECTED':
      case 'NONE':
      default:
        return {
          text: isConnecting ? 'Connecting...' : 'Connect',
          disabled: isConnecting,
          className: 'btn-status-connect',
        };
    }
  };

  const connConfig = getConnectionButtonConfig();

  // Avatar Initials
  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="match-student-card" id={`student-card-${userId}`}>
      {/* Top Header Row: Avatar, Info, and Circular Progress Gauge */}
      <div className="card-top-row">
        <div className="student-profile-summary">
          <div className="student-avatar-wrap">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={name}
                className="student-avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="student-avatar-fallback"
              style={{ display: profilePictureUrl ? 'none' : 'flex' }}
            >
              {initials}
            </div>
          </div>

          <div className="student-header-meta">
            <h4 className="student-name" title={name}>
              {name}
            </h4>
            {(education || location) && (
              <div className="student-submeta">
                {education && (
                  <span className="meta-badge education-badge" title={education}>
                    🎓 {education}
                  </span>
                )}
                {location && (
                  <span className="meta-badge location-badge" title={location}>
                    📍 {location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Circular Progress Gauge */}
        <div className="card-progress-wrap">
          <MatchProgress percentage={matchPercentage} size={64} strokeWidth={5.5} />
        </div>
      </div>

      {/* Bio Snippet */}
      {bio ? (
        <p className="student-bio" title={bio}>
          {bio.length > 120 ? `${bio.slice(0, 120)}...` : bio}
        </p>
      ) : (
        <p className="student-bio-placeholder">
          Ready to swap skills and collaborate on engineering projects.
        </p>
      )}

      {/* Matched Skills Section (The "Why we match") */}
      <div className="skills-group matched-skills-group">
        <div className="skills-group-label">
          <span className="label-icon">✦</span>
          <span>Matched Skills ({matchCount}):</span>
        </div>
        <div className="skills-chips-row">
          {matchedSkills.length > 0 ? (
            matchedSkills.map((skill, idx) => (
              <span key={idx} className="skill-chip matched-chip">
                <span className="chip-check">✓</span> {skill}
              </span>
            ))
          ) : (
            <span className="no-skills-text">None</span>
          )}
        </div>
      </div>

      {/* Student's Full Skills ("My Skills") */}
      <div className="skills-group all-skills-group">
        <div className="skills-group-label">
          <span>All Skills ({skills.length}):</span>
        </div>
        <div className="skills-chips-row">
          {skills.slice(0, 5).map((skill, idx) => {
            const isMatched = matchedSkills.some(
              (m) => m.toLowerCase() === skill.toLowerCase()
            );
            return (
              <span
                key={idx}
                className={`skill-chip ${isMatched ? 'highlighted-candidate-chip' : 'neutral-chip'}`}
              >
                {skill}
              </span>
            );
          })}
          {skills.length > 5 && (
            <span className="skill-chip more-chip">+{skills.length - 5} more</span>
          )}
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="card-actions-row">
        <button
          type="button"
          onClick={() => onViewProfile(student)}
          className="btn-card-secondary"
          id={`view-profile-btn-${userId}`}
        >
          View Profile
        </button>

        {connectionStatus === 'ACCEPTED' && onChat && (
          <button
            type="button"
            onClick={() => onChat(student)}
            className="btn-card-chat"
            id={`chat-card-btn-${userId}`}
          >
            💬 Chat
          </button>
        )}

        <button
          type="button"
          onClick={() => onConnect(userId)}
          disabled={connConfig.disabled}
          className={`btn-card-primary ${connConfig.className}`}
          id={`connect-btn-${userId}`}
        >
          {connConfig.text}
        </button>
      </div>
    </div>
  );
}
