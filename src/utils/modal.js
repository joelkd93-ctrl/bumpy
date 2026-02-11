/**
 * 🎯 Native App Modal System
 * Industry-standard modal mechanics with proper scroll locking
 */

export class ModalManager {
  constructor() {
    this.activeModals = new Set();
    this.scrollPosition = 0;
  }

  /**
   * Open a modal with native app behavior
   * @param {HTMLElement} modalElement - The modal element to show
   */
  open(modalElement) {
    if (!modalElement) return;

    // Store scroll position before locking
    this.scrollPosition = window.scrollY;

    // Add modal to active set
    this.activeModals.add(modalElement);

    // Apply scroll lock
    this.lockScroll();

    // Show modal with animation
    modalElement.style.display = 'flex';

    // Force reflow for animation
    modalElement.offsetHeight;

    // Scroll modal content to top
    const modalCard = modalElement.querySelector('.modal-card, .game-modal-content');
    if (modalCard) {
      modalCard.scrollTop = 0;
    }

    // Focus trap
    this.trapFocus(modalElement);
  }

  /**
   * Close a modal and restore scroll
   * @param {HTMLElement} modalElement - The modal element to hide
   */
  close(modalElement) {
    if (!modalElement) return;

    // Remove from active set
    this.activeModals.delete(modalElement);

    // Hide modal
    modalElement.style.display = 'none';

    // Unlock scroll if no other modals are active
    if (this.activeModals.size === 0) {
      this.unlockScroll();
    }
  }

  /**
   * Lock background scroll (iOS-safe)
   */
  lockScroll() {
    const body = document.body;

    // Store current scroll
    this.scrollPosition = window.scrollY;

    // Class-based lock + fixed body freeze (prevents wheel/touch bleed)
    body.classList.add('modal-active');
    body.style.position = 'fixed';
    body.style.top = `-${this.scrollPosition}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
  }

  /**
   * Unlock background scroll
   */
  unlockScroll() {
    const body = document.body;
    const scrollY = this.scrollPosition || 0;

    // Remove class lock
    body.classList.remove('modal-active');

    // Restore body positioning
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';

    // Restore original scroll
    window.scrollTo(0, scrollY);
  }

  /**
   * Prevent scroll on touch (for iOS)
   */
  preventScroll(e) {
    // Allow scroll only within modal content
    const target = e.target;
    const modalCard = target.closest('.modal-card, .game-modal-content');

    if (!modalCard) {
      e.preventDefault();
    }
  }

  /**
   * Trap focus within modal
   */
  trapFocus(modalElement) {
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    setTimeout(() => firstElement?.focus(), 100);

    // Handle tab navigation
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleTab);
  }

  /**
   * Close modal on backdrop click
   */
  static setupBackdropClose(backdropElement, modalElement, closeCallback) {
    backdropElement?.addEventListener('click', (e) => {
      if (e.target === backdropElement) {
        closeCallback?.();
      }
    });
  }

  /**
   * Close modal on ESC key
   */
  static setupEscapeClose(modalElement, closeCallback) {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeCallback?.();
      }
    };

    document.addEventListener('keydown', handleEscape);

    // Return cleanup function
    return () => document.removeEventListener('keydown', handleEscape);
  }
}

// Singleton instance
export const modal = new ModalManager();

/**
 * Helper function to create a native-style modal
 * @param {Object} options - Modal configuration
 * @returns {HTMLElement} - Modal element
 */
export function createModal({
  content = '',
  style = 'sheet', // 'sheet' or 'center'
  showHandle = true,
  onClose = null
} = {}) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.style.display = 'none';

  modal.innerHTML = `
    <div class="modal-container ${style === 'center' ? 'modal-center' : ''}">
      <div class="modal-card">
        ${showHandle ? '<div class="modal-handle"></div>' : ''}
        <button class="modal-close-btn" aria-label="Close">✕</button>
        <div class="modal-content">
          ${content}
        </div>
      </div>
    </div>
  `;

  // Close handlers
  const closeBtn = modal.querySelector('.modal-close-btn');
  closeBtn?.addEventListener('click', () => {
    modal.close();
    onClose?.();
  });

  ModalManager.setupBackdropClose(modal, modal, () => {
    modal.close();
    onClose?.();
  });

  // Add helper methods
  modal.open = () => window.modal.open(modal);
  modal.close = () => window.modal.close(modal);

  return modal;
}

// Make modal manager globally available
if (typeof window !== 'undefined') {
  window.modal = modal;
}
