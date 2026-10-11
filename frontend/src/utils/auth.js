/**
 * JWT Token Management Utilities
 * Stores and manages the authentication token and user info in localStorage.
 */

const TOKEN_KEY = 'skillsync_jwt_token';
const USER_KEY  = 'skillsync_user_info';

/**
 * Save JWT token in browser localStorage.
 * @param {string} token
 */
export const saveToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem('token', token);
  }
};

/**
 * Retrieve the current JWT token from localStorage.
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token');
};

/**
 * Remove the JWT token and user info from localStorage (logout).
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem(USER_KEY);
};

/**
 * Save basic user information (id, name, email) in localStorage.
 * @param {object} user
 */
export const saveUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Retrieve basic user information from localStorage.
 * @returns {object|null}
 */
export const getUser = () => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

/**
 * Check whether a valid token exists in localStorage.
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  return Boolean(token && token.trim().length > 0);
};

/**
 * Alias for isAuthenticated for convenience.
 * @returns {boolean}
 */
export const hasToken = () => {
  return isAuthenticated();
};
