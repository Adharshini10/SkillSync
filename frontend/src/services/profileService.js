import api from './api';

/**
 * Service for Profile and Skills management.
 * All requests use the centralized Axios instance which automatically attaches the JWT.
 * User ID is never sent from the frontend; the backend extracts it from the JWT token.
 */

/**
 * Fetch the authenticated student's profile.
 * GET /api/profile
 * @returns {Promise<object>} ProfileResponse { id, bio, profilePicture, location, education, userId, userName, userEmail }
 */
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

/**
 * Update the authenticated student's profile.
 * PUT /api/profile
 * @param {object} profileData { bio, location, education, profilePicture }
 * @returns {Promise<object>} Updated ProfileResponse
 */
export const updateProfile = async (profileData) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};

/**
 * Fetch the list of skills associated with the authenticated student's profile.
 * GET /api/profile/skills
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export const getSkills = async () => {
  const response = await api.get('/profile/skills');
  return response.data;
};

/**
 * Add a new skill to the authenticated student's profile.
 * POST /api/profile/skills
 * @param {string} skillName
 * @returns {Promise<{ id: number, name: string }>}
 */
export const addSkill = async (skillName) => {
  const response = await api.post('/profile/skills', { name: skillName.trim() });
  return response.data;
};

/**
 * Remove a skill from the authenticated student's profile.
 * DELETE /api/profile/skills/{skillId}
 * @param {number} skillId
 * @returns {Promise<void>}
 */
export const deleteSkill = async (skillId) => {
  const response = await api.delete(`/profile/skills/${skillId}`);
  return response.data;
};
