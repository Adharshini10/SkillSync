import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProfile,
  updateProfile,
  getSkills,
  addSkill,
  deleteSkill,
} from '../services/profileService';
import ProfileCard from '../components/ProfileCard';
import SkillList from '../components/SkillList';
import SkillInput from '../components/SkillInput';

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial profile and skills
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const [profileData, skillsData] = await Promise.all([
          getProfile(),
          getSkills(),
        ]);

        if (isMounted) {
          setProfile(profileData);
          setSkills(skillsData || []);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 401) {
            navigate('/login');
          } else if (err.response?.status === 403) {
            setErrorMessage('Access denied. Please log in again.');
          } else if (err.response?.status === 404) {
            setErrorMessage('Profile not found.');
          } else {
            setErrorMessage(
              err.response?.data?.message ||
              'Unable to load your profile. Please check your connection and try again.'
            );
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Flash message helper
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setSuccessMessage('');
  };

  // Handle Profile Update
  const handleUpdateProfile = async (profileData) => {
    setUpdatingProfile(true);
    setErrorMessage('');
    try {
      const updated = await updateProfile(profileData);
      setProfile(updated);
      showSuccess('Profile updated successfully!');
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        showError(
          err.response?.data?.message ||
          'Failed to update profile. Please verify your input and try again.'
        );
      }
      return false;
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Add Skill
  const handleAddSkill = async (skillName) => {
    setAddingSkill(true);
    setErrorMessage('');
    try {
      const newSkill = await addSkill(skillName);
      setSkills((prev) => [...prev, newSkill]);
      showSuccess(`Skill "${newSkill.name}" added successfully!`);
    } catch (err) {
      if (err.response?.status === 409) {
        showError(`You already have the skill "${skillName}".`);
      } else if (err.response?.status === 401) {
        navigate('/login');
      } else {
        showError(
          err.response?.data?.message ||
          'Failed to add skill. Please try again.'
        );
      }
    } finally {
      setAddingSkill(false);
    }
  };

  // Handle Delete Skill
  const handleDeleteSkill = async (skillId, skillName) => {
    setDeletingSkillId(skillId);
    setErrorMessage('');
    try {
      await deleteSkill(skillId);
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      showSuccess(`Skill "${skillName}" removed.`);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        showError(
          err.response?.data?.message ||
          'Failed to remove skill. Please try again.'
        );
      }
    } finally {
      setDeletingSkillId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-card">
          <div className="spinner"></div>
          <p className="loading-text">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container profile-container">
      <div className="profile-page-header">
        <h1>My Profile</h1>
        <p className="subtitle">
          Manage your personal details and showcase your technical skills
        </p>
      </div>

      {successMessage && (
        <div className="alert alert-success" id="profile-success-alert">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger" id="profile-error-alert">
          {errorMessage}
        </div>
      )}

      {/* Profile Card Section */}
      <ProfileCard
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        updating={updatingProfile}
      />

      {/* Skills Section */}
      <div className="card skills-section-card" id="skills-card">
        <div className="skills-header">
          <div className="skills-header-title">
            <h2>My Skills</h2>
            <span className="skills-count-badge" id="skills-count">
              {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'}
            </span>
          </div>
          <p className="section-subtitle">
            Add skills so peers can find and connect with you for relevant projects.
          </p>
        </div>

        {/* Existing Skills List */}
        <SkillList
          skills={skills}
          onDeleteSkill={handleDeleteSkill}
          deletingId={deletingSkillId}
        />

        {/* Add New Skill Form */}
        <div className="add-skill-box">
          <span className="add-skill-label">Add a new skill</span>
          <SkillInput onAddSkill={handleAddSkill} loading={addingSkill} />
        </div>
      </div>
    </div>
  );
}

export default Profile;
