import React, { useState } from 'react';

const POPULAR_SUGGESTIONS = [
  'Python',
  'React',
  'Machine Learning',
  'Spring Boot',
  'Java',
  'Docker',
  'AWS',
  'TypeScript',
  'Node.js',
  'Kubernetes',
];

export default function LearningSkillManager({
  learningSkills = [],
  onAddSkill,
  onDeleteSkill,
  loading = false,
  adding = false,
  deletingId = null,
}) {
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleAddSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setValidationError('Please enter a skill name.');
      return;
    }

    // Check client-side duplicate
    const exists = learningSkills.some(
      (s) => (typeof s === 'string' ? s : s?.name || '').toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setValidationError(`"${trimmed}" is already in your learning list.`);
      return;
    }

    setValidationError('');
    onAddSkill(trimmed);
    setInputValue('');
  };

  const handleSuggestionClick = (skillName) => {
    const exists = learningSkills.some(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    );
    if (exists) {
      setValidationError(`"${skillName}" is already in your learning list.`);
      return;
    }
    setValidationError('');
    onAddSkill(skillName);
  };

  return (
    <div className="learning-skills-panel" id="learning-skills-section">
      <div className="panel-header">
        <div className="panel-title-group">
          <div className="panel-icon-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <div>
            <h3 className="panel-title">Skills I Want to Learn</h3>
            <p className="panel-subtitle">
              Add the technologies and skills you wish to learn from other students.
            </p>
          </div>
        </div>

        <span className="skill-counter-badge" id="learning-skills-count">
          {learningSkills.length} {learningSkills.length === 1 ? 'Skill' : 'Skills'}
        </span>
      </div>

      {/* Chips Container */}
      <div className="learning-chips-container">
        {loading ? (
          <div className="chips-loading-placeholder">
            <span className="spinner-sm"></span> Loading learning skills...
          </div>
        ) : learningSkills.length === 0 ? (
          <div className="empty-chips-box">
            <span className="empty-chips-icon">💡</span>
            <p className="empty-chips-text">
              Start by adding the skills you want to learn to discover students who can teach you!
            </p>
          </div>
        ) : (
          <div className="chips-wrap" id="learning-skills-chips">
            {learningSkills.map((skill) => {
              const isDeleting = deletingId === skill.id;
              return (
                <div
                  key={skill.id}
                  className={`learning-chip ${isDeleting ? 'deleting' : ''}`}
                  id={`learning-chip-${skill.id}`}
                >
                  <span className="chip-name">{skill.name}</span>
                  <button
                    type="button"
                    onClick={() => onDeleteSkill(skill.id, skill.name)}
                    disabled={isDeleting}
                    className="chip-remove-btn"
                    aria-label={`Remove ${skill.name}`}
                    title={`Remove ${skill.name}`}
                    id={`remove-learning-skill-${skill.id}`}
                  >
                    {isDeleting ? '…' : '×'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Skill Input Form */}
      <form onSubmit={handleAddSubmit} className="add-skill-form" id="add-learning-skill-form">
        <div className="input-group-row">
          <div className="input-with-icon">
            <span className="input-icon">🔍</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="e.g. Python, React, Machine Learning, AWS..."
              className="skill-text-input"
              maxLength={100}
              id="learning-skill-input"
              disabled={adding}
            />
          </div>
          <button
            type="submit"
            onClick={handleAddSubmit}
            disabled={adding}
            className="btn-add-skill"
            id="add-learning-skill-btn"
          >
            {adding ? (
              <>
                <span className="spinner-sm"></span> Adding...
              </>
            ) : (
              <>+ Add Skill</>
            )}
          </button>
        </div>

        {validationError && (
          <p className="validation-error-text" id="learning-skill-error">
            {validationError}
          </p>
        )}
      </form>

      {/* Quick Suggestions */}
      <div className="quick-suggestions-row">
        <span className="suggestions-label">Popular suggestions:</span>
        <div className="suggestions-list">
          {POPULAR_SUGGESTIONS.filter(
            (s) => !learningSkills.some((ls) => ls.name.toLowerCase() === s.toLowerCase())
          )
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="suggestion-pill"
                disabled={adding}
              >
                + {s}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
