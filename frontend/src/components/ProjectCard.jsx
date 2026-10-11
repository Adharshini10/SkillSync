import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isProjectBookmarked, toggleProjectBookmark } from '../utils/bookmarkStorage';

export default function ProjectCard({
  project,
  currentUserId,
  onViewDetails,
  onRequestJoin,
  isRequesting = false,
  membershipStatus = null, // 'PENDING' | 'ACCEPTED' | 'REJECTED' | null
  pendingRequestsCount = 0,
  onBookmarkChange,
}) {
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(() =>
    isProjectBookmarked(currentUserId, project?.id)
  );
  const [shareToast, setShareToast] = useState(false);

  const isOwner = project.owner && currentUserId && project.owner.id === currentUserId;
  const isAcceptedMember = membershipStatus === 'ACCEPTED';
  const isPending = membershipStatus === 'PENDING';
  const isRejected = membershipStatus === 'REJECTED';

  const currentCount = project.currentMembers || 1;
  const maxCapacity = project.maxMembers || 5;
  const isFull = currentCount >= maxCapacity;
  const isClosed = project.status === 'COMPLETED';

  // Format date: e.g. 28 Sep 2026
  const formatCreatedDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleToggleBookmark = (e) => {
    e.stopPropagation();
    const newState = toggleProjectBookmark(currentUserId, project.id);
    setBookmarked(newState);
    if (onBookmarkChange) {
      onBookmarkChange(project.id, newState);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/projects/${project.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SkillSync Project: ${project.title}`,
          text: `Check out this project on SkillSync: ${project.title}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share cancelled/unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } catch {
      alert(`Project link: ${shareUrl}`);
    }
  };

  const handleView = () => {
    if (onViewDetails) {
      onViewDetails(project);
    } else {
      navigate(`/projects/${project.id}`);
    }
  };

  const ownerInitial = project.owner?.name
    ? project.owner.name.charAt(0).toUpperCase()
    : 'U';

  const lookingForList = project.lookingForRoles && project.lookingForRoles.length > 0
    ? project.lookingForRoles
    : project.lookingFor
    ? project.lookingFor.split(/[,•\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="project-card" id={`project-card-${project.id}`}>
      {/* Toast popup for sharing */}
      {shareToast && (
        <div className="project-card-toast" role="status">
          ✓ Project link copied!
        </div>
      )}

      {/* Card Header: Status Badge & Role */}
      <div className="project-card-header">
        <span
          className={`project-status-badge ${
            isClosed ? 'status-closed' : 'status-open'
          }`}
        >
          {isClosed ? '🔴 CLOSED' : '🟢 OPEN'}
        </span>

        {isOwner ? (
          <div className="card-owner-badges-wrap">
            <span className="project-role-badge role-owner">👑 Owner</span>
            {pendingRequestsCount > 0 && (
              <span
                className="project-role-badge role-pending-alert"
                id={`pending-requests-badge-${project.id}`}
                title={`${pendingRequestsCount} student${pendingRequestsCount > 1 ? 's' : ''} requested to join`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleView();
                }}
              >
                🔔 {pendingRequestsCount} Pending Request{pendingRequestsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        ) : isAcceptedMember ? (
          <span className="project-role-badge role-member">✓ Team Member</span>
        ) : isPending ? (
          <span className="project-role-badge role-pending">⌛ Request Sent</span>
        ) : isRejected ? (
          <span className="project-role-badge role-rejected">🔴 Rejected</span>
        ) : null}
      </div>

      {/* Project Title */}
      <h3 className="project-title" onClick={handleView} title={project.title}>
        {project.title}
      </h3>

      {/* Owner Metadata with Avatar */}
      <div className="project-owner-meta">
        <div className="owner-avatar-mini">{ownerInitial}</div>
        <div className="owner-details-mini">
          <span className="owner-name-mini">{project.owner?.name || 'Student Creator'}</span>
          <span className="owner-sub-mini">Project Owner</span>
        </div>
      </div>

      {/* Description Snippet */}
      <p className="project-description-snippet">
        {project.description}
      </p>

      {/* Capacity: Member Count */}
      <div className="project-capacity-pill">
        <span className="capacity-icon">👥</span>
        <span className="capacity-text">
          <strong>{currentCount}</strong> / {maxCapacity} Members
        </span>
        {isFull && !isClosed && (
          <span className="capacity-tag-full">Full</span>
        )}
      </div>

      {/* Looking For Roles Section */}
      {lookingForList.length > 0 && (
        <div className="project-looking-for-section">
          <span className="project-section-subtitle">Looking For</span>
          <div className="project-roles-chips">
            {lookingForList.map((role, idx) => (
              <span key={idx} className="project-role-chip">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Required Skills Section */}
      <div className="project-skills-section">
        <span className="project-section-subtitle">Required Skills</span>
        <div className="project-skills-list">
          {project.requiredSkills && project.requiredSkills.length > 0 ? (
            project.requiredSkills.map((s) => (
              <span key={s.id || s.name} className="project-skill-pill">
                {s.name}
              </span>
            ))
          ) : (
            <span className="text-muted text-sm">General collaboration</span>
          )}
        </div>
      </div>

      {/* Creation Date */}
      {project.createdAt && (
        <div className="project-date-row">
          <span className="project-date-label">Created:</span>
          <span className="project-date-val">{formatCreatedDate(project.createdAt)}</span>
        </div>
      )}

      {/* Primary Card Actions */}
      <div className="project-card-actions">
        <button
          type="button"
          onClick={handleView}
          className="btn-project-details"
          id={`view-project-btn-${project.id}`}
        >
          View Project
        </button>

        {isOwner ? (
          <button
            type="button"
            onClick={handleView}
            className="btn-project-action btn-manage-project"
            id={`manage-project-btn-${project.id}`}
          >
            ⚙ Manage Team {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}
          </button>
        ) : isAcceptedMember ? (
          <button
            type="button"
            onClick={handleView}
            className="btn-project-action btn-joined-member"
            id={`joined-project-btn-${project.id}`}
          >
            ✓ Joined Team
          </button>
        ) : isPending ? (
          <button
            type="button"
            disabled
            className="btn-project-action btn-pending-request"
            id={`pending-project-btn-${project.id}`}
          >
            ⌛ Request Sent
          </button>
        ) : isRejected ? (
          <button
            type="button"
            disabled
            className="btn-project-action btn-rejected-request"
            id={`rejected-project-btn-${project.id}`}
          >
            🔴 Rejected
          </button>
        ) : isClosed ? (
          <button
            type="button"
            disabled
            className="btn-project-action btn-disabled-status"
            id={`closed-project-btn-${project.id}`}
          >
            🔴 Closed
          </button>
        ) : isFull ? (
          <button
            type="button"
            disabled
            className="btn-project-action btn-disabled-status"
            id={`full-project-btn-${project.id}`}
          >
            👥 Project Full
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRequestJoin(project.id)}
            disabled={isRequesting}
            className="btn-project-action btn-join-project"
            id={`join-project-btn-${project.id}`}
          >
            {isRequesting ? (
              <>
                <span className="spinner-sm"></span> Sending...
              </>
            ) : (
              'Request to Join'
            )}
          </button>
        )}
      </div>

      {/* Utility Bottom Bar: Save & Share */}
      <div className="project-card-utility-bar">
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`btn-utility-card ${bookmarked ? 'bookmarked' : ''}`}
          title={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
          id={`bookmark-btn-${project.id}`}
        >
          <span className="util-icon">{bookmarked ? '🔖' : '🏷️'}</span>
          <span className="util-text">{bookmarked ? 'Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="btn-utility-card"
          title="Share Project"
          id={`share-btn-${project.id}`}
        >
          <span className="util-icon">↗</span>
          <span className="util-text">Share</span>
        </button>

        {(isOwner || isAcceptedMember) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project.id}?openChat=true`);
            }}
            className="btn-utility-card btn-card-chat-shortcut"
            title="Open Team Group Chat"
            id={`card-chat-btn-${project.id}`}
          >
            <span className="util-icon">💬</span>
            <span className="util-text">Group Chat</span>
          </button>
        )}
      </div>
    </div>
  );
}
