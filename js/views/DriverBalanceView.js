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
   * Attaches click listener for quick demo license chips.
   * @param {Function} handler - Callback receiving clicked license number
   */
  addHandlerSampleClick(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const chip = e.target.closest('.sample-license-chip');
      if (!chip) return;

      const license = chip.dataset.license;
      if (license) {
        handler(license);
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

  /**
   * Generates markup for the Driver Portal:
   * - License inquiry search bar with sample chips
   * - Outstanding Balance header
   * - Driver Information card
   * - Violation History table
   */
  _generateMarkup() {
    const searchState = this._data?.driverSearch || { licenseNo: '', searched: false };
    const violations = this._data?.violations || [];
    const outstandingBalance = this._data?.outstandingBalance || 0;
    const searchedLicense = searchState.licenseNo;
    const hasSearched = searchState.searched;

    // Derive driver name and primary plate from violations if present
    const driverRecord = violations.length > 0 ? violations[0] : null;
    const driverName = driverRecord ? driverRecord.driverName : 'Unknown Driver';

    const unpaidCount = violations.filter(v => v.status === 'unpaid').length;
    const paidCount = violations.filter(v => v.status === 'paid').length;

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
                />
                <button type="submit" id="btn-search-driver" class="btn btn-primary">
                  🔍 Search Records
                </button>
              </div>
            </div>
          </form>

          <!-- Quick Test Demo License Chips -->
          <div class="sample-chips-row">
            <span class="sample-chips-label">Sample Driver Records:</span>
            <button type="button" class="sample-license-chip" data-license="N01-23-456789">
              Juan Dela Cruz (N01-23-456789)
            </button>
            <button type="button" class="sample-license-chip" data-license="C02-18-987654">
              Maria Santos (C02-18-987654)
            </button>
            <button type="button" class="sample-license-chip" data-license="D03-21-345678">
              Ricardo Dalisay (D03-21-345678)
            </button>
          </div>
        </div>

        ${!hasSearched ? `
          <div class="driver-welcome-prompt">
            <div class="welcome-icon">🔎</div>
            <h3>Verify Your LTO Driving Credentials</h3>
            <p>Please enter your Driver's License Number above or click one of the sample driver profiles to view your citations and settle penalties.</p>
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
                <span class="info-val">${violations.length} record(s)</span>
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

          <!-- Violation History Section -->
          <div class="history-section">
            <div class="section-subhead">
              <h3>Violation History (${violations.length})</h3>
              <span class="subhead-meta">
                Showing all citations registered under license <strong>${this._escapeHtml(searchedLicense)}</strong>
              </span>
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
                      const isUnpaid = v.status === 'unpaid';

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
                            <div class="fine-amount-bold">${this._formatCurrency(totalFine)}</div>
                            <div class="fine-detail-sub">Base: ${this._formatCurrency(v.fine)} | Surcharge: ${this._formatCurrency(v.surcharge)}</div>
                          </td>
                          <td>
                            <span class="status-badge ${isUnpaid ? 'status-unpaid' : 'status-paid'}">
                              ${isUnpaid ? '● UNPAID' : '✔ PAID'}
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
                            ` : `
                              <span class="settled-label">Settled</span>
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
      </section>
    `;
  }
}
