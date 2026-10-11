import api from './api';

/**
 * Service for Notification management.
 * Communicates with /api/notifications endpoints.
 */

/**
 * Fetch all notifications for the current user.
 * GET /api/notifications
 * @returns {Promise<Array>} List of NotificationDTO
 */
export const getMyNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

/**
 * Fetch count of unread notifications for current user.
 * GET /api/notifications/unread-count
 * @returns {Promise<{unreadCount: number}>}
 */
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a specific notification as read.
 * PUT /api/notifications/{id}/read
 * @param {number} notificationId
 * @returns {Promise<object>}
 */
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

/**
 * Mark all notifications as read.
 * PUT /api/notifications/read-all
 * @returns {Promise<object>}
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

/**
 * Delete a notification.
 * DELETE /api/notifications/{id}
 * @param {number} notificationId
 * @returns {Promise<object>}
 */
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};
