import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createProject } from '../services/projectService';

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxMembers: 5,
    status: 'OPEN',
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  const [lookingForRoles, setLookingForRoles] = useState([]);
  const [roleInput, setRoleInput] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Handle skills tags
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
      setErrors((prev) => ({ ...prev, skills: '' }));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Handle looking for roles tags
  const handleAddRole = () => {
    const trimmed = roleInput.trim();
    if (trimmed && !lookingForRoles.includes(trimmed)) {
      setLookingForRoles([...lookingForRoles, trimmed]);
      setRoleInput('');
    }
  };

  const handleRemoveRole = (roleToRemove) => {
    setLookingForRoles(lookingForRoles.filter((r) => r !== roleToRemove));
  };

  const handleRoleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRole();
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required.';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required.';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters.';
    }

    if (skills.length === 0) {
      newErrors.skills = 'Please add at least one required skill.';
    }

    if (!formData.maxMembers || Number(formData.maxMembers) < 2) {
      newErrors.maxMembers = 'Maximum members must be at least 2 (including owner).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        requiredSkills: skills,
        maxMembers: Number(formData.maxMembers),
        lookingForRoles: lookingForRoles,
        lookingFor: lookingForRoles.join(', '),
      };

      const created = await createProject(payload);
      navigate(`/projects/${created.id}`);
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to create project. Please check your inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="project-page-container">
      {/* Breadcrumb / Top Bar */}
      <div className="project-nav-bar">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="btn-back-link"
        >
          ← Back to Project Finder
        </button>
      </div>

      <div className="project-form-wrapper">
        <div className="project-form-header">
          <div className="header-icon-box">🚀</div>
          <div>
            <h1 className="project-form-title">Create New Project</h1>
            <p className="project-form-subtitle">
              Assemble your dream team and collaborate on innovative college projects.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="form-alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="project-main-form" noValidate>
          {/* Owner Info (Auto-assigned) */}
          <div className="form-group-card">
            <label className="form-field-label">Project Owner</label>
            <div className="owner-readonly-display">
              <div className="owner-avatar-mini">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <span className="owner-readonly-name">{user?.name || 'Current User'}</span>
                <span className="owner-readonly-email">({user?.email || 'Logged In'})</span>
              </div>
              <span className="badge-auto-owner">Creator (You)</span>
            </div>
            <p className="field-hint">
              You are automatically assigned as the project owner.
            </p>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="project-title" className="form-field-label">
              Project Title <span className="req-star">*</span>
            </label>
            <input
              id="project-title"
              type="text"
              placeholder="e.g. AI Study Assistant"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              className={`form-text-input ${errors.title ? 'input-error' : ''}`}
            />
            {errors.title && <span className="field-error-text">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="project-description" className="form-field-label">
              Project Description <span className="req-star">*</span>
            </label>
            <textarea
              id="project-description"
              rows="5"
              placeholder="Describe your project, objectives, technologies used, and what you aim to build..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className={`form-textarea-input ${errors.description ? 'input-error' : ''}`}
            />
            {errors.description && <span className="field-error-text">{errors.description}</span>}
          </div>

          {/* Capacity: Maximum Members */}
          <div className="form-group">
            <label htmlFor="project-max-members" className="form-field-label">
              Team Capacity (Max Members) <span className="req-star">*</span>
            </label>
            <div className="capacity-input-row">
              <input
                id="project-max-members"
                type="number"
                min="2"
                max="25"
                value={formData.maxMembers}
                onChange={(e) => {
                  setFormData({ ...formData, maxMembers: e.target.value });
                  if (errors.maxMembers) setErrors({ ...errors, maxMembers: '' });
                }}
                className={`form-number-input ${errors.maxMembers ? 'input-error' : ''}`}
              />
              <span className="capacity-note">
                👥 Total team size including you (owner).
              </span>
            </div>
            {errors.maxMembers && <span className="field-error-text">{errors.maxMembers}</span>}
          </div>

          {/* Required Skills Chip Input */}
          <div className="form-group">
            <label className="form-field-label">
              Required Skills <span className="req-star">*</span>
            </label>
            <div className="chip-input-container">
              <div className="chip-input-row">
                <input
                  type="text"
                  placeholder="e.g. React, Java, MySQL, Python..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  className="chip-text-input"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn-add-chip"
                >
                  + Add Skill
                </button>
              </div>
              <div className="chips-display-list">
                {skills.map((s) => (
                  <span key={s} className="tag-chip tag-chip-interactive">
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="chip-remove-btn"
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {errors.skills && <span className="field-error-text">{errors.skills}</span>}
          </div>

          {/* Members Being Searched For (Looking For Roles) */}
          <div className="form-group">
            <label className="form-field-label">
              Looking For (Member Roles)
            </label>
            <div className="chip-input-container">
              <div className="chip-input-row">
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Backend Developer, UI/UX Designer..."
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={handleRoleKeyDown}
                  className="chip-text-input"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="btn-add-chip"
                >
                  + Add Role
                </button>
              </div>
              <div className="chips-display-list">
                {lookingForRoles.map((role) => (
                  <span key={role} className="tag-chip role-tag-chip">
                    ☑ {role}
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="chip-remove-btn"
                      title="Remove role"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <p className="field-hint">
              Specify what roles or specialties you need in your team. You can update this later as team members join.
            </p>
          </div>

          {/* Form Actions */}
          <div className="form-actions-row">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="btn-form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-form-submit"
              id="submit-create-project-btn"
            >
              {isSubmitting ? (
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
