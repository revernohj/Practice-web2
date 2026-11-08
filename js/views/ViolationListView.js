// Owner: Member 2
/**
 * ViolationListView.js
 * View component for LTO Violation Management.
 * Used by the LTO Administrator to view, filter, search, edit, and delete
 * all LTO Violation Records, as well as view executive summary metrics.
 */

import View from './View.js';

export default class ViolationListView extends View {
  constructor() {
    super('#violation-list-container');
  }

  /**
   * Attaches status filter change handler (All / Unpaid / Paid).
   * @param {Function} handler - Callback receiving selected status string
   */
  addHandlerFilter(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const filterBtn = e.target.closest('.filter-pill');
      if (!filterBtn) return;

      const status = filterBtn.dataset.status;
      if (status) {
        handler(status);
      }
    });
  }

  /**
   * Attaches search input listener with live filtering as the admin types.
   * @param {Function} handler - Callback receiving search query
   */
  addHandlerSearch(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('input', (e) => {
      const searchInput = e.target.closest('#admin-search-input');
      if (!searchInput) return;
      handler(searchInput.value);
    });
  }

  /**
   * Attaches Edit button click handler.
   * Passes the selected violation ID to controller.
   * @param {Function} handler - Callback receiving violation ID
   */
  addHandlerEdit(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-action-edit');
      if (!editBtn) return;
      const id = editBtn.dataset.id;
      if (id) {
        handler(id);
      }
    });
  }

  /**
   * Attaches Delete button click handler with an in-view confirmation modal/dialog.
   * Prompts the user before deleting to prevent accidental data loss.
   * @param {Function} handler - Callback receiving violation ID to delete
   */
  addHandlerDelete(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      // Step A: Trigger delete confirmation card
      const deleteBtn = e.target.closest('.btn-action-delete');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const confirmBox = this._parentElement.querySelector(`#confirm-box-${id}`);
        if (confirmBox) {
          confirmBox.classList.remove('hidden');
        }
        return;
      }

      // Step B: Cancel delete confirmation
      const cancelConfirmBtn = e.target.closest('.btn-cancel-delete');
      if (cancelConfirmBtn) {
        const id = cancelConfirmBtn.dataset.id;
        const confirmBox = this._parentElement.querySelector(`#confirm-box-${id}`);
        if (confirmBox) {
          confirmBox.classList.add('hidden');
        }
        return;
      }

      // Step C: Confirm delete execution
      const confirmDeleteBtn = e.target.closest('.btn-confirm-delete');
      if (confirmDeleteBtn) {
        const id = confirmDeleteBtn.dataset.id;
        if (id) {
          handler(id);
        }
      }
    });
  }

  /**
   * Attaches handler for the "Reset Demo Data" button.
   * @param {Function} handler - Callback function
   */
  addHandlerResetData(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const resetBtn = e.target.closest('#btn-reset-demo-data');
      if (!resetBtn) return;
      handler();
    });
  }

  /**
   * Attaches handler for "Issue New Violation" quick button.
   * @param {Function} handler - Callback to switch to Enforcer tab
   */
  addHandlerAddNew(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const addBtn = e.target.closest('#btn-add-violation-shortcut');
      if (!addBtn) return;
      handler();
    });
  }

  /**
   * Generates markup for the Administrator Violation Management Dashboard:
   * - Summary KPI metric cards
   * - Search bar & status filter pills
   * - Table of LTO Violation Records with inline actions
   */
  _generateMarkup() {
    const violations = this._data?.violations || [];
    const summary = this._data?.summary || {
      totalRecords: 0,
      totalUnpaidCount: 0,
      totalUnpaidFines: 0,
      totalPaidCount: 0,
      totalPaidFines: 0
    };
    const currentStatus = this._data?.currentStatus || 'all';
    const searchQuery = this._data?.searchQuery || '';

    return `
      <section class="portal-card" aria-labelledby="mgmt-heading">
        <div class="card-header flex-between">
          <div class="card-title-group">
            <span class="badge-role">LTO Administrator</span>
            <h2 id="mgmt-heading" class="card-title">LTO Violation Management</h2>
            <p class="card-subtitle">Comprehensive master ledger of registered citations, status tracking, and penalty audits</p>
          </div>
          <div class="header-action-group">
            <span class="admin-ledger-status-pill">
              🛡️ Official Records Ledger
            </span>
            <button type="button" id="btn-reset-demo-data" class="btn btn-outline-danger btn-sm" title="Restore sample demo violations">
              🔄 Reset Demo Data
            </button>
          </div>
        </div>

        <!-- System Message Slot -->
        <div class="view-message-slot" aria-live="polite"></div>

        <!-- Executive Summary Cards -->
        <div class="summary-grid" role="region" aria-label="LTO Summary Totals">
          <div class="summary-card">
            <div class="summary-icon blue">📁</div>
            <div class="summary-info">
              <span class="summary-num">${summary.totalRecords}</span>
              <span class="summary-label">Total Records</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon red">⚠️</div>
            <div class="summary-info">
              <span class="summary-num">${summary.totalUnpaidCount}</span>
              <span class="summary-label">Total Unpaid Violations</span>
            </div>
          </div>
          <div class="summary-card highlight-card">
            <div class="summary-icon gold">⚖️</div>
            <div class="summary-info">
              <span class="summary-num">${this._formatCurrency(summary.totalUnpaidFines)}</span>
              <span class="summary-label">Total Outstanding Fines</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon green">✅</div>
            <div class="summary-info">
              <span class="summary-num">${this._formatCurrency(summary.totalPaidFines)}</span>
              <span class="summary-label">Settled / Collected Fines</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon" aria-hidden="true">🔍</span>
            <label for="admin-search-input" class="visually-hidden">Search violations</label>
            <input
              type="text"
              id="admin-search-input"
              class="form-control search-input"
              placeholder="Search by Vehicle Plate Number, License, or Driver Name..."
              value="${this._escapeHtml(searchQuery)}"
              autocomplete="off"
            />
          </div>

          <div class="filter-pills-group" role="group" aria-label="Filter by Status">
            <span class="filter-label">Status:</span>
            <button
              type="button"
              class="filter-pill ${currentStatus === 'all' ? 'active' : ''}"
              data-status="all"
            >
              All (${summary.totalRecords})
            </button>
            <button
              type="button"
              class="filter-pill ${currentStatus === 'unpaid' ? 'active' : ''}"
              data-status="unpaid"
            >
              Unpaid (${summary.totalUnpaidCount})
            </button>
            <button
              type="button"
              class="filter-pill ${currentStatus === 'paid' ? 'active' : ''}"
              data-status="paid"
            >
              Paid (${summary.totalPaidCount})
            </button>
          </div>
        </div>

        <!-- Table of Violations -->
        <div class="table-responsive">
          ${violations.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <h3 class="empty-title">No LTO Violation Records Found</h3>
              <p class="empty-text">No records matched your search query or selected status filter.</p>
            </div>
          ` : `
            <table class="data-table" aria-label="LTO Violation Records Table">
              <thead>
                <tr>
                  <th>Citation ID / Date</th>
                  <th>Driver Information</th>
                  <th>Vehicle Plate Number</th>
                  <th>Traffic Violation</th>
                  <th>Location</th>
                  <th>Fine and Penalty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${violations.map(v => {
                  const totalFine = (Number(v.fine) || 0) + (Number(v.surcharge) || 0);
                  const isPaid = v.status === 'paid';

                  return `
                    <tr class="table-row ${isPaid ? 'row-paid' : 'row-unpaid'}">
                      <td>
                        <span class="record-id">${this._escapeHtml(v.id)}</span>
                        <span class="record-date">${this._escapeHtml(v.date)}</span>
                      </td>
                      <td>
                        <div class="driver-name-text">${this._escapeHtml(v.driverName)}</div>
                        <div class="license-code">Lic: ${this._escapeHtml(v.licenseNo)}</div>
                      </td>
                      <td>
                        <span class="plate-badge">${this._escapeHtml(v.plateNo)}</span>
                      </td>
                      <td>
                        <span class="violation-name-text">${this._escapeHtml(v.type)}</span>
                      </td>
                      <td>
                        <span class="location-text">${this._escapeHtml(v.location)}</span>
                      </td>
                      <td>
                        <div class="fine-amount-bold">${this._formatCurrency(totalFine)}</div>
                        <div class="fine-detail-sub">Base: ${this._formatCurrency(v.fine)} + Sur: ${this._formatCurrency(v.surcharge)}</div>
                      </td>
                      <td>
                        <span class="status-badge ${isPaid ? 'status-paid' : 'status-unpaid'}">
                          ${isPaid ? '✔ PAID' : '● UNPAID'}
                        </span>
                      </td>
                      <td>
                        <div class="action-btn-group">
                          <button
                            type="button"
                            class="btn-table btn-action-edit"
                            data-id="${this._escapeHtml(v.id)}"
                            title="Edit this LTO Violation Record"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            class="btn-table btn-action-delete"
                            data-id="${this._escapeHtml(v.id)}"
                            title="Delete this violation"
                          >
                            🗑️ Delete
                          </button>
                        </div>

                        <!-- In-View Delete Confirmation Popover -->
                        <div id="confirm-box-${this._escapeHtml(v.id)}" class="confirm-popover hidden" role="dialog" aria-modal="true">
                          <div class="confirm-content">
                            <p class="confirm-text"><strong>Confirm Delete?</strong> Remove record ${this._escapeHtml(v.id)}?</p>
                            <div class="confirm-actions">
                              <button
                                type="button"
                                class="btn btn-danger btn-xs btn-confirm-delete"
                                data-id="${this._escapeHtml(v.id)}"
                              >
                                Yes, Delete
                              </button>
                              <button
                                type="button"
                                class="btn btn-secondary btn-xs btn-cancel-delete"
                                data-id="${this._escapeHtml(v.id)}"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          `}
        </div>
      </section>
    `;
  }
}
