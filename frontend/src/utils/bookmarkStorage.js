/**
 * Helper utility to manage project bookmarks per user in localStorage.
 */

const getStorageKey = (userId) => `skillsync_bookmarked_projects_${userId || 'guest'}`;

export const getBookmarkedProjectIds = (userId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse bookmarked projects from localStorage', e);
    return [];
  }
};

export const isProjectBookmarked = (userId, projectId) => {
  const bookmarks = getBookmarkedProjectIds(userId);
  return bookmarks.includes(Number(projectId));
};

export const toggleProjectBookmark = (userId, projectId) => {
  try {
    const numericId = Number(projectId);
    const bookmarks = getBookmarkedProjectIds(userId);
    let updated;
    if (bookmarks.includes(numericId)) {
      updated = bookmarks.filter((id) => id !== numericId);
    } else {
      updated = [...bookmarks, numericId];
    }
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    return updated.includes(numericId);
  } catch (e) {
    console.error('Failed to toggle project bookmark', e);
    return false;
  }
};
