// Owner: Member 3
/**
 * PaymentView.js
 * View component for processing Payment Transactions on unpaid violations.
 *
 * Features:
 * 1. Live recompute of change / remaining balance as the driver types Amount Tendered.
 * 2. Instant visual validation: highlights whether payment is sufficient or underpaid.
 * 3. Allows partial payments that reduce the citation balance.
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

    this._parentElement.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const input = e.target.closest('#input-amount-tendered');
      if (!input) return;

      e.preventDefault();
      const current = Math.max(0, parseFloat(input.value) || 0);
      const next = e.key === 'ArrowUp'
        ? current + 100
        : Math.max(0, current - 100);
      const rounded = Math.round(next * 100) / 100;

      input.value = String(rounded);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    this._parentElement.addEventListener('click', (e) => {
      const stepButton = e.target.closest('[data-payment-step]');
      if (!stepButton) return;

      const input = this._parentElement.querySelector('#input-amount-tendered');
      if (!input) return;

      const current = Math.max(0, parseFloat(input.value) || 0);
      const step = Number(stepButton.dataset.paymentStep) || 100;
      const next = Math.max(0, current + step);
      input.value = String(Math.round(next * 100) / 100);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  addHandlerPaymentMethod(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('change', (e) => {
      const input = e.target.closest('input[name="paymentMethod"]');
      if (!input) return;
      handler(input.value);
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

  addHandlerSlideConfirm(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('pointerdown', (e) => {
      const handle = e.target.closest('.slide-pay-handle');
      if (!handle) return;
      const track = handle.closest('.slide-pay-track');
      if (!track || track.classList.contains('is-disabled')) return;
      e.preventDefault();
      handle.setPointerCapture?.(e.pointerId);
      track.classList.add('is-dragging');
      track.dataset.activePointer = String(e.pointerId);
      track.dataset.pointerStartX = String(e.clientX);
    });

    this._parentElement.addEventListener('pointermove', (e) => {
      const track = this._parentElement.querySelector('.slide-pay-track.is-dragging');
      if (!track || track.dataset.activePointer !== String(e.pointerId) || track.classList.contains('is-disabled')) return;
      const handle = track.querySelector('.slide-pay-handle');
      const rect = track.getBoundingClientRect();
      const maxTravel = rect.width - handle.offsetWidth - 8;
      const x = Math.max(0, Math.min(maxTravel, e.clientX - rect.left - handle.offsetWidth / 2));
      track.style.setProperty('--slide-x', `${x}px`);
      track.style.setProperty('--slide-progress', `${Math.round((x / maxTravel) * 100)}%`);
      track.setAttribute('aria-valuenow', String(Math.round((x / maxTravel) * 100)));
    });

    const finishSlide = (e) => {
      const track = this._parentElement.querySelector('.slide-pay-track.is-dragging');
      if (!track || track.dataset.activePointer !== String(e.pointerId)) return;
      const handle = track.querySelector('.slide-pay-handle');
      const rect = track.getBoundingClientRect();
      const maxTravel = rect.width - handle.offsetWidth - 8;
      const x = parseFloat(track.style.getPropertyValue('--slide-x')) || 0;
      const confirmed = x >= maxTravel * 0.82;
      track.classList.remove('is-dragging');
      delete track.dataset.activePointer;
      delete track.dataset.pointerStartX;

      if (!confirmed) {
        track.classList.remove('is-success');
        track.style.setProperty('--slide-x', '0px');
        track.style.setProperty('--slide-progress', '0%');
        track.classList.add('is-returning');
        window.setTimeout(() => track.classList.remove('is-returning'), 420);
        return;
      }

      track.classList.add('is-success');
      track.style.setProperty('--slide-x', `${maxTravel}px`);
      track.style.setProperty('--slide-progress', '100%');
      const input = track.closest('form')?.querySelector('#input-amount-tendered');
      const tendered = parseFloat(input?.value) || 0;
      window.setTimeout(() => handler(tendered), 420);
    };

    this._parentElement.addEventListener('pointerup', finishSlide);
    this._parentElement.addEventListener('pointercancel', finishSlide);
    this._parentElement.addEventListener('keydown', (e) => {
      const track = e.target.closest?.('.slide-pay-track');
      if (!track || track.classList.contains('is-disabled')) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const handle = track.querySelector('.slide-pay-handle');
      const maxTravel = track.getBoundingClientRect().width - handle.offsetWidth - 8;
      track.classList.add('is-success');
      track.style.setProperty('--slide-x', `${maxTravel}px`);
      track.style.setProperty('--slide-progress', '100%');
      const input = track.closest('form')?.querySelector('#input-amount-tendered');
      const tendered = parseFloat(input?.value) || 0;
      window.setTimeout(() => handler(tendered), 420);
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
    const slideTrack = this._parentElement.querySelector('#slide-confirm-payment');
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

    if (slideTrack) {
      slideTrack.classList.toggle('is-disabled', !calc.isSufficient);
      slideTrack.setAttribute('aria-disabled', String(!calc.isSufficient));
      slideTrack.setAttribute('aria-valuenow', '0');
      slideTrack.style.setProperty('--slide-x', '0px');
      slideTrack.style.setProperty('--slide-progress', '0%');
    }

    if (feedbackEl) {
      if (calc.amountTendered === 0) {
        feedbackEl.textContent = 'Enter an amount. Partial payments will reduce the remaining balance.';
        feedbackEl.className = 'field-hint text-muted';
      } else if (calc.remainingBalance > 0) {
        feedbackEl.textContent = `Partial payment: ${this._formatCurrency(calc.remainingBalance)} will remain after this payment.`;
        feedbackEl.className = 'field-hint text-success';
      } else if (calc.changeDue > 0) {
        feedbackEl.textContent = `Payment valid: ${this._formatCurrency(calc.changeDue)} will be returned as change.`;
        feedbackEl.className = 'field-hint text-success';
      } else {
        feedbackEl.textContent = 'Payment valid: This will fully settle the remaining balance.';
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
    const paidAmount = Math.max(0, Number(violation.paidAmount) || 0);
    const remainingDue = violation.status === 'paid' ? 0 : Math.max(0, Math.round((totalDue - paidAmount) * 100) / 100);

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
                <span class="detail-value total-due-highlight"><strong>${this._formatCurrency(remainingDue)}</strong></span>
              </div>
            </div>
          </div>

          <!-- Payment Tender Form and Live Calculator -->
          <div class="payment-tender-col">
            <h3 class="box-title">Settlement Details</h3>
            <form id="payment-transaction-form" class="tender-form" novalidate>
              <fieldset class="payment-method-fieldset">
                <legend>Payment Method</legend>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="credit-card" checked />
                  <span class="payment-method-icon">💳</span>
                  <span>Credit Card</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="gcash" />
                  <span class="payment-method-icon payment-logo"><img src="img/gcash-logo.png" alt="GCash" /></span>
                  <span>GCash</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="paymaya" />
                  <span class="payment-method-icon payment-logo"><img src="img/maya-logo.png" alt="Maya" /></span>
                  <span>Maya</span>
                </label>
                <label class="payment-method-option">
                  <input type="radio" name="paymentMethod" value="qrph" />
                  <span class="payment-method-icon payment-logo"><img src="img/qrph-logo.png" alt="QR Ph" /></span>
                  <span>QR Ph</span>
                </label>
              </fieldset>

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
                    step="100"
                    min="0.01"
                    value="${draft.amountTendered || ''}"
                    placeholder="Enter amount handed or paid"
                    required
                    autocomplete="off"
                    autofocus
                  />
                  <div class="currency-stepper" aria-label="Adjust payment amount by 100 pesos">
                    <button type="button" data-payment-step="100" aria-label="Increase payment by 100 pesos">▲</button>
                    <button type="button" data-payment-step="-100" aria-label="Decrease payment by 100 pesos">▼</button>
                  </div>
                </div>
                <div id="tendered-feedback" class="field-hint text-muted">
                  Please enter an amount equal to or greater than the total amount due.
                </div>
              </div>

              <!-- Quick Exact Amount Buttons -->
              <div class="quick-cash-row">
                <span class="quick-cash-label">Quick Tender:</span>
                <button type="button" class="btn btn-xs btn-outline-primary" id="btn-tender-exact" data-amount="${remainingDue}">
                  Exact (₱${remainingDue.toLocaleString()})
                </button>
                <button type="button" class="btn btn-xs btn-outline-primary" id="btn-tender-next100" data-amount="${Math.min(Math.ceil(remainingDue / 100) * 100, remainingDue)}">
                  ₱${Math.min(Math.ceil(remainingDue / 100) * 100, remainingDue).toLocaleString()}
                </button>
                <button type="button" class="btn btn-xs btn-outline-primary" id="btn-tender-next1000" data-amount="${Math.min(Math.ceil(remainingDue / 1000) * 1000, remainingDue)}">
                  ₱${Math.min(Math.ceil(remainingDue / 1000) * 1000, remainingDue).toLocaleString()}
                </button>
              </div>

              <!-- Live Recompute Computation Card -->
              <div class="tender-calc-card" aria-live="polite">
                <div class="calc-row">
                  <span class="calc-label">Total Amount Due:</span>
                  <span class="calc-val">${this._formatCurrency(remainingDue)}</span>
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
                <div
                  class="slide-pay-track is-disabled"
                  id="slide-confirm-payment"
                  role="slider"
                  tabindex="0"
                  aria-label="Slide to confirm payment"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="0"
                >
                  <div class="slide-pay-progress"></div>
                  <span class="slide-pay-label">Slide to confirm payment</span>
                  <button type="button" class="slide-pay-handle" aria-label="Drag to confirm">
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
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
