// Owner: Member 1
/**
 * ViolationFormView.js
 * View component for issuing and editing a Traffic Violation.
 * Used primarily by LTO Traffic Enforcer and LTO Administrator.
 *
 * Features:
 * 1. Live recompute of Fine and Penalty when violation type is selected.
 * 2. Form submission with validation error rendering inside the view (never alert()).
 * 3. Prefill support for editing an existing LTO Violation Record.
 */

import View from './View.js';

export default class ViolationFormView extends View {
  constructor() {
    super('#violation-form-container');
  }

  /**
   * Attaches submit event listener to the violation form.
   * Extracts input values into a plain object and passes to controller.
   * @param {Function} handler - Callback function receiving form data
   */
  addHandlerSubmit(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#traffic-violation-form');
      if (!form) return;
      e.preventDefault();

      const formData = {
        licenseNo: form.querySelector('#input-license-no').value,
        plateNo: form.querySelector('#input-plate-no').value,
        driverName: form.querySelector('#input-driver-name').value,
        type: form.querySelector('#select-violation-type').value,
        location: form.querySelector('#input-location').value,
        date: form.querySelector('#input-violation-date').value
      };

      handler(formData);
    });
  }

  /**
   * Attaches change and input listeners to violation type selector
   * for live recomputation of base fine and surcharge.
   * @param {Function} handler - Callback receiving selected violation type name
   */
  addHandlerLiveCompute(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('change', (e) => {
      const select = e.target.closest('#select-violation-type');
      if (!select) return;
      handler(select.value);
    });
  }

  /**
   * Attaches cancel editing listener.
   * @param {Function} handler - Callback when user cancels editing
   */
  addHandlerCancelEdit(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('#btn-cancel-edit');
      if (!cancelBtn) return;
      handler();
    });
  }

  /**
   * Attaches clear fields listener for the reset button without inline handlers.
   */
  addHandlerResetFields() {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const resetBtn = e.target.closest('#btn-reset-form');
      if (!resetBtn) return;
      this.resetForm();
    });
  }

  /**
   * Dynamically updates the live Fine and Penalty calculation box
   * without needing to re-render the whole form and lose form field focus.
   * @param {{ baseFine: number, surcharge: number, total: number }} calculation
   */
  updateLiveFine(calculation) {
    const baseEl = this._parentElement.querySelector('#live-base-fine');
    const surchargeEl = this._parentElement.querySelector('#live-surcharge');
    const totalEl = this._parentElement.querySelector('#live-total-fine');

    if (baseEl && surchargeEl && totalEl) {
      baseEl.textContent = this._formatCurrency(calculation.baseFine);
      surchargeEl.textContent = this._formatCurrency(calculation.surcharge);
      totalEl.textContent = this._formatCurrency(calculation.total);
    }
  }

  /**
   * Resets form fields and sets default date to today.
   */
  resetForm() {
    const form = this._parentElement.querySelector('#traffic-violation-form');
    if (form) {
      form.reset();
      this.clearError();
      const dateInput = form.querySelector('#input-violation-date');
      if (dateInput) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
    }
  }

  /**
   * Generates markup for the Traffic Violation Form.
   * Supports both "New Violation" and "Edit Violation Record" modes.
   */
  _generateMarkup() {
    const isEditing = Boolean(this._data?.editingViolation);
    const violation = this._data?.editingViolation || {};
    const violationTypes = this._data?.violationTypes || [];
    const calculation = this._data?.calculation || { baseFine: 0, surcharge: 0, total: 0 };
    const todayStr = new Date().toISOString().slice(0, 10);

    const title = isEditing ? 'Edit LTO Violation Record' : 'Issue Traffic Violation';
    const subtitle = isEditing
      ? `Modifying Record ID: ${this._escapeHtml(violation.id || '')}`
      : 'Law enforcement citation ticket entry for apprehended motor vehicle operators';

    return `
      <section class="portal-card form-card" aria-labelledby="form-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="badge-role">LTO Traffic Enforcer</span>
            <h2 id="form-heading" class="card-title">${title}</h2>
            <p class="card-subtitle">${subtitle}</p>
          </div>
          ${isEditing ? `
            <button type="button" id="btn-cancel-edit" class="btn btn-secondary btn-sm">
              ✕ Cancel Editing
            </button>
          ` : ''}
        </div>

        <!-- Dedicated Validation Error Banner Slot -->
        <div class="view-error-slot" aria-live="polite"></div>
        <div class="view-message-slot" aria-live="polite"></div>

        <form id="traffic-violation-form" class="violation-form" novalidate>
          <div class="form-grid">

            <!-- Driver's License Number -->
            <div class="form-group">
              <label for="input-license-no" class="form-label">
                Driver's License Number <span class="required-star">*</span>
              </label>
              <input
                type="text"
                id="input-license-no"
                name="licenseNo"
                class="form-control"
                placeholder="e.g. N01-23-456789"
                value="${this._escapeHtml(violation.licenseNo || '')}"
                required
                autocomplete="off"
              />
              <span class="field-hint">Format: 1 letter, 2 digits, hyphen, 2 digits, hyphen, 6 digits</span>
            </div>

            <!-- Vehicle Plate Number -->
            <div class="form-group">
              <label for="input-plate-no" class="form-label">
                Vehicle Plate Number <span class="required-star">*</span>
              </label>
              <input
                type="text"
                id="input-plate-no"
                name="plateNo"
                class="form-control"
                placeholder="e.g. ABC 1234 or NDK 8392"
                value="${this._escapeHtml(violation.plateNo || '')}"
                required
                autocomplete="off"
              />
              <span class="field-hint">Standard Philippine plate or MV file number</span>
            </div>

            <!-- Driver Full Name -->
            <div class="form-group">
              <label for="input-driver-name" class="form-label">
                Driver Full Name <span class="required-star">*</span>
              </label>
              <input
                type="text"
                id="input-driver-name"
                name="driverName"
                class="form-control"
                placeholder="e.g. Juan Dela Cruz"
                value="${this._escapeHtml(violation.driverName || '')}"
                required
              />
            </div>

            <!-- Date of Violation -->
            <div class="form-group">
              <label for="input-violation-date" class="form-label">
                Date of Apprehension <span class="required-star">*</span>
              </label>
              <input
                type="date"
                id="input-violation-date"
                name="date"
                class="form-control"
                max="${todayStr}"
                value="${this._escapeHtml(violation.date || todayStr)}"
                required
              />
              <span class="field-hint">Cannot be a future date</span>
            </div>

            <!-- Violation Type Dropdown -->
            <div class="form-group full-width">
              <label for="select-violation-type" class="form-label">
                Traffic Violation Type <span class="required-star">*</span>
              </label>
              <select id="select-violation-type" name="type" class="form-control" required>
                <option value="">-- Select Apprehended Violation --</option>
                ${violationTypes.map(vt => `
                  <option
                    value="${this._escapeHtml(vt.name)}"
                    ${(violation.type === vt.name) ? 'selected' : ''}
                  >
                    ${this._escapeHtml(vt.name)} — Base: ₱${vt.baseFine.toLocaleString()} (+${Math.round(vt.surchargeRate * 100)}% surcharge)
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Apprehension Location -->
            <div class="form-group full-width">
              <label for="input-location" class="form-label">
                Apprehension Location / Street / City <span class="required-star">*</span>
              </label>
              <input
                type="text"
                id="input-location"
                name="location"
                class="form-control"
                placeholder="e.g. EDSA corner Shaw Blvd, Mandaluyong City"
                value="${this._escapeHtml(violation.location || '')}"
                required
              />
            </div>
          </div>

          <!-- Live Recompute Box: Fine and Penalty Breakdown -->
          <div class="fine-preview-box" aria-live="polite">
            <div class="fine-preview-header">
              <span class="fine-preview-icon">⚖️</span>
              <span class="fine-preview-title">Live Computation: Fine and Penalty</span>
            </div>
            <div class="fine-breakdown-row">
              <div class="fine-col">
                <span class="fine-label">Base Statutory Fine:</span>
                <span id="live-base-fine" class="fine-val">${this._formatCurrency(calculation.baseFine)}</span>
              </div>
              <div class="fine-col">
                <span class="fine-label">Administrative Surcharge:</span>
                <span id="live-surcharge" class="fine-val">${this._formatCurrency(calculation.surcharge)}</span>
              </div>
              <div class="fine-col total-col">
                <span class="fine-label">Total Fine and Penalty:</span>
                <span id="live-total-fine" class="fine-val total-val">${this._formatCurrency(calculation.total)}</span>
              </div>
            </div>
            <p class="fine-footnote">Amounts automatically update as the violation type is changed. Academic demo data only.</p>
          </div>

          <!-- Form Action Buttons -->
          <div class="form-actions">
            <button type="submit" id="btn-submit-violation" class="btn btn-primary">
              ${isEditing ? '💾 Update LTO Violation Record' : '📝 Issue Traffic Violation'}
            </button>
            <button type="button" id="btn-reset-form" class="btn btn-secondary">
              Clear Fields
            </button>
          </div>
        </form>
      </section>
    `;
  }
}
