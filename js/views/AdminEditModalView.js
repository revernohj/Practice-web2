// Owner: Member 2 (Admin Module)
/**
 * AdminEditModalView.js
 * Dedicated Admin modal view for editing an existing LTO Violation Record.
 * Enables the Administrator to edit citations directly within the Admin panel
 * without leaving the Admin dashboard or switching to the Enforcer module.
 */

import View from './View.js';

export default class AdminEditModalView extends View {
  constructor() {
    super('#admin-edit-modal-container');
  }

  addHandlerIdentifierFormatting() {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('input', (e) => {
      const license = e.target.closest('#admin-edit-license');
      if (license) {
        const clean = license.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^[^A-Z]+/, '');
        const first = clean.charAt(0).replace(/[^A-Z]/g, '');
        const digits = clean.slice(first ? 1 : 0).replace(/\D/g, '').slice(0, 10);
        license.value = [`${first}${digits.slice(0, 2)}`, digits.slice(2, 4), digits.slice(4, 10)]
          .filter(Boolean).join('-');
        return;
      }

      const plate = e.target.closest('#admin-edit-plate');
      if (plate) {
        const clean = plate.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const digitIndex = clean.search(/\d/);
        if (digitIndex > 0) {
          const letters = clean.slice(0, digitIndex).replace(/[^A-Z]/g, '').slice(0, 3);
          const digits = clean.slice(digitIndex).replace(/\D/g, '').slice(0, 5);
          plate.value = digits ? `${letters} ${digits}` : letters;
        } else {
          plate.value = clean.replace(/[^A-Z]/g, '').slice(0, 3);
        }
      }
    });
  }

  /**
   * Attaches handler for saving edited violation record.
   * @param {Function} handler
   */
  addHandlerSave(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#form-admin-edit-violation');
      if (!form) return;
      e.preventDefault();

      const id = form.dataset.id;
      const formData = {
        licenseNo: form.querySelector('#admin-edit-license')?.value || '',
        plateNo: form.querySelector('#admin-edit-plate')?.value || '',
        driverName: form.querySelector('#admin-edit-driver')?.value || '',
        type: form.querySelector('#admin-edit-type')?.value || '',
        location: form.querySelector('#admin-edit-location')?.value || '',
        date: form.querySelector('#admin-edit-date')?.value || ''
      };

      handler(id, formData);
    });
  }

  /**
   * Attaches handler for live recomputation when violation type changes.
   * @param {Function} handler
   */
  addHandlerLiveCompute(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('change', (e) => {
      const select = e.target.closest('#admin-edit-type');
      if (!select) return;
      handler(select.value);
    });
  }

  /**
   * Attaches handler for cancelling or closing the edit modal.
   * @param {Function} handler
   */
  addHandlerCancel(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#btn-close-admin-edit') ||
                       e.target.closest('#btn-cancel-admin-edit') ||
                       e.target.closest('.admin-edit-backdrop');
      if (closeBtn && !e.target.closest('.admin-edit-card')) {
        handler();
      } else if (e.target.closest('#btn-close-admin-edit') || e.target.closest('#btn-cancel-admin-edit')) {
        handler();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._parentElement.innerHTML.trim() !== '') {
        handler();
      }
    });
  }

  /**
   * Live updates base fine and surcharge elements inside the modal.
   * @param {{ baseFine: number, surcharge: number, total: number }} calculation
   */
  updateLiveFine(calculation) {
    const baseEl = this._parentElement.querySelector('#admin-edit-base-fine');
    const surchargeEl = this._parentElement.querySelector('#admin-edit-surcharge');
    const totalEl = this._parentElement.querySelector('#admin-edit-total-fine');

    if (baseEl && surchargeEl && totalEl) {
      baseEl.textContent = this._formatCurrency(calculation.baseFine);
      surchargeEl.textContent = this._formatCurrency(calculation.surcharge);
      totalEl.textContent = this._formatCurrency(calculation.total);
    }
  }

  /**
   * Renders validation error inside the modal.
   * @param {string} message
   */
  renderError(message) {
    const slot = this._parentElement ? this._parentElement.querySelector('#admin-edit-error-slot') : null;
    if (!slot) return;
    slot.innerHTML = `
      <div class="auth-alert auth-alert-danger" role="alert">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">${this._escapeHtml(message)}</span>
      </div>
    `;
  }

  /**
   * Clears error slot.
   */
  clearError() {
    const slot = this._parentElement ? this._parentElement.querySelector('#admin-edit-error-slot') : null;
    if (slot) slot.innerHTML = '';
  }

  /**
   * Generates markup for the Admin Edit Modal.
   */
  _generateMarkup() {
    const violation = this._data?.violation || {};
    const violationTypes = this._data?.violationTypes || [];
    const calculation = this._data?.calculation || { baseFine: 0, surcharge: 0, total: 0 };

    return `
      <div class="auth-modal-backdrop admin-edit-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-edit-title">
        <div class="auth-modal-card admin-edit-card">
          <div class="auth-modal-top">
            <div class="auth-badge-kicker">LTO ADMINISTRATOR &middot; RECORD MANAGEMENT</div>
            <button type="button" id="btn-close-admin-edit" class="auth-close-btn" aria-label="Close edit modal">
              ✕
            </button>
          </div>

          <div class="auth-brand-row">
            <img src="img/lto-logo.png" alt="LTO Seal" class="auth-brand-logo" width="48" height="48" />
            <div class="auth-brand-text">
              <span class="auth-republic">REPUBLIC OF THE PHILIPPINES</span>
              <h2 id="admin-edit-title" class="auth-title">EDIT CITATION RECORD</h2>
              <span class="auth-system">Citation ID: <code>${this._escapeHtml(violation.id || '')}</code></span>
            </div>
          </div>

          <!-- Error Alert Slot -->
          <div id="admin-edit-error-slot" class="auth-alert-slot" aria-live="polite"></div>

          <form id="form-admin-edit-violation" class="auth-form" data-id="${this._escapeHtml(violation.id || '')}" novalidate>
            <div class="auth-form-grid">
              <!-- License Number -->
              <div class="auth-form-group">
                <label for="admin-edit-license" class="auth-label">
                  <span>Driver's License Number</span>
                  <span class="req">*</span>
                </label>
                <div class="auth-input-wrap">
                  <span class="input-icon">💳</span>
                  <input
                    type="text"
                    id="admin-edit-license"
                    class="auth-input"
                    value="${this._escapeHtml(violation.licenseNo || '')}"
                    placeholder="e.g. N01-23-456789"
                    required
                    maxlength="13"
                    pattern="[A-Z]\\d{2}-\\d{2}-\\d{6}"
                  />
                </div>
              </div>

              <!-- Plate Number -->
              <div class="auth-form-group">
                <label for="admin-edit-plate" class="auth-label">
                  <span>Vehicle Plate Number</span>
                  <span class="req">*</span>
                </label>
                <div class="auth-input-wrap">
                  <span class="input-icon">🚘</span>
                  <input
                    type="text"
                    id="admin-edit-plate"
                    class="auth-input"
                    value="${this._escapeHtml(violation.plateNo || '')}"
                    placeholder="e.g. ABC 1234"
                    required
                    maxlength="9"
                  />
                </div>
              </div>

              <!-- Driver Name -->
              <div class="auth-form-group">
                <label for="admin-edit-driver" class="auth-label">
                  <span>Driver Full Name</span>
                  <span class="req">*</span>
                </label>
                <div class="auth-input-wrap">
                  <span class="input-icon">👤</span>
                  <input
                    type="text"
                    id="admin-edit-driver"
                    class="auth-input"
                    value="${this._escapeHtml(violation.driverName || '')}"
                    placeholder="e.g. Juan Dela Cruz"
                    required
                  />
                </div>
              </div>

              <!-- Violation Date -->
              <div class="auth-form-group">
                <label for="admin-edit-date" class="auth-label">
                  <span>Violation Date</span>
                  <span class="req">*</span>
                </label>
                <div class="auth-input-wrap">
                  <span class="input-icon">📅</span>
                  <input
                    type="date"
                    id="admin-edit-date"
                    class="auth-input"
                    value="${this._escapeHtml(violation.date || '')}"
                    max="${new Date().toISOString().slice(0, 10)}"
                    required
                  />
                </div>
              </div>
            </div>

            <!-- Violation Type Selector -->
            <div class="auth-form-group">
              <label for="admin-edit-type" class="auth-label">
                <span>Traffic Violation Type</span>
                <span class="req">*</span>
              </label>
              <div class="auth-input-wrap">
                <span class="input-icon">⚖️</span>
                <select id="admin-edit-type" class="auth-input auth-select" required>
                  ${violationTypes.map(t => `
                    <option value="${this._escapeHtml(t.name)}" ${violation.type === t.name ? 'selected' : ''}>
                      ${this._escapeHtml(t.code)} - ${this._escapeHtml(t.name)} (Base: ₱${Number(t.baseFine).toLocaleString()})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Apprehension Location -->
            <div class="auth-form-group">
              <label for="admin-edit-location" class="auth-label">
                <span>Apprehension Location</span>
                <span class="req">*</span>
              </label>
              <div class="auth-input-wrap">
                <span class="input-icon">📍</span>
                <input
                  type="text"
                  id="admin-edit-location"
                  class="auth-input"
                  value="${this._escapeHtml(violation.location || '')}"
                  placeholder="e.g. EDSA corner Ortigas Ave, Quezon City"
                  required
                />
              </div>
            </div>

            <!-- Live Calculation Preview Card -->
            <div class="fine-calc-box" style="margin-top: 1rem; margin-bottom: 1.25rem;">
              <div class="calc-row">
                <span class="calc-label">Base Violation Fine:</span>
                <strong id="admin-edit-base-fine" class="calc-value">${this._formatCurrency(calculation.baseFine)}</strong>
              </div>
              <div class="calc-row">
                <span class="calc-label">Administrative Surcharge:</span>
                <strong id="admin-edit-surcharge" class="calc-value surcharge">${this._formatCurrency(calculation.surcharge)}</strong>
              </div>
              <div class="calc-row total-row">
                <span class="calc-label">Total Fine Due:</span>
                <strong id="admin-edit-total-fine" class="calc-value total">${this._formatCurrency(calculation.total)}</strong>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="auth-modal-actions" style="display: flex; gap: 0.75rem; justify-content: flex-end;">
              <button type="button" id="btn-cancel-admin-edit" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                💾 Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}
