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

  render(data) {
    const activeElement = document.activeElement;
    const isSearchFocused = activeElement?.id === 'admin-search-input';
    const selectionStart = isSearchFocused ? activeElement.selectionStart : null;
    const selectionEnd = isSearchFocused ? activeElement.selectionEnd : null;
    const selectionDirection = isSearchFocused ? activeElement.selectionDirection : null;

    super.render(data);

    if (isSearchFocused) {
      const searchInput = this._parentElement?.querySelector('#admin-search-input');
      searchInput?.focus({ preventScroll: true });
      if (searchInput && selectionStart !== null && selectionEnd !== null) {
        searchInput.setSelectionRange(selectionStart, selectionEnd, selectionDirection || 'none');
      }
    }
  }

  addHandlerSelection(handler) {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('change', (e) => {
      const checkbox = e.target.closest('.violation-select-checkbox');
      if (checkbox) {
        const ids = [...this._parentElement.querySelectorAll('.violation-select-checkbox:checked')]
          .map(el => el.dataset.id);
        handler(ids);
      }
      const selectAll = e.target.closest('#select-all-violations');
      if (selectAll) {
        this._parentElement.querySelectorAll('.violation-select-checkbox').forEach(el => {
          el.checked = selectAll.checked;
        });
        const ids = selectAll.checked
          ? [...this._parentElement.querySelectorAll('.violation-select-checkbox')].map(el => el.dataset.id)
          : [];
        handler(ids);
      }
    });
  }

  addHandlerBatchActions(settleHandler, exportHandler) {
    if (!this._parentElement) return;
    this._parentElement.addEventListener('click', (e) => {
      const settle = e.target.closest('#btn-bulk-settle');
      if (settle) settleHandler();
      const exportBtn = e.target.closest('#btn-export-selected');
      if (exportBtn) exportHandler();
    });
  }

  exportCsv(rows) {
    const headers = ['Citation ID', 'Driver', 'License', 'Plate', 'Offense', 'Location', 'Date', 'Fine', 'Surcharge', 'Status'];
    const csv = [
      headers.join(','),
      ...rows.map(v => [
        v.id, v.driverName, v.licenseNo, v.plateNo, v.type, v.location, v.date, v.fine, v.surcharge, v.status
      ].map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lto-selected-violations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
    const executiveMetrics = this._data?.executiveMetrics || { revenueSettled: 0, activeViolations: 0, topOffense: 'None' };
    const activityLog = this._data?.activityLog || [];
    const selectedCount = this._data?.selectedCount || 0;
    const pendingReviewCount = this._data?.pendingReviewCount || 0;

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

        <div class="summary-grid executive-metric-grid" role="region" aria-label="Executive metrics">
          <div class="summary-card highlight-card">
            <div class="summary-icon green">💰</div>
            <div class="summary-info">
              <span class="summary-num">${this._formatCurrency(executiveMetrics.revenueSettled)}</span>
              <span class="summary-label">Total Revenue Settled</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon red">⚠️</div>
            <div class="summary-info">
              <span class="summary-num">${executiveMetrics.activeViolations}</span>
              <span class="summary-label">Active Violations</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon blue">🏆</div>
            <div class="summary-info">
              <span class="summary-num" title="${this._escapeHtml(executiveMetrics.topOffense)}">${this._escapeHtml(executiveMetrics.topOffense)}</span>
              <span class="summary-label">Top Recorded Offense</span>
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
              class="filter-pill ${currentStatus === 'pending_review' ? 'active' : ''}"
              data-status="pending_review"
            >
              Pending Review (${pendingReviewCount})
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

        <div class="batch-action-bar" role="toolbar" aria-label="Selected violation actions">
          <span class="subhead-meta">${selectedCount} selected</span>
          <button type="button" id="btn-bulk-settle" class="btn btn-primary btn-sm" ${selectedCount === 0 ? 'disabled' : ''}>
            ✓ Bulk Settle
          </button>
          <button type="button" id="btn-export-selected" class="btn btn-secondary btn-sm" ${selectedCount === 0 ? 'disabled' : ''}>
            Export Selected CSV
          </button>
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
                  <th><input type="checkbox" id="select-all-violations" aria-label="Select all violations" /></th>
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
                        <input type="checkbox" class="violation-select-checkbox" data-id="${this._escapeHtml(v.id)}"
                          aria-label="Select citation ${this._escapeHtml(v.id)}" />
                      </td>
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
        <div class="activity-feed" aria-label="Recent activity trail">
          <div class="section-subhead">
            <h3>Audit / Activity Trail</h3>
          </div>
          ${activityLog.length === 0 ? `
            <div class="empty-state compact-empty"><p class="empty-text">No recent activity recorded.</p></div>
          ` : `
            <ul class="activity-list">
              ${activityLog.slice(0, 8).map(entry => `
                <li class="activity-item">
                  <span class="activity-dot ${this._escapeHtml(entry.type || 'status')}"></span>
                  <div>
                    <strong>${this._escapeHtml(entry.message)}</strong>
                    <span class="activity-meta">${this._escapeHtml(entry.actor || 'System')} · ${this._escapeHtml(entry.timestamp || '').replace('T', ' ').slice(0, 16)}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          `}
        </div>
      </section>
    `;
  }
}
