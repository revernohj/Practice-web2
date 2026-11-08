// Owner: Member 3
/**
 * DriverBalanceView.js
 * View component for Registered Driver portal:
 * 1. Search Driver Information by Driver's License Number.
 * 2. View driver profile summary and Outstanding Balance.
 * 3. Review Violation History (paid and unpaid records).
 * 4. Initiate fine payment for unpaid citations.
 */

import View from './View.js';

export default class DriverBalanceView extends View {
  constructor() {
    super('#driver-portal-container');
  }

  /**
   * Attaches search form submission listener for license number lookup.
   * @param {Function} handler - Callback receiving license number
   */
  addHandlerSearch(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('input', (e) => {
      const input = e.target.closest('#input-driver-search-license');
      if (!input) return;
      const clean = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^[^A-Z]+/, '');
      const first = clean.charAt(0).replace(/[^A-Z]/g, '');
      const digits = clean.slice(first ? 1 : 0).replace(/\D/g, '').slice(0, 10);
      input.value = [`${first}${digits.slice(0, 2)}`, digits.slice(2, 4), digits.slice(4, 10)]
        .filter(Boolean).join('-');
    });

    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#driver-search-form');
      if (!form) return;
      e.preventDefault();

      const input = form.querySelector('#input-driver-search-license');
      if (input) {
        handler(input.value);
      }
    });
  }

  /**
   * Attaches click listener for "Pay Fine" buttons on unpaid violations.
   * @param {Function} handler - Callback receiving violation ID
   */
  addHandlerPayClick(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const payBtn = e.target.closest('.btn-pay-violation');
      if (!payBtn) return;

      const violationId = payBtn.dataset.id;
      if (violationId) {
        handler(violationId);
      }
    });
  }

  addHandlerFilter(handler) {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('change', (e) => {
      const status = e.target.closest('#driver-status-filter');
      if (status) handler(status.value, this._parentElement.querySelector('#driver-date-filter')?.value || '');
      const date = e.target.closest('#driver-date-filter');
      if (date) handler(this._parentElement.querySelector('#driver-status-filter')?.value || 'all', date.value);
    });
  }

  addHandlerContestClick(handler) {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('click', (e) => {
      const button = e.target.closest('.btn-contest-violation');
      if (button) handler(button.dataset.id);
      const closeButton = e.target.closest('#btn-close-dispute-modal');
      if (closeButton) handler(null);
    });
  }

  addHandlerDisputeSubmit(handler) {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#driver-dispute-form');
      if (!form) return;
      e.preventDefault();
      handler({
        violationId: form.dataset.id,
        reason: form.querySelector('#dispute-reason')?.value || '',
        notes: form.querySelector('#dispute-notes')?.value || ''
      });
    });
  }

  addHandlerPrintClearance(handler) {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('click', (e) => {
      const button = e.target.closest('#btn-print-clearance');
      if (button) handler();
    });
  }

  /**
   * Generates markup for the Driver Portal:
   * - License inquiry search bar with sample chips
   * - Outstanding Balance header
   * - Driver Information card
   * - Violation History table
   */
  _generateMarkup() {
    const searchState = this._data?.driverSearch || { licenseNo: '', searched: false };
    const allViolations = this._data?.violations || [];
    const violations = this._data?.filteredViolations || allViolations;
    const filters = this._data?.driverFilters || { status: 'all', date: '' };
    const disputeViolationId = this._data?.disputeViolationId || null;
    const disputeViolation = allViolations.find(v => v.id === disputeViolationId) || null;
    const outstandingBalance = this._data?.outstandingBalance || 0;
    const searchedLicense = searchState.licenseNo;
    const hasSearched = searchState.searched;

    // Derive driver name and primary plate from violations if present
    const driverRecord = allViolations.length > 0 ? allViolations[0] : null;
    const driverName = driverRecord ? driverRecord.driverName : 'Unknown Driver';

    const unpaidCount = allViolations.filter(v => v.status === 'unpaid').length;
    const paidCount = allViolations.filter(v => v.status === 'paid').length;

    return `
      <section class="portal-card" aria-labelledby="driver-heading">
        <div class="card-header">
          <div class="card-title-group">
            <span class="badge-role">Registered Driver</span>
            <h2 id="driver-heading" class="card-title">Driver Information & Violation Inquiries</h2>
            <p class="card-subtitle">Inquire citations, check Outstanding Balance, and settle LTO violation fines online</p>
          </div>
        </div>

        <!-- Validation & Notice Slot -->
        <div class="view-error-slot" aria-live="polite"></div>
        <div class="view-message-slot" aria-live="polite"></div>

        <!-- Driver License Search Form -->
        <div class="driver-inquiry-box">
          <form id="driver-search-form" class="search-form-row">
            <div class="form-group flex-1">
              <label for="input-driver-search-license" class="form-label">
                Enter Driver's License Number:
              </label>
              <div class="search-input-wrap">
                <input
                  type="text"
                  id="input-driver-search-license"
                  class="form-control"
                  placeholder="e.g. N01-23-456789"
                  value="${this._escapeHtml(searchedLicense)}"
                  required
                  autocomplete="off"
                  maxlength="13"
                  pattern="[A-Z]\\d{2}-\\d{2}-\\d{6}"
                />
                <button type="submit" id="btn-search-driver" class="btn btn-primary">
                  🔍 Search Records
                </button>
              </div>
            </div>
          </form>

        </div>

        ${!hasSearched ? `
          <div class="driver-welcome-prompt">
            <div class="welcome-icon">🔎</div>
            <h3>Verify Your LTO Driving Credentials</h3>
            <p>Please enter your Driver's License Number to view your citations and settle penalties.</p>
          </div>
        ` : `
          <!-- Driver Information Overview -->
          <div class="driver-overview-grid">
            <div class="driver-info-panel">
              <h3 class="panel-title">Driver Information</h3>
              <div class="info-row">
                <span class="info-lbl">Full Name:</span>
                <span class="info-val strong-val">${this._escapeHtml(driverName)}</span>
              </div>
              <div class="info-row">
                <span class="info-lbl">License Number:</span>
                <span class="info-val code-val">${this._escapeHtml(searchedLicense)}</span>
              </div>
              <div class="info-row">
                <span class="info-lbl">Total Citations:</span>
                <span class="info-val">${allViolations.length} record(s)</span>
              </div>
              <div class="info-row">
                <span class="info-lbl">Unpaid Violations:</span>
                <span class="info-val ${unpaidCount > 0 ? 'text-danger' : 'text-success'}">
                  ${unpaidCount} citation(s)
                </span>
              </div>
            </div>

            <!-- Outstanding Balance Banner -->
            <div class="balance-highlight-box ${outstandingBalance > 0 ? 'has-balance' : 'zero-balance'}">
              <div class="balance-header">
                <span class="balance-icon">${outstandingBalance > 0 ? '⚠️' : '🎉'}</span>
                <span class="balance-title">Outstanding Balance</span>
              </div>
              <div class="balance-amount-display">
                ${this._formatCurrency(outstandingBalance)}
              </div>
              <p class="balance-note">
                ${outstandingBalance > 0
                  ? 'Total unresolved statutory fines and administrative surcharges due for clearance.'
                  : 'Congratulations! All your recorded traffic violations have been settled.'}
              </p>
            </div>
          </div>

          <div class="clearance-status-row">
            <span class="status-badge ${outstandingBalance === 0 ? 'status-paid' : 'status-unpaid'}">
              ${outstandingBalance === 0 ? '✓ NO PENDING VIOLATIONS / CLEARED' : '● PENDING VIOLATIONS'}
            </span>
            ${outstandingBalance === 0 ? `
              <div class="clearance-card">
                <span class="clearance-kicker">DIGITAL CLEARANCE CARD</span>
                <strong>${this._escapeHtml(driverName)}</strong>
                <span>License: ${this._escapeHtml(searchedLicense)}</span>
                <span>Issued: ${new Date().toISOString().slice(0, 10)}</span>
                <button type="button" id="btn-print-clearance" class="btn btn-secondary btn-sm">🖨 Print Clearance</button>
              </div>
            ` : ''}
          </div>

          <!-- Violation History Section -->
          <div class="history-section">
            <div class="section-subhead">
              <h3>Violation History (${violations.length})</h3>
              <span class="subhead-meta">
                Showing all citations registered under license <strong>${this._escapeHtml(searchedLicense)}</strong>
              </span>
            </div>

            <div class="filter-bar driver-history-filters" role="group" aria-label="Violation history filters">
              <div class="search-box">
                <label class="visually-hidden" for="driver-status-filter">Status</label>
                <select id="driver-status-filter" class="form-control search-input">
                  <option value="all" ${filters.status === 'all' ? 'selected' : ''}>All</option>
                  <option value="unpaid" ${filters.status === 'unpaid' ? 'selected' : ''}>Unpaid</option>
                  <option value="pending_review" ${filters.status === 'pending_review' ? 'selected' : ''}>Pending Review</option>
                  <option value="paid" ${filters.status === 'paid' ? 'selected' : ''}>Settled</option>
                </select>
              </div>
              <div class="search-box">
                <label class="visually-hidden" for="driver-date-filter">Violation date</label>
                <input id="driver-date-filter" type="date" class="form-control search-input" value="${this._escapeHtml(filters.date || '')}" />
              </div>
            </div>

            ${violations.length === 0 ? `
              <div class="empty-state">
                <div class="empty-icon">🛡️</div>
                <h4 class="empty-title">Clean Record</h4>
                <p class="empty-text">No traffic citations found for Driver's License Number <strong>${this._escapeHtml(searchedLicense)}</strong>.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="data-table" aria-label="Driver Violation History">
                  <thead>
                    <tr>
                      <th>Citation ID / Date</th>
                      <th>Traffic Violation</th>
                      <th>Vehicle Plate</th>
                      <th>Location</th>
                      <th>Fine and Penalty</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${violations.map(v => {
                      const totalFine = (Number(v.fine) || 0) + (Number(v.surcharge) || 0);
                      const paidAmount = Math.max(0, Number(v.paidAmount) || 0);
                      const remainingFine = v.status === 'paid'
                        ? 0
                        : Math.max(0, Math.round((totalFine - paidAmount) * 100) / 100);
                      const isUnpaid = v.status === 'unpaid';
                      const isPendingReview = v.status === 'pending_review';

                      return `
                        <tr class="table-row ${isUnpaid ? 'row-unpaid' : 'row-paid'}">
                          <td>
                            <span class="record-id">${this._escapeHtml(v.id)}</span>
                            <span class="record-date">${this._escapeHtml(v.date)}</span>
                          </td>
                          <td>
                            <strong>${this._escapeHtml(v.type)}</strong>
                          </td>
                          <td>
                            <span class="plate-badge">${this._escapeHtml(v.plateNo)}</span>
                          </td>
                          <td>${this._escapeHtml(v.location)}</td>
                          <td>
                            <div class="fine-amount-bold">${this._formatCurrency(remainingFine)}</div>
                            <div class="fine-detail-sub">Base: ${this._formatCurrency(v.fine)} | Surcharge: ${this._formatCurrency(v.surcharge)}</div>
                          </td>
                          <td>
                            <span class="status-badge ${isUnpaid ? 'status-unpaid' : isPendingReview ? 'status-pending' : 'status-paid'}">
                              ${isUnpaid ? '● UNPAID' : isPendingReview ? '◷ PENDING REVIEW' : '✔ SETTLED'}
                            </span>
                          </td>
                          <td>
                            ${isUnpaid ? `
                              <button
                                type="button"
                                class="btn btn-primary btn-sm btn-pay-violation"
                                data-id="${this._escapeHtml(v.id)}"
                              >
                                💳 Pay Fine
                              </button>
                              <button
                                type="button"
                                class="btn btn-secondary btn-sm btn-contest-violation"
                                data-id="${this._escapeHtml(v.id)}"
                              >
                                Contest
                              </button>
                            ` : `
                              <span class="settled-label">${isPendingReview ? 'Under Review' : 'Settled'}</span>
                            `}
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        `}
        ${disputeViolation ? `
          <div class="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="dispute-title">
            <div class="auth-modal-card">
              <div class="auth-modal-top">
                <div class="auth-badge-kicker">CITATION DISPUTE</div>
                <button type="button" id="btn-close-dispute-modal" class="auth-close-btn" aria-label="Close dispute form">✕</button>
              </div>
              <h2 id="dispute-title" class="auth-title">Contest Citation ${this._escapeHtml(disputeViolation.id)}</h2>
              <form id="driver-dispute-form" class="auth-form" data-id="${this._escapeHtml(disputeViolation.id)}">
                <div class="auth-form-group">
                  <label class="auth-label" for="dispute-reason">Dispute reason</label>
                  <select id="dispute-reason" class="auth-input" required>
                    <option value="">Select a reason</option>
                    <option value="Incorrect vehicle or plate">Incorrect vehicle or plate</option>
                    <option value="Incorrect driver or license">Incorrect driver or license</option>
                    <option value="Incident details are incorrect">Incident details are incorrect</option>
                    <option value="Evidence or witness available">Evidence or witness available</option>
                  </select>
                </div>
                <div class="auth-form-group">
                  <label class="auth-label" for="dispute-notes">Additional notes</label>
                  <textarea id="dispute-notes" class="auth-input" rows="4" placeholder="Provide supporting details"></textarea>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Submit Dispute</button>
                  <button type="button" id="btn-close-dispute-modal" class="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        ` : ''}
      </section>
    `;
  }
}
