import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardProjectCard({ project, currentUserId, onOpenGroupChat }) {
  const navigate = useNavigate();

  if (!project) return null;

  const isOwner = project.owner && currentUserId && (project.owner.id === currentUserId || project.ownerId === currentUserId);
  const isAcceptedMember = project.isMember || project.isAccepted || isOwner;

  const memberCount = project.currentMembers || project.membersCount || 1;
  const maxCapacity = project.maxMembers || 5;
  const isClosed = project.status === 'COMPLETED';

  const requiredSkills = Array.isArray(project.requiredSkills)
    ? project.requiredSkills.slice(0, 3)
    : [];

  return (
    <div className="dashboard-project-card" id={`dash-project-${project.id}`}>
      <div className="project-card-top-row">
        <span className={`project-status-pill ${isClosed ? 'status-closed' : 'status-open'}`}>
          {isClosed ? '🔴 Closed' : '🟢 Open'}
        </span>
        <div className="project-members-count-pill">
          <span>👥 {memberCount} / {maxCapacity} members</span>
        </div>
      </div>

      <div className="project-card-main-info">
        <h3
          className="project-card-title"
          onClick={() => navigate(`/projects/${project.id}`)}
          title={project.title}
        >
          {project.title}
        </h3>
        <p className="project-card-desc">
          {project.description}
        </p>
      </div>

      {/* Required Skills */}
      {requiredSkills.length > 0 && (
        <div className="project-skills-list">
          {requiredSkills.map((sk, idx) => {
            const skillName = typeof sk === 'object' && sk !== null ? (sk.name || sk.skillName || '') : String(sk);
            return (
              <span key={idx} className="project-skill-tag">
                {skillName}
              </span>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="project-card-actions-bar">
        <button
          type="button"
          onClick={() => navigate(`/projects/${project.id}`)}
          className="btn-project-action btn-view-proj"
          id={`btn-view-proj-${project.id}`}
        >
          View Project
        </button>

        {isAcceptedMember && (
          <button
            type="button"
            onClick={() => onOpenGroupChat ? onOpenGroupChat(project) : navigate(`/projects/${project.id}`)}
            className="btn-project-action btn-chat-proj"
            id={`btn-chat-proj-${project.id}`}
            title="Open Team Group Chat"
          >
            💬 Group Chat
          </button>
        )}
      </div>
    </div>
  );
}
