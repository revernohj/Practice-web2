// Owner: Member 3
/**
 * PaymentView.js
 * View component for processing Payment Transactions on unpaid violations.
 *
 * Features:
 * 1. Live recompute of change / remaining balance as the driver types Amount Tendered.
 * 2. Instant visual validation: highlights whether payment is sufficient or underpaid.
 * 3. Disables submission until full fine amount is tendered.
 */

import View from './View.js';

export default class PaymentView extends View {
  constructor() {
    super('#payment-portal-container');
  }

  /**
   * Attaches live input listener on Amount Tendered field.
   * Notifies controller on every keystroke for real-time change calculation.
   * @param {Function} handler - Callback receiving numeric tendered amount
   */
  addHandlerTenderedInput(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('input', (e) => {
      const input = e.target.closest('#input-amount-tendered');
      if (!input) return;
      const num = parseFloat(input.value) || 0;
      handler(num);
    });
  }

  /**
   * Attaches submit listener for confirming payment transaction.
   * @param {Function} handler - Callback receiving tendered amount
   */
  addHandlerSubmitPayment(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#payment-transaction-form');
      if (!form) return;
      e.preventDefault();

      const input = form.querySelector('#input-amount-tendered');
      const tendered = parseFloat(input?.value) || 0;
      handler(tendered);
    });
  }

  /**
   * Attaches cancel payment listener to return to driver inquiry view.
   * @param {Function} handler - Callback function
   */
  addHandlerCancel(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('#btn-cancel-payment');
      if (!cancelBtn) return;
      handler();
    });
  }

  /**
   * Updates only the live change / remaining balance DOM elements
   * to avoid re-rendering and preserve user's cursor position in input.
   * @param {{ amountDue: number, amountTendered: number, changeDue: number, remainingBalance: number, isSufficient: boolean }} calc
   */
  updateLiveComputation(calc) {
    const changeEl = this._parentElement.querySelector('#live-change-due');
    const remainingRow = this._parentElement.querySelector('#live-remaining-row');
    const remainingEl = this._parentElement.querySelector('#live-remaining-balance');
    const submitBtn = this._parentElement.querySelector('#btn-confirm-payment');
    const feedbackEl = this._parentElement.querySelector('#tendered-feedback');

    if (changeEl) {
      changeEl.textContent = this._formatCurrency(calc.changeDue);
    }

    if (remainingRow && remainingEl) {
      if (calc.remainingBalance > 0) {
        remainingRow.classList.remove('hidden');
        remainingEl.textContent = this._formatCurrency(calc.remainingBalance);
      } else {
        remainingRow.classList.add('hidden');
      }
    }

    if (submitBtn) {
      submitBtn.disabled = !calc.isSufficient;
      if (calc.isSufficient) {
        submitBtn.classList.remove('btn-disabled');
      } else {
        submitBtn.classList.add('btn-disabled');
      }
    }

    if (feedbackEl) {
      if (calc.amountTendered === 0) {
        feedbackEl.textContent = 'Please enter an amount equal to or greater than the total amount due.';
        feedbackEl.className = 'field-hint text-muted';
      } else if (!calc.isSufficient) {
        feedbackEl.textContent = `Insufficient payment: Still short by ${this._formatCurrency(calc.remainingBalance)}.`;
        feedbackEl.className = 'field-hint text-danger';
      } else {
        feedbackEl.textContent = `Payment valid: Change of ${this._formatCurrency(calc.changeDue)} will be dispensed.`;
        feedbackEl.className = 'field-hint text-success';
      }
    }
  }

  /**
   * Generates markup for the Payment Transaction dialog.
   */
  _generateMarkup() {
    const violation = this._data?.violation;
    const draft = this._data?.paymentDraft || {
      amountTendered: 0,
      changeDue: 0,
      remainingBalance: 0,
      isSufficient: false
    };

    if (!violation) {
      return '';
    }

    const totalDue = (Number(violation.fine) || 0) + (Number(violation.surcharge) || 0);

    return `
      <section class="portal-card payment-card" aria-labelledby="payment-heading">
        <div class="card-header flex-between">
          <div class="card-title-group">
            <span class="badge-role">Payment Settlement</span>
            <h2 id="payment-heading" class="card-title">Payment Transaction</h2>
            <p class="card-subtitle">Official LTO fine settlement checkout for Citation #${this._escapeHtml(violation.id)}</p>
          </div>
          <button type="button" id="btn-cancel-payment" class="btn btn-secondary btn-sm">
            ✕ Back to Inquiries
          </button>
        </div>

        <!-- Dedicated Error Slot -->
        <div class="view-error-slot" aria-live="polite"></div>

        <div class="payment-grid">
          <!-- Summary of Citation to be Paid -->
          <div class="payment-summary-col">
            <h3 class="box-title">Citation Summary</h3>
            <div class="citation-details-card">
              <div class="detail-row">
                <span class="detail-label">Citation Reference:</span>
                <span class="detail-value record-id">${this._escapeHtml(violation.id)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Driver Name:</span>
                <span class="detail-value">${this._escapeHtml(violation.driverName)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Driver's License Number:</span>
                <span class="detail-value">${this._escapeHtml(violation.licenseNo)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Vehicle Plate Number:</span>
                <span class="detail-value"><span class="plate-badge">${this._escapeHtml(violation.plateNo)}</span></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Traffic Violation:</span>
                <span class="detail-value"><strong>${this._escapeHtml(violation.type)}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${this._escapeHtml(violation.location)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date of Apprehension:</span>
                <span class="detail-value">${this._escapeHtml(violation.date)}</span>
              </div>
              <hr class="detail-divider" />
              <div class="detail-row">
                <span class="detail-label">Base Statutory Fine:</span>
                <span class="detail-value">${this._formatCurrency(violation.fine)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Administrative Surcharge:</span>
                <span class="detail-value">${this._formatCurrency(violation.surcharge)}</span>
              </div>
              <div class="detail-row total-highlight-row">
                <span class="detail-label"><strong>Total Amount Due:</strong></span>
                <span class="detail-value total-due-highlight"><strong>${this._formatCurrency(totalDue)}</strong></span>
              </div>
            </div>
          </div>

          <!-- Payment Tender Form and Live Calculator -->
          <div class="payment-tender-col">
            <h3 class="box-title">Settlement Details</h3>
            <form id="payment-transaction-form" class="tender-form" novalidate>
              <div class="form-group">
                <label for="input-amount-tendered" class="form-label">
                  Amount Tendered (PHP) <span class="required-star">*</span>
                </label>
                <div class="currency-input-wrap">
                  <span class="currency-symbol">₱</span>
                  <input
                    type="number"
                    id="input-amount-tendered"
                    name="amountTendered"
                    class="form-control currency-input"
                    step="0.01"
                    min="${totalDue}"
                    placeholder="Enter amount handed or paid"
                    required
                    autocomplete="off"
                    autofocus
                  />
                </div>
                <div id="tendered-feedback" class="field-hint text-muted">
                  Please enter an amount equal to or greater than the total amount due.
                </div>
              </div>

              <!-- Quick Exact Amount Buttons -->
              <div class="quick-cash-row">
                <span class="quick-cash-label">Quick Tender:</span>
                <button type="button" class="btn btn-xs btn-outline-primary" id="btn-tender-exact" data-amount="${totalDue}">
                  Exact (₱${totalDue.toLocaleString()})
                </button>
                <button type="button" class="btn btn-xs btn-outline-primary" id="btn-tender-next100" data-amount="${Math.ceil(totalDue / 100) * 100}">
                  ₱${(Math.ceil(totalDue / 100) * 100).toLocaleString()}
                </button>
                <button type="button" class="btn btn-xs btn-outline-primary" id="btn-tender-next1000" data-amount="${Math.ceil(totalDue / 1000) * 1000}">
                  ₱${(Math.ceil(totalDue / 1000) * 1000).toLocaleString()}
                </button>
              </div>

              <!-- Live Recompute Computation Card -->
              <div class="tender-calc-card" aria-live="polite">
                <div class="calc-row">
                  <span class="calc-label">Total Amount Due:</span>
                  <span class="calc-val">${this._formatCurrency(totalDue)}</span>
                </div>
                <div id="live-remaining-row" class="calc-row hidden">
                  <span class="calc-label text-danger">Remaining Balance:</span>
                  <span id="live-remaining-balance" class="calc-val text-danger">₱0.00</span>
                </div>
                <div class="calc-row change-row">
                  <span class="calc-label"><strong>Change Due:</strong></span>
                  <span id="live-change-due" class="calc-val change-val"><strong>₱0.00</strong></span>
                </div>
              </div>

              <div class="tender-actions">
                <button
                  type="submit"
                  id="btn-confirm-payment"
                  class="btn btn-success btn-block btn-disabled"
                  disabled
                >
                  💳 Confirm Payment Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  /**
   * Quick cash tender buttons listener attached via JS
   */
  addHandlerQuickCash(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('[id^="btn-tender-"]');
      if (!btn) return;

      const amount = parseFloat(btn.dataset.amount);
      if (!isNaN(amount)) {
        const input = this._parentElement.querySelector('#input-amount-tendered');
        if (input) {
          input.value = amount;
          handler(amount);
        }
      }
    });
  }
}
