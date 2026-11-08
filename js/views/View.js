// Owner: Shared (Members 1, 2, 3)
/**
 * View.js
 * Base class for all views in the LTO System (MVC architecture).
 * Provides common rendering, clearing, and notification methods.
 * Views NEVER import the model and NEVER read or change state directly.
 */

export default class View {
  /**
   * @param {string} parentSelector - CSS selector of the container element
   */
  constructor(parentSelector) {
    this._parentElement = document.querySelector(parentSelector);
    this._data = null;
  }

  /**
   * Render data by generating HTML markup and injecting into the parent container.
   * @param {*} data - Data required to render the view
   */
  render(data) {
    this._data = data;
    const markup = this._generateMarkup();
    this.clear();
    if (this._parentElement) {
      this._parentElement.insertAdjacentHTML('afterbegin', markup);
    }
  }

  /**
   * DOM diffing update method: compares new markup with current DOM nodes
   * and only updates text content and attributes that have actually changed.
   * Essential part of the Week 5 View Framework to prevent full re-renders and flicker.
   * @param {*} data - Updated data
   */
  update(data) {
    this._data = data;
    const newMarkup = this._generateMarkup();

    const newDOM = document.createRange().createContextualFragment(newMarkup);
    const newElements = Array.from(newDOM.querySelectorAll('*'));
    const curElements = this._parentElement ? Array.from(this._parentElement.querySelectorAll('*')) : [];

    newElements.forEach((newEl, i) => {
      const curEl = curElements[i];
      if (!curEl) return;

      // Update changed text content
      if (!newEl.isEqualNode(curEl) && newEl.firstChild?.nodeValue?.trim() !== '') {
        curEl.textContent = newEl.textContent;
      }

      // Update changed attributes
      if (!newEl.isEqualNode(curEl)) {
        Array.from(newEl.attributes).forEach(attr =>
          curEl.setAttribute(attr.name, attr.value)
        );
      }
    });
  }

  /**
   * Clear the inner contents of the parent element.
   */
  clear() {
    if (this._parentElement) {
      this._parentElement.innerHTML = '';
    }
  }

  /**
   * Render an alert or error message box inside the view container.
   * Used for form validation errors without resorting to browser alert().
   * @param {string} message - Error description
   */
  renderError(message = 'An unexpected error occurred.') {
    const markup = `
      <div class="alert-box alert-error" role="alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <strong>Validation Warning:</strong>
          <p>${this._escapeHtml(message)}</p>
        </div>
      </div>
    `;
    // If view has a dedicated error slot, render there, otherwise prepend to container
    const errorSlot = this._parentElement ? this._parentElement.querySelector('.view-error-slot') : null;
    if (errorSlot) {
      errorSlot.innerHTML = markup;
      errorSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (this._parentElement) {
      this._parentElement.insertAdjacentHTML('afterbegin', markup);
    }
  }

  /**
   * Clear any active error message slot.
   */
  clearError() {
    const errorSlot = this._parentElement ? this._parentElement.querySelector('.view-error-slot') : null;
    if (errorSlot) {
      errorSlot.innerHTML = '';
    }
  }

  /**
   * Render an informational or success message box.
   * @param {string} message - Information description
   */
  renderMessage(message = 'Action completed successfully.') {
    const markup = `
      <div class="alert-box alert-success" role="status">
        <div class="alert-icon">✅</div>
        <div class="alert-content">
          <p>${this._escapeHtml(message)}</p>
        </div>
      </div>
    `;
    const messageSlot = this._parentElement ? this._parentElement.querySelector('.view-message-slot') : null;
    if (messageSlot) {
      messageSlot.innerHTML = markup;
    } else if (this._parentElement) {
      this._parentElement.insertAdjacentHTML('afterbegin', markup);
    }
  }

  /**
   * Sanitize text strings before injecting into HTML to prevent XSS.
   * @param {*} str - Raw string
   * @returns {string} Escaped string
   */
  _escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format numbers to Philippine Peso currency format (e.g. ₱1,500.00).
   * @param {number} amount - Amount in PHP
   * @returns {string} Formatted currency
   */
  _formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₱' + num.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Abstract method: Subclasses must override this to generate their specific HTML.
   */
  _generateMarkup() {
    throw new Error('Subclass must implement _generateMarkup()');
  }
}
