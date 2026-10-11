import React, { useState, useEffect } from 'react';

function ProfileCard({ profile, onUpdateProfile, updating }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    education: '',
  });
  const [validationError, setValidationError] = useState('');

  // Synchronize form data when profile prop changes
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        location: profile.location || '',
        education: profile.education || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setValidationError('');
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setValidationError('');
    // Reset to existing profile values
    if (profile) {
      setFormData({
        bio: profile.bio || '',
        location: profile.location || '',
        education: profile.education || '',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.bio && formData.bio.length > 1000) {
      setValidationError('Bio must not exceed 1000 characters.');
      return;
    }
    if (formData.location && formData.location.length > 200) {
      setValidationError('Location must not exceed 200 characters.');
      return;
    }
    if (formData.education && formData.education.length > 300) {
      setValidationError('Education must not exceed 300 characters.');
      return;
    }

    const success = await onUpdateProfile({
      bio: formData.bio.trim(),
      location: formData.location.trim(),
      education: formData.education.trim(),
    });

    if (success) {
      setIsEditing(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="card profile-card" id="profile-card">
      <div className="profile-header-section">
        <div className="profile-avatar-large">
          {getInitials(profile?.userName)}
        </div>
        <div className="profile-header-info">
          <h2 className="profile-name" id="profile-user-name">
            {profile?.userName || 'SkillSync Student'}
          </h2>
          <div className="profile-email-badge">
            <span className="profile-email" id="profile-user-email">
              {profile?.userEmail || 'student@college.edu'}
            </span>
            <span className="badge-readonly" title="Email is managed via college account and cannot be modified">
              Read-Only
            </span>
          </div>
        </div>

        {!isEditing && (
          <button
            id="edit-profile-btn"
            type="button"
            className="btn btn-secondary btn-edit-toggle"
            onClick={handleEditClick}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-edit-form" noValidate>
          {validationError && <div className="alert alert-danger">{validationError}</div>}

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Tell others about your interests, passions, and background..."
              value={formData.bio}
              onChange={handleChange}
              disabled={updating}
              maxLength={1000}
            />
            <span className="field-hint">
              {formData.bio.length} / 1000 characters
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                name="location"
                placeholder="e.g. San Francisco, CA or Bengaluru, India"
                value={formData.location}
                onChange={handleChange}
                disabled={updating}
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="education">Education</label>
              <input
                id="education"
                type="text"
                name="education"
                placeholder="e.g. B.Tech Computer Science, 3rd Year"
                value={formData.education}
                onChange={handleChange}
                disabled={updating}
                maxLength={300}
              />
            </div>
          </div>

          <div className="form-actions-row">
            <button
              id="save-profile-btn"
              type="submit"
              className="btn btn-primary"
              disabled={updating}
            >
              {updating ? 'Saving Changes...' : 'Save Profile'}
            </button>
            <button
              id="cancel-edit-btn"
              type="button"
              className="btn btn-outline"
              onClick={handleCancelClick}
              disabled={updating}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-display-section">
          <div className="profile-field-block">
            <span className="profile-field-label">About / Bio</span>
            <p className="profile-field-value bio-text" id="display-bio">
              {profile?.bio ? profile.bio : <em className="text-muted">No bio added yet. Click 'Edit Profile' to introduce yourself.</em>}
            </p>
          </div>

          <div className="profile-meta-grid">
            <div className="profile-meta-item">
              <span className="profile-field-label">📍 Location</span>
              <p className="profile-field-value" id="display-location">
                {profile?.location ? profile.location : <em className="text-muted">Not specified</em>}
              </p>
            </div>

            <div className="profile-meta-item">
              <span className="profile-field-label">🎓 Education</span>
              <p className="profile-field-value" id="display-education">
                {profile?.education ? profile.education : <em className="text-muted">Not specified</em>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
