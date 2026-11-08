// Owner: Member 3
/**
 * ReceiptView.js
 * View component for rendering the Official Payment Receipt.
 * Displays after a payment transaction is successfully recorded.
 *
 * Mandatory requirement:
 * Labelled explicitly as "PROTOTYPE – NOT AN OFFICIAL RECEIPT".
 */

import View from './View.js';

export default class ReceiptView extends View {
  constructor() {
    super('#receipt-modal-container');
  }

  /**
   * Attaches close / dismiss listener to close the receipt overlay.
   * @param {Function} handler - Callback function
   */
  addHandlerClose(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#btn-close-receipt') || e.target.closest('.receipt-backdrop');
      if (!closeBtn) return;
      handler();
    });
  }

  /**
   * Attaches print listener to trigger browser print dialog.
   */
  addHandlerPrint() {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const printBtn = e.target.closest('#btn-print-receipt');
      if (!printBtn) return;
      window.print();
    });
  }

  /**
   * Generates markup for the Official Payment Receipt modal overlay.
   */
  _generateMarkup() {
    const receipt = this._data;
    if (!receipt) return '';

    return `
      <div class="receipt-backdrop" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <div class="receipt-card-container">
          <div class="receipt-actions-top">
            <button type="button" id="btn-print-receipt" class="btn btn-outline-primary btn-sm">
              🖨️ Print Receipt
            </button>
            <button type="button" id="btn-close-receipt" class="btn btn-secondary btn-sm" aria-label="Close receipt">
              ✕ Close
            </button>
          </div>

          <div class="receipt-paper" id="printable-receipt">
            <!-- Academic Prototype Mandatory Watermark / Notice -->
            <div class="receipt-watermark-banner">
              ⚠️ PROTOTYPE – NOT AN OFFICIAL RECEIPT ⚠️
            </div>

            <div class="receipt-header">
              <div class="receipt-logo-wrap">
                <img src="img/lto-logo.png" alt="LTO Seal" class="receipt-logo-img" width="72" height="72" />
              </div>
              <div class="receipt-wordmark">REPUBLIC OF THE PHILIPPINES</div>
              <h2 id="receipt-title" class="receipt-agency">LAND TRANSPORTATION OFFICE</h2>
              <div class="receipt-sub">Quezon City Central Operations &middot; Philippines</div>
              <div class="receipt-title-badge">OFFICIAL PAYMENT RECEIPT</div>
              <div class="receipt-doc-meta">Electronic Citation Clearance Voucher</div>
            </div>

            <hr class="receipt-divider" />

            <div class="receipt-meta-grid">
              <div class="receipt-meta-item">
                <span class="meta-label">Payment Transaction Ref No:</span>
                <span class="meta-value bold-ref">${this._escapeHtml(receipt.refNo)}</span>
              </div>
              <div class="receipt-meta-item">
                <span class="meta-label">Date &amp; Time Paid:</span>
                <span class="meta-value">${this._escapeHtml(receipt.paidAt)}</span>
              </div>
              <div class="receipt-meta-item">
                <span class="meta-label">Violation Citation ID:</span>
                <span class="meta-value">${this._escapeHtml(receipt.violationId)}</span>
              </div>
              <div class="receipt-meta-item">
                <span class="meta-label">Payment Channel:</span>
                <span class="meta-value">Academic Prototype Cashier</span>
              </div>
            </div>

            <hr class="receipt-divider" />

            <div class="receipt-section-title">DRIVER &amp; VEHICLE PARTICULARS</div>
            <table class="receipt-details-table">
              <tbody>
                <tr>
                  <td><strong>Driver Full Name:</strong></td>
                  <td>${this._escapeHtml(receipt.driverName)}</td>
                </tr>
                <tr>
                  <td><strong>Driver's License Number:</strong></td>
                  <td>${this._escapeHtml(receipt.licenseNo)}</td>
                </tr>
                <tr>
                  <td><strong>Vehicle Plate Number:</strong></td>
                  <td>${this._escapeHtml(receipt.plateNo)}</td>
                </tr>
                <tr>
                  <td><strong>Traffic Violation:</strong></td>
                  <td>${this._escapeHtml(receipt.violationType)}</td>
                </tr>
              </tbody>
            </table>

            <hr class="receipt-divider" />

            <div class="receipt-section-title">SETTLEMENT BREAKDOWN</div>
            <table class="receipt-breakdown-table">
              <tbody>
                <tr>
                  <td>Base Statutory Fine</td>
                  <td class="text-right">${this._formatCurrency(receipt.baseFine)}</td>
                </tr>
                <tr>
                  <td>Administrative Surcharge &amp; Penalty</td>
                  <td class="text-right">${this._formatCurrency(receipt.surcharge)}</td>
                </tr>
                <tr class="receipt-total-row">
                  <td><strong>Total Fine and Penalty Settled:</strong></td>
                  <td class="text-right bold-total">${this._formatCurrency(receipt.amount)}</td>
                </tr>
                <tr>
                  <td>Amount Tendered (Cash):</td>
                  <td class="text-right">${this._formatCurrency(receipt.tendered)}</td>
                </tr>
                <tr>
                  <td>Change Dispensed:</td>
                  <td class="text-right">${this._formatCurrency(receipt.change)}</td>
                </tr>
              </tbody>
            </table>

            <div class="receipt-status-seal">
              <span class="seal-badge">CLEARED &amp; PAID</span>
            </div>

            <div class="receipt-footer">
              <p>This document serves as an academic prototype receipt for coursework evaluation.</p>
              <p>LAND TRANSPORTATION OFFICE (LTO) &ndash; PHILIPPINES</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
