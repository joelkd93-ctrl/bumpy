// Utility functions for Bumpy

/**
 * Calculate weeks pregnant from due date
 * @param {Date} dueDate 
 * @returns {number}
 */
export function getWeeksPregnant(dueDate) {
  const now = new Date();
  const conception = new Date(dueDate);
  conception.setDate(conception.getDate() - 280); // 40 weeks
  const diffMs = now - conception;
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, Math.min(40, weeks));
}

/**
 * Get trimester from weeks
 * @param {number} weeks 
 * @returns {1 | 2 | 3}
 */
export function getTrimester(weeks) {
  if (weeks <= 12) return 1;
  if (weeks <= 27) return 2;
  return 3;
}

/**
 * Debounce function
 * @param {Function} fn 
 * @param {number} delay 
 */
export function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Simple local storage wrapper
 */
export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(`bumpy:${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`bumpy:${key}`, JSON.stringify(value));
    } catch {
      // Storage full or disabled
    }
  },
  remove(key) {
    localStorage.removeItem(`bumpy:${key}`);
  }
};
