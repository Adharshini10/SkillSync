import api from './api';

/**
 * Service for managing "Skills I Want to Learn" (Learning Skills).
 * Endpoints use the centralized Axios instance with JWT authentication.
 */

/**
 * Fetch the authenticated student's learning skills list.
 * GET /api/profile/learning-skills
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export const getLearningSkills = async () => {
  const response = await api.get('/profile/learning-skills');
  return response.data;
};

/**
 * Add a new learning skill for the authenticated student.
 * POST /api/profile/learning-skills
 * @param {string} skillName
 * @returns {Promise<{ id: number, name: string }>>}
 */
export const addLearningSkill = async (skillName) => {
  const response = await api.post('/profile/learning-skills', {
    name: skillName.trim(),
  });
  return response.data;
};

/**
 * Delete a learning skill from the authenticated student's list.
 * DELETE /api/profile/learning-skills/{skillId}
 * @param {number} skillId
 * @returns {Promise<void>}
 */
export const deleteLearningSkill = async (skillId) => {
  const response = await api.delete(`/profile/learning-skills/${skillId}`);
  return response.data;
};
