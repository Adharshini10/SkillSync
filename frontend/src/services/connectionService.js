import api from './api';

/**
 * Service for Student-to-Student Connections.
 * Uses existing backend connection endpoints.
 */

/**
 * Send a connection request to another student.
 * POST /api/connections/{userId}
 * @param {number} userId
 * @returns {Promise<object>} ConnectionResponseDTO
 */
export const sendConnectionRequest = async (userId) => {
  const response = await api.post(`/connections/${userId}`);
  return response.data;
};

/**
 * Fetch received connection requests.
 * GET /api/connections/requests/received
 * @returns {Promise<Array>}
 */
export const getReceivedRequests = async () => {
  const response = await api.get('/connections/requests/received');
  return response.data;
};

/**
 * Fetch sent connection requests.
 * GET /api/connections/requests/sent
 * @returns {Promise<Array>}
 */
export const getSentRequests = async () => {
  const response = await api.get('/connections/requests/sent');
  return response.data;
};

/**
 * Fetch accepted connections.
 * GET /api/connections
 * @returns {Promise<Array>}
 */
export const getMyConnections = async () => {
  const response = await api.get('/connections');
  return response.data;
};

/**
 * Accept a received connection request.
 * PUT /api/connections/{connectionId}/accept
 * @param {number} connectionId
 * @returns {Promise<object>} ConnectionResponseDTO
 */
export const acceptConnectionRequest = async (connectionId) => {
  const response = await api.put(`/connections/${connectionId}/accept`);
  return response.data;
};

/**
 * Reject a received connection request.
 * PUT /api/connections/{connectionId}/reject
 * @param {number} connectionId
 * @returns {Promise<object>} ConnectionResponseDTO
 */
export const rejectConnectionRequest = async (connectionId) => {
  const response = await api.put(`/connections/${connectionId}/reject`);
  return response.data;
};

/**
 * Remove an existing connection.
 * DELETE /api/connections/{connectionId}
 * @param {number} connectionId
 * @returns {Promise<object>}
 */
export const removeConnection = async (connectionId) => {
  const response = await api.delete(`/connections/${connectionId}`);
  return response.data;
};
