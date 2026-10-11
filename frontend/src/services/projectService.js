import api from './api';

/**
 * Project and Membership API service.
 */

// ── Project Management APIs ─────────────────────────────────

export const getAllProjects = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getMyProjects = async () => {
  const response = await api.get('/projects/my');
  return response.data;
};

export const getProjectById = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async ({ title, description, requiredSkills, maxMembers, lookingFor, lookingForRoles }) => {
  const response = await api.post('/projects', {
    title,
    description,
    requiredSkills,
    maxMembers,
    lookingFor,
    lookingForRoles,
  });
  return response.data;
};

export const updateProject = async (projectId, data) => {
  const response = await api.put(`/projects/${projectId}`, data);
  return response.data;
};

export const deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// ── Project Membership APIs ──────────────────────────────────

export const sendJoinRequest = async (projectId) => {
  const response = await api.post(`/projects/${projectId}/join`);
  return response.data;
};

export const getProjectMembers = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
};

export const getPendingJoinRequests = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/join-requests`);
  return response.data;
};

export const acceptJoinRequest = async (projectId, membershipId) => {
  const response = await api.put(`/projects/${projectId}/join-requests/${membershipId}/accept`);
  return response.data;
};

export const rejectJoinRequest = async (projectId, membershipId) => {
  const response = await api.put(`/projects/${projectId}/join-requests/${membershipId}/reject`);
  return response.data;
};

export const removeProjectMember = async (projectId, membershipId) => {
  const response = await api.delete(`/projects/${projectId}/members/${membershipId}`);
  return response.data;
};

export const getMyJoinedProjects = async () => {
  const response = await api.get('/projects/my-memberships');
  return response.data;
};

export const getMyJoinRequests = async () => {
  const response = await api.get('/projects/my-requests');
  return response.data;
};

// ── Project Group Chat APIs ──────────────────────────────────

export const getProjectChatHistory = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/chat`);
  return response.data;
};

export const sendProjectChatMessage = async (projectId, content) => {
  const response = await api.post(`/projects/${projectId}/chat/send`, { projectId, content });
  return response.data;
};

export const getOwnerPendingRequests = async () => {
  const response = await api.get('/projects/owner/pending-requests');
  return response.data;
};
