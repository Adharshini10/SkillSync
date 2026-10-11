import React from 'react';

export default function SkillMatchCard({ student, onViewProfile }) {
  if (!student) return null;

  const {
    name,
    education,
    profilePictureUrl,
    skills = [],
    matchPercentage = 0,
    connectionStatus,
  } = student;

  const initial = name ? name.charAt(0).toUpperCase() : 'S';
  const displayedSkills = skills.slice(0, 3);
  const remainingCount = skills.length - displayedSkills.length;

  return (
    <div className="dashboard-match-card" id={`dash-match-${student.userId}`}>
      <div className="match-card-top">
        {/* Avatar */}
        <div className="match-avatar-circle">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={name} className="match-avatar-img" />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* Match Percentage Pill */}
        <div className="match-percentage-badge">
          {matchPercentage}% Match
        </div>
      </div>

      {/* Info */}
      <div className="match-card-info">
        <h3 className="match-student-name" title={name}>{name}</h3>
        <p className="match-student-edu" title={education || 'SkillSync Student'}>
          {education || 'Student'}
        </p>
      </div>

      {/* Skills Chips */}
      <div className="match-skills-preview">
        {displayedSkills.map((sk, idx) => {
          const skillName = typeof sk === 'object' && sk !== null ? (sk.name || sk.skillName || '') : String(sk);
          return (
            <span key={idx} className="match-skill-pill">
              {skillName}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="match-skill-more">+{remainingCount}</span>
        )}
      </div>

      {/* Action Button */}
      <div className="match-card-footer">
        <button
          type="button"
          onClick={() => onViewProfile(student)}
          className="btn-view-match-profile"
          id={`btn-view-match-${student.userId}`}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
