import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjectById, updateProject } from '../services/projectService';

export default function EditProject() {
  const { projectId } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchProject = async () => {
      setLoading(true);
      try {
        const data = await getProjectById(projectId);
        if (!isMounted) return;

        // Authorization check: only owner can edit
        if (data.owner && user && data.owner.id !== user.id) {
          setServerError('You do not have permission to edit this project.');
          setLoading(false);
          return;
        }

        setFormData({
          title: data.title || '',
          description: data.description || '',
          maxMembers: data.maxMembers || 5,
          status: data.status || 'OPEN',
        });

        if (data.requiredSkills) {
          setSkills(data.requiredSkills.map((s) => s.name));
        }

        if (data.lookingForRoles && data.lookingForRoles.length > 0) {
          setLookingForRoles(data.lookingForRoles);
        } else if (data.lookingFor) {
          setLookingForRoles(
            data.lookingFor.split(/[,•\n]/).map((s) => s.trim()).filter(Boolean)
          );
        }
      } catch (err) {
        if (isMounted) {
          setServerError(
            err.response?.data?.message || 'Failed to load project details for editing.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [projectId, user]);

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
      newErrors.maxMembers = 'Maximum members must be at least 2.';
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
        status: formData.status,
        lookingForRoles: lookingForRoles,
        lookingFor: lookingForRoles.join(', '),
      };

      await updateProject(projectId, payload);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to update project. Please verify inputs.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="project-page-container">
        <div className="loading-state-card">
          <div className="spinner-lg"></div>
          <p>Loading project details for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-page-container">
      <div className="project-nav-bar">
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="btn-back-link"
        >
          ← Back to Project Details
        </button>
      </div>

      <div className="project-form-wrapper">
        <div className="project-form-header">
          <div className="header-icon-box">✏️</div>
          <div>
            <h1 className="project-form-title">Edit Project</h1>
            <p className="project-form-subtitle">
              Update project details, member capacity, roles needed, or change status.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="form-alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="project-main-form" noValidate>
          {/* Status Selection */}
          <div className="form-group-card">
            <label htmlFor="edit-project-status" className="form-field-label">
              Project Status
            </label>
            <div className="status-selection-row">
              <label
                className={`status-radio-pill ${
                  formData.status === 'OPEN' ? 'active-open' : ''
                }`}
              >
                <input
                  type="radio"
                  name="projectStatus"
                  value="OPEN"
                  checked={formData.status === 'OPEN'}
                  onChange={() => setFormData({ ...formData, status: 'OPEN' })}
                />
                🟢 OPEN (Accepting Join Requests)
              </label>

              <label
                className={`status-radio-pill ${
                  formData.status === 'COMPLETED' ? 'active-closed' : ''
                }`}
              >
                <input
                  type="radio"
                  name="projectStatus"
                  value="COMPLETED"
                  checked={formData.status === 'COMPLETED'}
                  onChange={() => setFormData({ ...formData, status: 'COMPLETED' })}
                />
                🔴 CLOSED (Completed / Not accepting)
              </label>
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="edit-project-title" className="form-field-label">
              Project Title <span className="req-star">*</span>
            </label>
            <input
              id="edit-project-title"
              type="text"
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
            <label htmlFor="edit-project-description" className="form-field-label">
              Project Description <span className="req-star">*</span>
            </label>
            <textarea
              id="edit-project-description"
              rows="5"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className={`form-textarea-input ${errors.description ? 'input-error' : ''}`}
            />
            {errors.description && <span className="field-error-text">{errors.description}</span>}
          </div>

          {/* Capacity */}
          <div className="form-group">
            <label htmlFor="edit-project-max-members" className="form-field-label">
              Maximum Members Capacity <span className="req-star">*</span>
            </label>
            <div className="capacity-input-row">
              <input
                id="edit-project-max-members"
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
                👥 Total capacity (including creator).
              </span>
            </div>
            {errors.maxMembers && <span className="field-error-text">{errors.maxMembers}</span>}
          </div>

          {/* Required Skills */}
          <div className="form-group">
            <label className="form-field-label">
              Required Skills <span className="req-star">*</span>
            </label>
            <div className="chip-input-container">
              <div className="chip-input-row">
                <input
                  type="text"
                  placeholder="Add skill..."
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
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            {errors.skills && <span className="field-error-text">{errors.skills}</span>}
          </div>

          {/* Looking For Roles */}
          <div className="form-group">
            <label className="form-field-label">
              Looking For (Member Roles)
            </label>
            <div className="chip-input-container">
              <div className="chip-input-row">
                <input
                  type="text"
                  placeholder="e.g. Frontend Developer, Backend Developer..."
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
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions-row">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="btn-form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-form-submit"
              id="submit-edit-project-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm"></span> Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
