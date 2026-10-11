import React from 'react';

function SkillList({ skills, onDeleteSkill, deletingId }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="empty-skills-notice">
        <p>No skills added yet. Showcase your technical skills to potential collaborators!</p>
      </div>
    );
  }

  return (
    <div className="skills-grid">
      {skills.map((skill) => (
        <div key={skill.id} className="skill-chip" id={`skill-chip-${skill.id}`}>
          <span className="skill-chip-name">{skill.name}</span>
          <button
            type="button"
            className="skill-chip-remove"
            id={`delete-skill-${skill.id}`}
            onClick={() => onDeleteSkill(skill.id, skill.name)}
            disabled={deletingId === skill.id}
            title={`Remove ${skill.name}`}
            aria-label={`Remove ${skill.name}`}
          >
            {deletingId === skill.id ? '...' : '×'}
          </button>
        </div>
      ))}
    </div>
  );
}

export default SkillList;
