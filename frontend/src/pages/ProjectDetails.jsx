import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProjectById,
  getProjectMembers,
  getPendingJoinRequests,
  sendJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest,
  removeProjectMember,
  getMyJoinRequests,
  getProjectChatHistory,
  sendProjectChatMessage,
} from '../services/projectService';
import { isProjectBookmarked, toggleProjectBookmark } from '../utils/bookmarkStorage';
import ApplicantProfileModal from '../components/ApplicantProfileModal';
import { playSendRequestSound, playAcceptRequestSound } from '../utils/soundEffects';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core project state
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [userRequestStatus, setUserRequestStatus] = useState(null); // 'PENDING' | 'ACCEPTED' | 'REJECTED' | null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingApplicant, setViewingApplicant] = useState(null);

  // Actions state
  const [isRequesting, setIsRequesting] = useState(false);
  const [managingId, setManagingId] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Bookmark & Share state
  const [bookmarked, setBookmarked] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // Group Chat Modal / Drawer state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4000);
  };

  const isOwner = project && user && project.owner && project.owner.id === user.id;
  const isAcceptedMember = userRequestStatus === 'ACCEPTED' || (members && members.some(m => m.userId === user?.id && m.status === 'ACCEPTED'));
  const isPending = userRequestStatus === 'PENDING';
  const isRejected = userRequestStatus === 'REJECTED';
  const isClosed = project?.status === 'COMPLETED';

  const memberCount = project?.currentMembers || members.length || 1;
  const maxCapacity = project?.maxMembers || 5;
  const isFull = memberCount >= maxCapacity;

  // Fetch project details, members, and requests
  const loadProjectData = async () => {
    try {
      const [projData, membersData] = await Promise.all([
        getProjectById(projectId),
        getProjectMembers(projectId).catch(() => []),
      ]);

      setProject(projData);
      setMembers(membersData || []);
      setBookmarked(isProjectBookmarked(user?.id, projData.id));

      // If owner, fetch join requests
      if (projData.owner && user && projData.owner.id === user.id) {
        try {
          const reqs = await getPendingJoinRequests(projectId);
          setPendingRequests(reqs || []);
        } catch (e) {
          console.error('Could not load pending requests for owner', e);
        }
      } else {
        // If not owner, check current user's join requests
        try {
          const myRequests = await getMyJoinRequests();
          const currentReq = myRequests.find((r) => r.projectId === Number(projectId));
          if (currentReq) {
            setUserRequestStatus(currentReq.status);
          } else {
            // Also check members list
            const foundMember = (membersData || []).find((m) => m.userId === user?.id);
            if (foundMember) {
              setUserRequestStatus(foundMember.status);
            }
          }
        } catch (e) {
          console.error('Could not load user join status', e);
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Project not found.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this project.');
      } else {
        setError('Failed to load project details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData().then(() => {
      if (window.location.search.includes('openChat=true')) {
        handleOpenChat();
      }
    });
  }, [projectId, user]);

  // Handle Request to Join
  const handleRequestJoin = async () => {
    if (isOwner) {
      showNotification('error', 'You are the owner of this project.');
      return;
    }
    if (isClosed) {
      showNotification('error', 'This project is closed and not accepting new members.');
      return;
    }
    if (isFull) {
      showNotification('error', 'This project has reached its maximum member capacity.');
      return;
    }

    setIsRequesting(true);
    try {
      await sendJoinRequest(projectId);
      playSendRequestSound();
      setUserRequestStatus('PENDING');
      showNotification('success', 'Join request sent successfully!');
      loadProjectData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send join request.';
      showNotification('error', msg);
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle Accept Request (Owner only)
  const handleAcceptRequest = async (membershipId) => {
    setManagingId(membershipId);
    try {
      await acceptJoinRequest(projectId, membershipId);
      playAcceptRequestSound();
      showNotification('success', 'Member accepted successfully!');
      loadProjectData();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to accept request.');
    } finally {
      setManagingId(null);
    }
  };

  // Handle Reject Request (Owner only)
  const handleRejectRequest = async (membershipId) => {
    setManagingId(membershipId);
    try {
      await rejectJoinRequest(projectId, membershipId);
      showNotification('success', 'Join request rejected.');
      loadProjectData();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setManagingId(null);
    }
  };

  // Handle Remove Member (Owner only)
  const handleRemoveMember = async (membershipId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }
    setManagingId(membershipId);
    try {
      await removeProjectMember(projectId, membershipId);
      showNotification('success', `Removed ${memberName} from the project.`);
      loadProjectData();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to remove member.');
    } finally {
      setManagingId(null);
    }
  };

  // Handle Bookmark
  const handleToggleBookmark = () => {
    const newState = toggleProjectBookmark(user?.id, project.id);
    setBookmarked(newState);
    showNotification('success', newState ? 'Project bookmarked!' : 'Bookmark removed.');
  };

  // Handle Share
  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SkillSync Project: ${project.title}`,
          text: `Check out this project on SkillSync: ${project.title}`,
          url: shareUrl,
        });
        return;
      } catch (err) {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } catch {
      alert(`Project URL: ${shareUrl}`);
    }
  };

  // Group Chat Modal: Open & Fetch History
  const handleOpenChat = async () => {
    setIsChatOpen(true);
    setChatLoading(true);
    try {
      const history = await getProjectChatHistory(projectId);
      setChatMessages(history || []);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to load group chat.');
    } finally {
      setChatLoading(false);
    }
  };

  // Auto-poll group chat messages every 3.5s while group chat modal is open
  useEffect(() => {
    let pollTimer = null;
    if (isChatOpen && projectId) {
      pollTimer = setInterval(async () => {
        try {
          const history = await getProjectChatHistory(projectId);
          setChatMessages(history || []);
        } catch (err) {
          // ignore background poll errors
        }
      }, 3500);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [isChatOpen, projectId]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingChat(true);
    try {
      const sent = await sendProjectChatMessage(projectId, newMessage.trim());
      setChatMessages((prev) => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="project-page-container">
        <div className="loading-state-card">
          <div className="spinner-lg"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-page-container">
        <div className="empty-state-card">
          <div className="empty-icon">⚠️</div>
          <h3>{error || 'Project not found'}</h3>
          <p>The project you are looking for may have been removed or does not exist.</p>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-primary-action"
          >
            ← Back to Project Finder
          </button>
        </div>
      </div>
    );
  }

  const ownerInitial = project.owner?.name
    ? project.owner.name.charAt(0).toUpperCase()
    : 'U';

  const lookingForList = project.lookingForRoles && project.lookingForRoles.length > 0
    ? project.lookingForRoles
    : project.lookingFor
    ? project.lookingFor.split(/[,•\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="project-page-container">
      {/* Top Navigation Bar */}
      <div className="project-nav-bar">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="btn-back-link"
        >
          ← Back to Project Finder
        </button>

        <div className="project-nav-actions">
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`btn-utility-top ${bookmarked ? 'active' : ''}`}
            title={bookmarked ? 'Bookmarked' : 'Save Bookmark'}
          >
            {bookmarked ? '🔖 Saved' : '🏷️ Bookmark'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn-utility-top"
            title="Share Project"
          >
            ↗ Share
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="project-top-toast" role="status">
          ✓ Project link copied to clipboard!
        </div>
      )}

      {/* Notification Banner */}
      {notification.message && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Project Main Hero Card */}
      <div className="project-details-hero">
        <div className="hero-status-row">
          <span
            className={`project-status-badge ${
              isClosed ? 'status-closed' : 'status-open'
            }`}
          >
            {isClosed ? '🔴 CLOSED' : '🟢 OPEN'}
          </span>

          {isOwner ? (
            <span className="project-role-badge role-owner">👑 Project Owner (You)</span>
          ) : isAcceptedMember ? (
            <span className="project-role-badge role-member">✓ Team Member</span>
          ) : isPending ? (
            <span className="project-role-badge role-pending">⌛ Request Sent</span>
          ) : isRejected ? (
            <span className="project-role-badge role-rejected">🔴 Request Rejected</span>
          ) : null}
        </div>

        <h1 className="project-hero-title">{project.title}</h1>

        {/* Creator Info & Metadata */}
        <div className="hero-creator-meta">
          <div className="creator-avatar-bubble">{ownerInitial}</div>
          <div className="creator-details-block">
            <span className="creator-name-label">
              Owner: <strong>{project.owner?.name || 'Anonymous Student'}</strong>
            </span>
            <span className="creator-email-label">
              {project.owner?.email || 'SkillSync Member'}
            </span>
          </div>

          <div className="creator-capacity-badge">
            <span className="capacity-badge-icon">👥</span>
            <span>
              <strong>{memberCount}</strong> / {maxCapacity} Members
            </span>
            {isFull && !isClosed && (
              <span className="capacity-tag-full">Capacity Reached</span>
            )}
          </div>
        </div>

        {/* Main Action Bar */}
        <div className="hero-action-buttons-bar">
          {isOwner ? (
            <>
              <button
                type="button"
                onClick={() => navigate(`/projects/${project.id}/edit`)}
                className="btn-action-curved btn-edit-hero"
                id="edit-project-hero-btn"
              >
                ✏️ Edit Project
              </button>
              <button
                type="button"
                onClick={handleOpenChat}
                className="btn-action-curved btn-chat-hero"
                id="open-group-chat-hero-btn"
              >
                💬 Open Group Chat
              </button>
            </>
          ) : isAcceptedMember ? (
            <button
              type="button"
              onClick={handleOpenChat}
              className="btn-action-curved btn-chat-hero"
              id="open-group-chat-hero-btn"
            >
              💬 Open Group Chat
            </button>
          ) : isPending ? (
            <button
              type="button"
              disabled
              className="btn-action-curved btn-pending-hero"
            >
              ⌛ Request Sent (Awaiting Owner Review)
            </button>
          ) : isRejected ? (
            <button
              type="button"
              disabled
              className="btn-action-curved btn-rejected-hero"
            >
              🔴 Join Request Rejected
            </button>
          ) : isClosed ? (
            <button
              type="button"
              disabled
              className="btn-action-curved btn-disabled-hero"
            >
              🔴 Project Closed
            </button>
          ) : isFull ? (
            <button
              type="button"
              disabled
              className="btn-action-curved btn-disabled-hero"
            >
              👥 Project Full
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRequestJoin}
              disabled={isRequesting}
              className="btn-action-curved btn-join-hero"
              id="request-join-hero-btn"
            >
              {isRequesting ? (
                <>
                  <span className="spinner-sm"></span> Sending Request...
                </>
              ) : (
                '🚀 Request to Join'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Grid: Details & Team Sections */}
      <div className="project-details-grid">
        {/* Left Column: Description, Skills, Looking For */}
        <div className="details-main-column">
          {/* Description */}
          <div className="details-card-block">
            <h2 className="block-section-title">Project Overview</h2>
            <div className="project-full-description">
              {project.description}
            </div>
          </div>

          {/* Looking For Roles */}
          {lookingForList.length > 0 && (
            <div className="details-card-block">
              <h2 className="block-section-title">Looking For (Desired Roles)</h2>
              <div className="roles-tags-wrapper">
                {lookingForList.map((role, idx) => (
                  <span key={idx} className="role-chip-large">
                    ☑ {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          <div className="details-card-block">
            <h2 className="block-section-title">Required Skills</h2>
            <div className="skills-tags-wrapper">
              {project.requiredSkills && project.requiredSkills.length > 0 ? (
                project.requiredSkills.map((s) => (
                  <span key={s.id || s.name} className="project-skill-pill skill-pill-large">
                    {s.name}
                  </span>
                ))
              ) : (
                <span className="text-muted">No specific skills listed.</span>
              )}
            </div>
          </div>

          {/* Owner Manage Join Requests (Owner Only) */}
          {isOwner && (
            <div className="details-card-block" id="owner-join-requests-section">
              <div className="block-header-with-badge">
                <h2 className="block-section-title">Pending Join Requests</h2>
                <span className="requests-count-badge">
                  {pendingRequests.length} Pending
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="empty-sub-state">
                  <p>No pending join requests right now.</p>
                </div>
              ) : (
                <div className="pending-requests-list">
                  {pendingRequests.map((req) => (
                    <div key={req.membershipId} className="pending-request-card">
                      <div className="applicant-info">
                        <div className="applicant-avatar">
                          {req.userName ? req.userName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <h4 className="applicant-name">{req.userName}</h4>
                          <span className="applicant-email">{req.userEmail}</span>
                        </div>
                      </div>

                      <div className="applicant-actions">
                        <button
                          type="button"
                          onClick={() => setViewingApplicant(req)}
                          className="btn-applicant-view-profile"
                          id={`details-view-profile-btn-${req.membershipId}`}
                        >
                          👤 View Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req.membershipId)}
                          disabled={managingId === req.membershipId}
                          className="btn-applicant-accept"
                          id={`accept-request-btn-${req.membershipId}`}
                        >
                          ✓ Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.membershipId)}
                          disabled={managingId === req.membershipId}
                          className="btn-applicant-reject"
                          id={`reject-request-btn-${req.membershipId}`}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Members Roster & Info */}
        <div className="details-side-column">
          <div className="details-card-block">
            <div className="block-header-with-badge">
              <h2 className="block-section-title">Team Roster</h2>
              <span className="roster-count-badge">
                {members.length || 1} / {maxCapacity}
              </span>
            </div>

            <div className="team-roster-list">
              {/* Owner Card in roster */}
              <div className="roster-member-item is-owner-item">
                <div className="member-avatar-mini">
                  {ownerInitial}
                </div>
                <div className="member-info-mini">
                  <span className="member-name-text">
                    {project.owner?.name || 'Owner'}
                  </span>
                  <span className="member-badge-owner">Project Owner</span>
                </div>
              </div>

              {/* Accepted Members */}
              {members
                .filter((m) => !m.isOwner && m.userId !== project.owner?.id)
                .map((m) => (
                  <div key={m.membershipId} className="roster-member-item">
                    <div className="member-avatar-mini">
                      {m.userName ? m.userName.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div className="member-info-mini">
                      <span className="member-name-text">{m.userName}</span>
                      <span className="member-sub-text">
                        {m.roleInProject || 'Team Member'}
                      </span>
                    </div>

                    {/* Owner can remove accepted members */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.membershipId, m.userName)}
                        disabled={managingId === m.membershipId}
                        className="btn-remove-member"
                        title="Remove member"
                        id={`remove-member-btn-${m.membershipId}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Project Group Chat Drawer/Modal */}
      {isChatOpen && (
        <div className="group-chat-overlay" onClick={() => setIsChatOpen(false)}>
          <div
            className="group-chat-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="group-chat-header">
              <div>
                <h3 className="group-chat-title">💬 {project.title} — Team Chat</h3>
                <span className="group-chat-subtitle">
                  Accepted team members & owner only
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="btn-chat-close"
                aria-label="Close group chat"
              >
                ✕
              </button>
            </div>

            <div className="group-chat-messages-body">
              {chatLoading ? (
                <div className="chat-loading-state">
                  <span className="spinner-sm"></span> Loading messages...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="chat-empty-state">
                  <p>👋 No messages yet in this project chat.</p>
                  <span>Say hello to your fellow team members!</span>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`chat-message-bubble ${isMe ? 'message-mine' : 'message-theirs'}`}
                    >
                      <div className="message-header-row">
                        <span className="message-sender-name">
                          {isMe ? 'You' : msg.senderName || 'Member'}
                        </span>
                      </div>
                      <div className="message-text-content">{msg.content}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendChatMessage} className="group-chat-input-bar">
              <input
                type="text"
                placeholder="Type a message to your team..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="group-chat-text-input"
              />
              <button
                type="submit"
                disabled={sendingChat || !newMessage.trim()}
                className="btn-group-chat-send"
              >
                {sendingChat ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Applicant Profile Sub-Modal */}
      {viewingApplicant && (
        <ApplicantProfileModal
          applicant={viewingApplicant}
          isOpen={Boolean(viewingApplicant)}
          onClose={() => setViewingApplicant(null)}
          onAccept={(pId, mId) => {
            handleAcceptRequest(mId);
            setViewingApplicant(null);
          }}
          onReject={(pId, mId) => {
            handleRejectRequest(mId);
            setViewingApplicant(null);
          }}
          isBusy={managingId === viewingApplicant?.membershipId}
        />
      )}
    </div>
  );
}
