import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardStats({ skillsCount = 0, connectionsCount = 0, projectsCount = 0, loading = false }) {
  const navigate = useNavigate();

  return (
    <section className="dashboard-stats-grid" aria-label="Dashboard Statistics">
      {/* Card 1: My Skills */}
      <div
        className="dashboard-stat-card card-skills"
        onClick={() => navigate('/profile')}
        role="button"
        tabIndex={0}
        title="View My Skills on Profile"
        id="stat-card-skills"
      >
        <div className="stat-card-header">
          <span className="stat-label">My Skills</span>
          <div className="stat-icon-bubble bubble-skills" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
        </div>
        <div className="stat-number">
          {loading ? <span className="stat-skeleton-num"></span> : skillsCount}
        </div>
        <div className="stat-subtext">Skills added</div>
      </div>

      {/* Card 2: Connections */}
      <div
        className="dashboard-stat-card card-connections"
        onClick={() => navigate('/skill-swapper?tab=connections')}
        role="button"
        tabIndex={0}
        title="View Active Student Connections"
        id="stat-card-connections"
      >
        <div className="stat-card-header">
          <span className="stat-label">Connections</span>
          <div className="stat-icon-bubble bubble-connections" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div className="stat-number">
          {loading ? <span className="stat-skeleton-num"></span> : connectionsCount}
        </div>
        <div className="stat-subtext">Active connections</div>
      </div>

      {/* Card 3: Projects */}
      <div
        className="dashboard-stat-card card-projects"
        onClick={() => navigate('/projects')}
        role="button"
        tabIndex={0}
        title="View My Created and Joined Projects"
        id="stat-card-projects"
      >
        <div className="stat-card-header">
          <span className="stat-label">Projects</span>
          <div className="stat-icon-bubble bubble-projects" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        </div>
        <div className="stat-number">
          {loading ? <span className="stat-skeleton-num"></span> : projectsCount}
        </div>
        <div className="stat-subtext">Joined / Created</div>
      </div>
    </section>
  );
}
