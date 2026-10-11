import React, { useState, useEffect } from 'react';

const POPULAR_SKILL_SUGGESTIONS = [
  'React',
  'Node.js',
  'Python',
  'Spring Boot',
  'Docker',
  'Java',
  'TypeScript',
  'Machine Learning',
  'AWS',
  'PostgreSQL',
  'MongoDB',
  'Figma',
];

export default function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  isCreating = false,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isCreating) {
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
  }, [isOpen, onClose, isCreating]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setSkillInput('');
      setRequiredSkills([]);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || skillInput).trim();
    if (!trimmed) return;

    if (requiredSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage(`Skill "${trimmed}" is already added.`);
      return;
    }

    setRequiredSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
    setErrorMessage('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle || trimmedTitle.length < 3) {
      setErrorMessage('Project title must be at least 3 characters.');
      return;
    }

    if (!trimmedDesc || trimmedDesc.length < 5) {
      setErrorMessage('Project description must be at least 5 characters.');
      return;
    }

    if (requiredSkills.length === 0) {
      setErrorMessage('Please add at least one required skill for the project.');
      return;
    }

    setErrorMessage('');
    onCreateProject({
      title: trimmedTitle,
      description: trimmedDesc,
      requiredSkills,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="create-project-modal-backdrop">
      <div
        className="modal-container create-project-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-modal-title"
        id="create-project-modal"
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
          className="modal-close-btn"
          aria-label="Close create project modal"
          id="close-create-project-modal-btn"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="modal-header-hero modal-header-standard">
          <div className="modal-icon-badge">🚀</div>
          <div>
            <h2 id="create-project-modal-title" className="modal-title">
              Create New Project
            </h2>
            <p className="modal-subtitle">
              Assemble a team, share requirements, and invite talented peers to collaborate.
            </p>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="modal-body-content create-project-form" id="create-project-form">
          {errorMessage && (
            <div className="alert-box alert-error" id="create-project-error-alert">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="project-title-input" className="form-label">
              Project Title <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="project-title-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="e.g. AI-Powered Smart Campus Navigation System"
              maxLength={150}
              required
              disabled={isCreating}
              className="form-input"
            />
            <span className="field-hint">{title.length}/150 characters</span>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="project-desc-input" className="form-label">
              Project Description <span className="required-star">*</span>
            </label>
            <textarea
              id="project-desc-input"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Describe the project goals, responsibilities, roadmap, and what you are looking for in teammates..."
              rows={4}
              maxLength={3000}
              required
              disabled={isCreating}
              className="form-textarea"
            />
            <span className="field-hint">{description.length}/3000 characters</span>
          </div>

          {/* Required Skills Builder */}
          <div className="form-group">
            <label className="form-label">
              Required Skills <span className="required-star">*</span>
            </label>
            <div className="input-with-button-row">
              <input
                type="text"
                id="project-skill-input"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type a skill and press Enter or Add"
                disabled={isCreating}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => handleAddSkill()}
                disabled={isCreating || !skillInput.trim()}
                className="btn-add-tag"
                id="add-project-skill-btn"
              >
                + Add
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="quick-suggestions-row mt-2">
              <span className="suggestions-label">Suggestions:</span>
              <div className="suggestions-list">
                {POPULAR_SKILL_SUGGESTIONS.filter(
                  (s) => !requiredSkills.some((rs) => rs.toLowerCase() === s.toLowerCase())
                )
                  .slice(0, 6)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      disabled={isCreating}
                      className="suggestion-pill"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            {/* Selected Skills Chips */}
            <div className="project-selected-skills mt-3" id="selected-skills-chips">
              {requiredSkills.length > 0 ? (
                requiredSkills.map((skill) => (
                  <span key={skill} className="learning-chip active-chip">
                    <span className="chip-name">{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={isCreating}
                      className="chip-remove-btn"
                      title={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-muted text-sm italic">
                  No skills added yet. Add at least 1 required skill.
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="modal-footer-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="btn-secondary"
              id="cancel-create-project-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary"
              id="create-project-submit-btn"
            >
              {isCreating ? (
                <>
                  <span className="spinner-sm"></span> Creating Project...
                </>
              ) : (
                '🚀 Publish Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
