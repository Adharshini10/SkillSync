import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjectMembers,
  getPendingJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
} from '../services/projectService';
import ApplicantProfileModal from './ApplicantProfileModal';

export default function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  currentUserId,
  onRequestJoin,
  isRequestingJoin = false,
  membershipStatus = null,
  onActionComplete, // trigger refresh in parent
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'members' | 'requests'
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [viewingApplicant, setViewingApplicant] = useState(null);

  const isOwner = project && currentUserId && project.owner?.id === currentUserId;

  // ESC key listener
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

  // Load members and join requests when modal opens
  useEffect(() => {
    if (!isOpen || !project) return;

    setActiveTab('overview');
    setStatusMessage({ type: '', text: '' });

    // Load members
    setLoadingMembers(true);
    getProjectMembers(project.id)
      .then((data) => setMembers(data || []))
      .catch((err) => console.error('Failed to load project members', err))
      .finally(() => setLoadingMembers(false));

    // If owner, load pending join requests
    if (isOwner) {
      setLoadingRequests(true);
      getPendingJoinRequests(project.id)
        .then((data) => setJoinRequests(data || []))
        .catch((err) => console.error('Failed to load join requests', err))
        .finally(() => setLoadingRequests(false));
    }
  }, [isOpen, project, isOwner]);

  if (!isOpen || !project) return null;

  const handleAcceptRequest = async (membershipId, studentName) => {
    setActionInProgressId(membershipId);
    try {
      await acceptJoinRequest(project.id, membershipId);
      setJoinRequests((prev) => prev.filter((r) => r.membershipId !== membershipId));
      setStatusMessage({ type: 'success', text: `Accepted ${studentName} into the project team!` });

      // Refresh members list
      const updatedMembers = await getProjectMembers(project.id);
      setMembers(updatedMembers || []);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to accept request.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleRejectRequest = async (membershipId, studentName) => {
    setActionInProgressId(membershipId);
    try {
      await rejectJoinRequest(project.id, membershipId);
      setJoinRequests((prev) => prev.filter((r) => r.membershipId !== membershipId));
      setStatusMessage({ type: 'info', text: `Rejected join request from ${studentName}.` });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reject request.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  const formattedDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <div className="modal-backdrop" onClick={onClose} id="project-details-backdrop">
      <div
        className="modal-container project-details-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-details-title"
        id="project-details-modal"
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="modal-close-btn"
          aria-label="Close project details"
          id="close-project-details-btn"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="modal-header-hero modal-header-standard">
          <div className="project-details-header-content">
            <div className="header-meta-badges">
              <span className={`status-badge status-${(project.status || 'OPEN').toLowerCase()}`}>
                ● {project.status}
              </span>
              {isOwner ? (
                <span className="project-role-badge role-owner">👑 You Own This Project</span>
              ) : membershipStatus === 'ACCEPTED' ? (
                <span className="project-role-badge role-member">✓ Team Member</span>
              ) : membershipStatus === 'PENDING' ? (
                <span className="project-role-badge role-pending">⌛ Request Sent</span>
              ) : null}
              {formattedDate && <span className="date-badge">Created {formattedDate}</span>}
            </div>
            <h2 id="project-details-title" className="modal-title mt-2">
              {project.title}
            </h2>
            <div className="project-creator-subtext">
              Lead by: <strong>{project.owner?.name || 'Student Creator'}</strong> ({project.owner?.email})
            </div>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage.text && (
          <div
            className={`alert-box alert-${statusMessage.type === 'error' ? 'error' : 'success'} mx-6 mt-4`}
            id="project-details-alert"
          >
            {statusMessage.text}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="project-details-tabs-bar">
          <button
            type="button"
            className={`details-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            id="details-tab-overview"
          >
            📋 Overview & Skills
          </button>
          <button
            type="button"
            className={`details-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
            id="details-tab-members"
          >
            👥 Team Members ({members.length})
          </button>
          {isOwner && (
            <button
              type="button"
              className={`details-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
              id="details-tab-requests"
            >
              📥 Join Requests {joinRequests.length > 0 && <span className="requests-count-badge">{joinRequests.length}</span>}
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="modal-body-content project-tab-pane">
            <div className="modal-section">
              <h4 className="modal-section-title">About the Project</h4>
              <p className="project-full-description">{project.description}</p>
            </div>

            <div className="modal-section">
              <h4 className="modal-section-title">Required Skills</h4>
              <div className="modal-skills-grid">
                {project.requiredSkills && project.requiredSkills.length > 0 ? (
                  project.requiredSkills.map((skill) => (
                    <span key={skill.id || skill.name} className="modal-skill-chip matched">
                      ✦ {skill.name}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">No specific skills listed.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Team Members */}
        {activeTab === 'members' && (
          <div className="modal-body-content project-tab-pane">
            {loadingMembers ? (
              <div className="loading-members-spinner">
                <span className="spinner-sm"></span> Loading team members...
              </div>
            ) : members.length === 0 ? (
              <p className="text-muted py-4">No team members joined yet.</p>
            ) : (
              <div className="project-members-list" id="project-members-list">
                {members.map((member) => (
                  <div key={member.userId} className="project-member-row">
                    <div className="member-avatar">
                      {member.userName ? member.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <span className="member-name">{member.userName}</span>
                        {member.isOwner && <span className="member-badge-owner">Project Lead</span>}
                      </div>
                      <span className="member-email">{member.userEmail}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Pending Join Requests (Owner only) */}
        {isOwner && activeTab === 'requests' && (
          <div className="modal-body-content project-tab-pane">
            {loadingRequests ? (
              <div className="loading-requests-spinner">
                <span className="spinner-sm"></span> Loading pending requests...
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="empty-requests-box">
                <span className="empty-icon">🎉</span>
                <p>No pending join requests right now.</p>
              </div>
            ) : (
              <div className="join-requests-list" id="join-requests-list">
                {joinRequests.map((req) => {
                  const isBusy = actionInProgressId === req.membershipId;
                  return (
                    <div
                      key={req.membershipId}
                      className="join-request-row"
                      id={`join-request-row-${req.membershipId}`}
                    >
                      <div className="request-student-info">
                        <div className="member-avatar">
                          {req.userName ? req.userName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <span className="request-student-name">{req.userName}</span>
                          <span className="request-student-email">{req.userEmail}</span>
                          <span className="request-timestamp">
                            Requested:{' '}
                            {req.requestedAt
                              ? new Date(req.requestedAt).toLocaleDateString()
                              : 'Recently'}
                          </span>
                        </div>
                      </div>

                      <div className="request-actions-row">
                        <button
                          type="button"
                          onClick={() => setViewingApplicant(req)}
                          className="btn-applicant-view-profile"
                          id={`modal-view-profile-btn-${req.membershipId}`}
                        >
                          👤 Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req.membershipId, req.userName)}
                          disabled={isBusy}
                          className="btn-request-accept"
                          id={`accept-request-btn-${req.membershipId}`}
                        >
                          {isBusy ? '...' : '✓ Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.membershipId, req.userName)}
                          disabled={isBusy}
                          className="btn-request-reject"
                          id={`reject-request-btn-${req.membershipId}`}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="modal-footer-actions project-details-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            id="close-details-modal-action-btn"
          >
            ✕ Close
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/projects/${project.id}?openChat=true`);
              }}
              className="btn-modal-primary btn-chat-hero"
              id="modal-open-group-chat-btn"
            >
              💬 Open Group Chat
            </button>
          )}

          {!isOwner && (
            membershipStatus === 'ACCEPTED' ? (
              <span className="btn-joined-indicator">✓ You are in this project</span>
            ) : membershipStatus === 'PENDING' ? (
              <button type="button" disabled className="btn-pending-request">
                ⌛ Request Sent
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRequestJoin(project.id)}
                disabled={isRequestingJoin || project.status === 'COMPLETED'}
                className="btn-modal-request-join"
                id="modal-request-join-btn"
              >
                {isRequestingJoin ? (
                  <>
                    <span className="spinner-sm"></span> Sending...
                  </>
                ) : project.status === 'COMPLETED' ? (
                  'Project Completed'
                ) : (
                  '🚀 Request to Join Team'
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* Applicant Profile Sub-Modal */}
      {viewingApplicant && (
        <ApplicantProfileModal
          applicant={viewingApplicant}
          isOpen={Boolean(viewingApplicant)}
          onClose={() => setViewingApplicant(null)}
          onAccept={(pId, mId, name) => {
            handleAcceptRequest(mId, name);
            setViewingApplicant(null);
          }}
          onReject={(pId, mId, name) => {
            handleRejectRequest(mId, name);
            setViewingApplicant(null);
          }}
          isBusy={actionInProgressId === viewingApplicant?.membershipId}
        />
      )}
    </div>
  );
}
