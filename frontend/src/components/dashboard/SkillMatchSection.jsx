import React from 'react';
import { useNavigate } from 'react-router-dom';
import SkillMatchCard from './SkillMatchCard';

export default function SkillMatchSection({ matches = [], loading = false, error = null, onRetry, onViewProfile }) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-section-block" aria-labelledby="heading-recommended-matches">
      <div className="section-block-header">
        <div className="section-title-wrap">
          <span className="section-icon-bubble" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </span>
          <h2 id="heading-recommended-matches" className="section-main-title">
            Recommended Skill Matches
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/skill-swapper')}
          className="section-view-all-link"
          id="btn-view-all-matches"
        >
          View All →
        </button>
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="dashboard-matches-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="dashboard-skeleton-card">
              <div className="skeleton-avatar-mini"></div>
              <div className="skeleton-line-title"></div>
              <div className="skeleton-line-sub"></div>
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
      ) : matches.length === 0 ? (
        <div className="dashboard-empty-card" id="empty-skill-matches">
          <div className="empty-card-icon">⚡</div>
          <h3 className="empty-card-title">No skill matches yet</h3>
          <p className="empty-card-desc">
            Add skills you want to learn to discover students ready to swap skills with you.
          </p>
          <button
            type="button"
            onClick={() => navigate('/skill-swapper')}
            className="btn-empty-action"
            id="btn-empty-find-matches"
          >
            Find Skill Matches
          </button>
        </div>
      ) : (
        <div className="dashboard-matches-grid">
          {matches.slice(0, 3).map((student) => (
            <SkillMatchCard
              key={student.userId}
              student={student}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}
    </section>
  );
}
