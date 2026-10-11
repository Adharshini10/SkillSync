import React, { useState } from 'react';

function SkillInput({ onAddSkill, loading }) {
  const [skillName, setSkillName] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = skillName.trim();
    if (!trimmed) {
      setValidationError('Skill name cannot be empty.');
      return;
    }
    if (trimmed.length > 100) {
      setValidationError('Skill name must be under 100 characters.');
      return;
    }

    setValidationError('');
    onAddSkill(trimmed);
    setSkillName('');
  };

  return (
    <form onSubmit={handleSubmit} className="skill-input-form" noValidate>
      <div className="skill-input-row">
        <input
          id="skill-name-input"
          type="text"
          placeholder="Enter a skill (e.g. React, Java, Docker)"
          value={skillName}
          onChange={(e) => {
            setSkillName(e.target.value);
            if (validationError) setValidationError('');
          }}
          disabled={loading}
          className={`skill-input-field ${validationError ? 'input-error' : ''}`}
          maxLength={100}
        />
        <button
          id="add-skill-btn"
          type="submit"
          className="btn btn-primary btn-add-skill"
          disabled={loading || !skillName.trim()}
        >
          {loading ? 'Adding...' : '+ Add Skill'}
        </button>
      </div>
      {validationError && <span className="field-error">{validationError}</span>}
    </form>
  );
}

export default SkillInput;
