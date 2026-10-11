import api from './api';

/**
 * Service for 1-on-1 Student Chat.
 * Communicates with /api/chat endpoints.
 */

/**
 * Fetch conversation history between current user and a connected peer.
 * GET /api/chat/{userId}
 * @param {number} userId - Connected student user ID
 * @returns {Promise<Array>} List of ChatMessageDTO
 */
export const getConversationHistory = async (userId) => {
  const response = await api.get(`/chat/${userId}`);
  return response.data;
};

/**
 * Send a private message to a connected student.
 * POST /api/chat/send
 * @param {number} receiverId - Recipient user ID
 * @param {string} content - Message text
 * @returns {Promise<object>} ChatMessageDTO
 */
export const sendChatMessage = async (receiverId, content) => {
  const response = await api.post('/chat/send', {
    receiverId,
    content,
  });
  return response.data;
};

/**
 * Mark messages received from a specific user as read.
 * PUT /api/chat/{userId}/read
 * @param {number} userId - Sender user ID
 * @returns {Promise<object>}
 */
export const markMessagesAsRead = async (userId) => {
  const response = await api.put(`/chat/${userId}/read`);
  return response.data;
};

/**
 * Retrieve unread messages for current user.
 * GET /api/chat/unread
 * @returns {Promise<Array>}
 */
export const getUnreadMessages = async () => {
  const response = await api.get('/chat/unread');
  return response.data;
};

/**
 * Delete a message previously sent by the current user.
 * DELETE /api/chat/messages/{messageId}
 * @param {number} messageId
 * @returns {Promise<object>}
 */
export const deleteChatMessage = async (messageId) => {
  const response = await api.delete(`/chat/messages/${messageId}`);
  return response.data;
};
