/**
 * Simple component helper
 * @param {string} tag 
 * @param {object} props 
 * @param {string|Node[]} children 
 * @returns {HTMLElement}
 */
export function createElement(tag, props = {}, children = '') {
  const el = document.createElement(tag);
  
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  if (typeof children === 'string') {
    el.innerHTML = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => el.appendChild(child));
  }
  
  return el;
}
