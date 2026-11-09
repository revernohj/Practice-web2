// Owner: Shared (Members 1, 2, 3)
import View from './View.js';

export default class AppShellView extends View {
  constructor() {
    super('#portal-access-alert-container');
  }

  runWhenReady(handler) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handler, { once: true });
    } else {
      handler();
    }
  }

  showAccessDenied(message) {
    const container = this._parentElement;
    if (!container) return;

    container.innerHTML = `
      <div class="access-alert-banner alert-danger" role="alert">
        <div class="alert-icon-col">⛔</div>
        <div class="alert-text-col">
          <strong class="alert-title">ACCESS RESTRICTED</strong>
          <p class="alert-msg">${this._escapeHtml(message)}</p>
        </div>
        <button type="button" class="btn-dismiss-alert" id="btn-close-access-alert" aria-label="Dismiss alert">✕</button>
      </div>
    `;
    container.querySelector('#btn-close-access-alert')?.addEventListener('click', () => this.clearAccessDenied());
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  clearAccessDenied() {
    if (this._parentElement) this._parentElement.innerHTML = '';
  }

  syncRouteSections(route) {
    document.querySelectorAll('[data-home-section]').forEach(section => {
      section.classList.toggle('hidden', route !== 'home');
    });
    this._toggleSection('#login-view-section', route === 'login');
    this._toggleSection('#admin-view-section', route === 'admin');
    this._toggleSection('#enforcer-view-section', route === 'enforcer');
    this._toggleSection('#driver-view-section', route === 'driver');
  }

  _toggleSection(selector, show) {
    document.querySelector(selector)?.classList.toggle('hidden', !show);
  }

  syncRoleVisibility(role) {
    const authenticated = Boolean(role);
    this._toggleSection('#login-view-section', !authenticated);
    this._toggleSection('#admin-view-section', authenticated && role === 'admin');
    this._toggleSection('#enforcer-view-section', authenticated && role === 'enforcer');
    this._toggleSection('#driver-view-section', authenticated && role === 'driver');
  }

  updateHeroMetrics(summary) {
    const heroVal = document.querySelector('#hero-outstanding-val');
    if (heroVal) {
      heroVal.textContent = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(summary.totalUnpaidFines);
    }
  }

  updateNavIndicators(currentUser) {
    const activeRole = currentUser ? currentUser.role : null;
    document.querySelectorAll('[data-role-switch]').forEach(element => {
      const triggerRole = element.dataset.roleSwitch;
      const isTarget = activeRole && triggerRole === activeRole;
      element.classList.toggle('active', Boolean(isTarget));
      element.classList.toggle('restricted-nav-item', Boolean(currentUser && !isTarget));
    });
    document.querySelector('#rail-auth-btn')?.classList.toggle('active', !currentUser);
  }

  setPageState(page, dashboard = null) {
    if (page) document.body.dataset.page = page;
    else delete document.body.dataset.page;
    if (dashboard) document.body.dataset.dashboard = dashboard;
    else delete document.body.dataset.dashboard;
  }

  setCurrentDate() {
    const dateEl = document.querySelector('#portal-current-date');
    if (!dateEl) return;
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  scrollPayment() {
    document.querySelector('#payment-portal-container')?.scrollIntoView({ behavior: 'smooth' });
  }

  executeRailAction(route, action) {
    const focusAndScroll = selector => {
      const element = document.querySelector(selector);
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus?.({ preventScroll: true });
    };

    if (route === 'admin') {
      if (action === 'search') focusAndScroll('#admin-search-input');
      if (action === 'ledger') focusAndScroll('#mgmt-heading');
      if (action === 'pending') document.querySelector('.filter-pill[data-status="pending_review"]')?.click();
      if (action === 'export') document.querySelector('#btn-export-selected:not(:disabled)')?.click();
    } else if (route === 'enforcer') {
      if (action === 'issue') focusAndScroll('#input-license-no');
      if (action === 'presets') focusAndScroll('.offense-preset-row');
      if (action === 'demerit') focusAndScroll('#input-license-no');
      if (action === 'reset') document.querySelector('#btn-reset-form')?.click();
    } else if (route === 'driver') {
      if (action === 'search') focusAndScroll('#input-driver-search-license');
      if (action === 'balance') focusAndScroll('.balance-highlight-box');
      if (action === 'pay') {
        const payButton = document.querySelector('.btn-pay-violation:not([disabled])');
        if (payButton) payButton.click();
        else focusAndScroll('.history-section');
      }
      if (action === 'history') focusAndScroll('.history-section');
      if (action === 'clearance') {
        document.querySelector('#btn-print-clearance')?.click() ||
          focusAndScroll('.clearance-status-row');
      }
    }
  }

  addHandlerGlobalUi({ onRoleSwitch, onLogin, onHamburger }) {
    document.querySelector('#rail-auth-btn')?.addEventListener('click', event => {
      event.preventDefault();
      onLogin();
    });
    document.querySelector('#hero-auth-trigger')?.addEventListener('click', event => {
      event.preventDefault();
      onLogin();
    });
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-role-switch]');
      if (!trigger) return;
      event.preventDefault();
      onRoleSwitch(trigger.dataset.roleSwitch);
    });
    document.querySelector('#btn-hamburger-toggle')?.addEventListener('click', () => {
      document.querySelector('.top-nav-menu')?.classList.toggle('nav-open');
      onHamburger?.();
    });
  }
}
