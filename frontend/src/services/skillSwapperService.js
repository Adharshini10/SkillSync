import api from './api';

/**
 * Service for Skill Swapper matching.
 * Matches current student's "Skills I Want to Learn" against other students' "My Skills".
 */

/**
 * Fetch students matching the authenticated student's learning skills.
 * GET /api/skill-swapper/matches?minMatches={minMatches}
 *
 * @param {number} minMatches Optional minimum matching threshold (default 1)
 * @returns {Promise<Array<{
 *   userId: number,
 *   name: string,
 *   bio: string,
 *   location: string,
 *   education: string,
 *   profilePictureUrl: string,
 *   skills: string[],
 *   matchedSkills: string[],
 *   matchCount: number,
 *   matchPercentage: number,
 *   connectionStatus: string
 * }>>}
 */
export const getSkillMatches = async (minMatches = 1) => {
  const response = await api.get('/skill-swapper/matches', {
    params: { minMatches },
  });
  return response.data;
};
