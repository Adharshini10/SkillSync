import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardProjectCard from './DashboardProjectCard';

export default function ActiveProjectsSection({
  projects = [],
  currentUserId,
  loading = false,
  error = null,
  onRetry,
  onOpenGroupChat,
}) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-section-block" aria-labelledby="heading-active-projects">
      <div className="section-block-header">
        <div className="section-title-wrap">
          <span className="section-icon-bubble" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          <h2 id="heading-active-projects" className="section-main-title">
            My Active Projects
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="section-view-all-link"
          id="btn-view-all-projects"
        >
          View All →
        </button>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="dashboard-projects-grid">
          {[1, 2].map((n) => (
            <div key={n} className="dashboard-skeleton-card">
              <div className="skeleton-line-title"></div>
              <div className="skeleton-line-desc"></div>
              <div className="skeleton-line-chips"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="dashboard-error-box">
          <p>⚠️ {error}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="btn-retry-action">
              Retry
            </button>
          )}
        </div>
      ) : projects.length === 0 ? (
        <div className="dashboard-empty-card" id="empty-active-projects">
          <div className="empty-card-icon">📁</div>
          <h3 className="empty-card-title">You haven't joined or created any active projects yet</h3>
          <p className="empty-card-desc">
            Explore exciting student projects, collaborate with peers, and build real-world applications together!
          </p>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="btn-empty-action"
            id="btn-empty-explore-projects"
          >
            Explore Projects
          </button>
        </div>
      ) : (
        <div className="dashboard-projects-grid">
          {projects.slice(0, 4).map((proj) => (
            <DashboardProjectCard
              key={proj.id}
              project={proj}
              currentUserId={currentUserId}
              onOpenGroupChat={onOpenGroupChat}
            />
          ))}
        </div>
      )}
    </section>
  );
}
