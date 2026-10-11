import React, { useEffect } from 'react';

/**
 * Modal to display an applicant's profile for project owners reviewing join requests.
 * Allows the owner to see applicant details (Name, Target Project, Bio, Education, Location, Skills)
 * and accept or reject the request directly from the profile view.
 */
export default function ApplicantProfileModal({
  applicant,
  isOpen,
  onClose,
  onAccept,
  onReject,
  isBusy = false,
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

  if (!isOpen || !applicant) return null;

  const name = applicant.userName || applicant.name || 'Student Applicant';
  const email = applicant.userEmail || applicant.email || '';
  const bio = applicant.userBio || applicant.bio || 'This student has not written a personal bio yet.';
  const location = applicant.userLocation || applicant.location;
  const education = applicant.userEducation || applicant.education;
  const profilePictureUrl = applicant.userProfilePicture || applicant.profilePictureUrl;
  const skills = applicant.userSkills || applicant.skills || [];
  const projectTitle = applicant.projectTitle || applicant.targetProjectTitle || 'Project Team';
  const requestedDate = applicant.requestedAt
    ? new Date(applicant.requestedAt).toLocaleDateString()
    : 'Recently';

  const initials = name
    ? name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'A';

  return (
    <div className="modal-backdrop" onClick={onClose} id="applicant-modal-backdrop">
      <div
        className="modal-container applicant-profile-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-modal-name"
        id="applicant-profile-modal"
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn btn-modal-close"
          aria-label="Close applicant profile modal"
          id="close-applicant-modal-btn"
        >
          ✕
        </button>

        {/* Header Hero */}
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
            <div className="applicant-badge-cluster">
              <span className="applicant-badge-pill">👤 Team Applicant</span>
              <span className="applicant-date-pill">Requested: {requestedDate}</span>
            </div>
            <h2 id="applicant-modal-name" className="modal-title">
              {name}
            </h2>
            {email && <span className="applicant-email-sub">{email}</span>}
            <div className="modal-meta-row mt-2">
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
        </div>

        {/* Project Target Notice Bar */}
        <div className="applicant-project-target-bar" id="applicant-target-project-bar">
          <span className="target-bar-icon">🎯</span>
          <div className="target-bar-text">
            <span className="target-bar-label">Requested to Join Project:</span>
            <strong className="target-bar-title">{projectTitle}</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body-content">
          {/* About / Bio */}
          <div className="modal-section">
            <h4 className="modal-section-title">About the Student</h4>
            <p className="modal-bio-text">{bio}</p>
          </div>

          {/* Known Skills */}
          <div className="modal-section">
            <div className="modal-section-header">
              <h4 className="modal-section-title">
                Technical Skills ({skills.length})
              </h4>
            </div>
            <div className="modal-skills-grid">
              {skills.length > 0 ? (
                skills.map((skill, idx) => (
                  <span key={idx} className="modal-skill-chip highlighted">
                    ✦ {skill}
                  </span>
                ))
              ) : (
                <span className="text-muted">No skills listed in profile yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-secondary btn-modal-close"
            id="applicant-modal-close-action"
          >
            Close
          </button>

          {onReject && (
            <button
              type="button"
              onClick={() => onReject(applicant.projectId, applicant.membershipId, name)}
              disabled={isBusy}
              className="btn-applicant-reject"
              id="applicant-modal-reject-btn"
            >
              ✕ Reject
            </button>
          )}

          {onAccept && (
            <button
              type="button"
              onClick={() => onAccept(applicant.projectId, applicant.membershipId, name)}
              disabled={isBusy}
              className="btn-modal-primary btn-applicant-accept"
              id="applicant-modal-accept-btn"
            >
              {isBusy ? 'Processing...' : '✓ Accept Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
