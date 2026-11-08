// Owner: Shared (Members 1, 2, 3)
/**
 * LoginView.js
 * Dedicated in-page Login & Portal Gate view component.
 * Mounted into #login-portal-container within #login-view-section.
 *
 * Requirements:
 * 1. Must go through login page to access the main panel.
 * 2. Provides 1-click Quick Evaluation profiles for immediate grading (Admin, Officer, Driver).
 * 3. Sign In form with validation error handling.
 * 4. Register Account form with role-specific fields and validation.
 */

import View from './View.js';

export default class LoginView extends View {
  constructor() {
    super('#login-portal-container');
    this._activeTab = 'login'; // 'login' | 'register'
    this._selectedRole = 'driver'; // 'driver' | 'enforcer' | 'admin'
  }

  /**
   * Overrides render to preserve tab/role if supplied.
   */
  render(data) {
    if (data?.tab) this._activeTab = data.tab;
    if (data?.role) this._selectedRole = data.role;
    super.render(data);
  }

  /**
   * Renders an error banner inside the login alert slot.
   * @param {string} message
   */
  renderAuthError(message) {
    const slot = this._parentElement ? this._parentElement.querySelector('#login-message-slot') : null;
    if (!slot) return;
    slot.innerHTML = `
      <div class="auth-alert auth-alert-danger" role="alert">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">${this._escapeHtml(message)}</span>
      </div>
    `;
    slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Renders a success banner inside the login alert slot.
   * @param {string} message
   */
  renderAuthSuccess(message) {
    const slot = this._parentElement ? this._parentElement.querySelector('#login-message-slot') : null;
    if (!slot) return;
    slot.innerHTML = `
      <div class="auth-alert auth-alert-success" role="alert">
        <span class="alert-icon">✅</span>
        <span class="alert-text">${this._escapeHtml(message)}</span>
      </div>
    `;
  }

  /**
   * Clears any active alert in the message slot.
   */
  clearAuthMessage() {
    const slot = this._parentElement ? this._parentElement.querySelector('#login-message-slot') : null;
    if (slot) slot.innerHTML = '';
  }

  /**
   * Attaches handler for switching between Login and Register tabs.
   * @param {Function} handler
   */
  addHandlerTabSwitch(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-login-tab]');
      if (!tabBtn) return;
      const targetTab = tabBtn.dataset.loginTab;
      if (targetTab && (targetTab === 'login' || targetTab === 'register')) {
        this._activeTab = targetTab;
        handler(targetTab, this._selectedRole);
      }
    });
  }

  /**
   * Attaches handler for changing the registration role (driver, enforcer, admin).
   * @param {Function} handler
   */
  addHandlerRoleSelect(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const roleBtn = e.target.closest('[data-reg-role-select]');
      if (!roleBtn) return;
      const targetRole = roleBtn.dataset.regRoleSelect;
      if (targetRole && ['driver', 'enforcer', 'admin'].includes(targetRole)) {
        this._selectedRole = targetRole;
        handler(this._activeTab, targetRole);
      }
    });
  }

  /**
   * Attaches submission handler for the Login form.
   * @param {Function} handler
   */
  addHandlerLogin(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#form-login-portal');
      if (!form) return;
      e.preventDefault();

      const usernameInput = form.querySelector('#portal-login-username');
      const passwordInput = form.querySelector('#portal-login-password');

      handler({
        username: usernameInput ? usernameInput.value : '',
        password: passwordInput ? passwordInput.value : ''
      });
    });
  }

  /**
   * Attaches submission handler for the Registration form.
   * @param {Function} handler
   */
  addHandlerRegister(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('submit', (e) => {
      const form = e.target.closest('#form-register-portal');
      if (!form) return;
      e.preventDefault();

      const fullName = form.querySelector('#reg-fullname')?.value || '';
      const username = form.querySelector('#reg-username')?.value || '';
      const password = form.querySelector('#reg-password')?.value || '';
      const confirmPassword = form.querySelector('#reg-confirmpassword')?.value || '';

      const payload = {
        role: this._selectedRole,
        fullName,
        username,
        password,
        confirmPassword
      };

      if (this._selectedRole === 'driver') {
        payload.licenseNo = form.querySelector('#reg-licenseno')?.value || '';
        payload.plateNo = form.querySelector('#reg-plateno')?.value || '';
      } else if (this._selectedRole === 'enforcer') {
        payload.badgeNo = form.querySelector('#reg-badgeno')?.value || '';
        payload.sector = form.querySelector('#reg-sector')?.value || '';
      } else if (this._selectedRole === 'admin') {
        payload.adminPasscode = form.querySelector('#reg-adminpasscode')?.value || '';
        payload.title = form.querySelector('#reg-admintitle')?.value || 'LTO Administrator';
      }

      handler(payload);
    });
  }

  /**
   * Attaches handler for 1-click Quick Demo logins.
   * @param {Function} handler
   */
  addHandlerQuickDemo(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const demoBtn = e.target.closest('[data-demo-user]');
      if (!demoBtn) return;
      const demoRole = demoBtn.dataset.demoUser;
      if (demoRole) {
        handler(demoRole);
      }
    });
  }

  /**
   * Generates markup for the In-Page Login & Access Control Portal.
   */
  _generateMarkup() {
    const isLogin = this._activeTab === 'login';
    const role = this._selectedRole;
    const initialNotice = this._data?.initialNotice || '';

    return `
      <section class="portal-card login-portal-card" aria-labelledby="login-portal-title">
        <!-- Top Agency Header -->
        <div class="login-portal-header">
          <div class="login-brand-group">
            <img src="img/lto-logo.png" alt="LTO Seal" class="login-brand-logo" width="60" height="60" />
            <div class="login-brand-titles">
              <span class="login-republic">REPUBLIC OF THE PHILIPPINES &middot; LAND TRANSPORTATION OFFICE</span>
              <h2 id="login-portal-title" class="login-portal-title">OFFICIAL PORTAL ACCESS CONTROL</h2>
              <p class="login-portal-desc">
                Secure Authentication Gateway &mdash; You must sign in through this page to access your authorized system panel.
              </p>
            </div>
          </div>
          <div class="login-security-badge">
            <span class="badge-icon">🔒</span>
            <div class="badge-text-wrap">
              <span class="badge-title">ROLE ACCESS CONTROL</span>
              <span class="badge-sub">Admin &middot; Officer &middot; Driver Isolation</span>
            </div>
          </div>
        </div>

        <!-- System Alert Slot (for access warnings or validation results) -->
        <div id="login-message-slot" class="auth-alert-slot" aria-live="assertive">
          ${initialNotice ? `
            <div class="auth-alert auth-alert-warning" role="alert">
              <span class="alert-icon">⚠️</span>
              <span class="alert-text">${this._escapeHtml(initialNotice)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Main Tab Switcher: Sign In vs Register -->
        <div class="auth-tab-switch" role="tablist">
          <button
            type="button"
            role="tab"
            class="auth-tab-btn ${isLogin ? 'active' : ''}"
            data-login-tab="login"
            aria-selected="${isLogin}"
          >
            <span class="tab-icon">🔑</span>
            <span>Sign In to Portal</span>
          </button>
          <button
            type="button"
            role="tab"
            class="auth-tab-btn ${!isLogin ? 'active' : ''}"
            data-login-tab="register"
            aria-selected="${!isLogin}"
          >
            <span class="tab-icon">📝</span>
            <span>Register New Account</span>
          </button>
        </div>

        <!-- Tab Body -->
        ${isLogin ? this._generateLoginMarkup() : this._generateRegisterMarkup(role)}

        <!-- Footer Notice -->
        <div class="auth-footer-notice">
          <p>
            Republic of the Philippines &middot; Land Transportation Office &middot; Role-Based Access Control System
          </p>
        </div>
      </section>
    `;
  }

  /**
   * Generates Sign In Form Markup with 1-click Quick Demo evaluation accounts.
   */
  _generateLoginMarkup() {
    return `
      <form id="form-login-portal" class="auth-form" novalidate>
        <div class="auth-grid-2">
          <div class="auth-form-group">
            <label for="portal-login-username" class="auth-label">
              <span>Username or Account ID</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">👤</span>
              <input
                type="text"
                id="portal-login-username"
                name="username"
                class="auth-input"
                placeholder="e.g. admin, enforcer, driver, or maria"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="auth-form-group">
            <label for="portal-login-password" class="auth-label">
              <span>Password</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">🔒</span>
              <input
                type="password"
                id="portal-login-password"
                name="password"
                class="auth-input"
                placeholder="Default: password123"
                autocomplete="current-password"
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" class="btn-auth-submit" id="btn-submit-portal-login">
          <span class="btn-icon">⚡</span>
          <span>SIGN IN &amp; OPEN DASHBOARD</span>
        </button>

        <!-- 1-Click Demo Evaluation Profiles -->
        <div class="demo-eval-card">
          <div class="demo-eval-header">
            <span class="demo-kicker">1-CLICK QUICK DEMO EVALUATION</span>
            <span class="demo-hint">Click any profile below to instantly log in and access the dashboard:</span>
          </div>
          <div class="demo-buttons-grid">
            <button type="button" class="btn-demo-pill" data-demo-user="admin" title="Open Administrator Dashboard">
              <span class="pill-icon">🛡️</span>
              <span class="pill-text">
                <strong>Administrator</strong>
                <small>Dir. Arturo Santos</small>
              </span>
            </button>
            <button type="button" class="btn-demo-pill" data-demo-user="enforcer" title="Open Officer Dashboard">
              <span class="pill-icon">📋</span>
              <span class="pill-text">
                <strong>Traffic Officer</strong>
                <small>Officer Rommel Cruz</small>
              </span>
            </button>
            <button type="button" class="btn-demo-pill" data-demo-user="driver" title="Open Driver Dashboard">
              <span class="pill-icon">🚗</span>
              <span class="pill-text">
                <strong>Registered Driver</strong>
                <small>Juan Dela Cruz</small>
              </span>
            </button>
          </div>
        </div>
      </form>
    `;
  }

  /**
   * Generates Registration Form Markup with dynamic fields.
   */
  _generateRegisterMarkup(role) {
    return `
      <form id="form-register-portal" class="auth-form" novalidate>
        <!-- Role Selection Segmented Control -->
        <div class="auth-role-picker">
          <span class="role-picker-label">Select Account Type to Register:</span>
          <div class="role-picker-tabs">
            <button
              type="button"
              class="role-picker-btn ${role === 'driver' ? 'active' : ''}"
              data-reg-role-select="driver"
            >
              <span class="picker-icon">🚗</span>
              <span class="picker-name">Driver</span>
            </button>
            <button
              type="button"
              class="role-picker-btn ${role === 'enforcer' ? 'active' : ''}"
              data-reg-role-select="enforcer"
            >
              <span class="picker-icon">📋</span>
              <span class="picker-name">Officer</span>
            </button>
            <button
              type="button"
              class="role-picker-btn ${role === 'admin' ? 'active' : ''}"
              data-reg-role-select="admin"
            >
              <span class="picker-icon">🛡️</span>
              <span class="picker-name">Administrator</span>
            </button>
          </div>
        </div>

        <!-- Role Context Banner -->
        <div class="auth-role-info-card">
          ${this._getRoleDescription(role)}
        </div>

        <!-- Core Account Fields -->
        <div class="auth-grid-2">
          <div class="auth-form-group">
            <label for="reg-fullname" class="auth-label">
              <span>Full Legal Name</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">👤</span>
              <input
                type="text"
                id="reg-fullname"
                class="auth-input"
                placeholder="${role === 'enforcer' ? 'e.g. Officer Juan Reyes' : 'e.g. Juan C. Dela Cruz'}"
                required
              />
            </div>
          </div>

          <div class="auth-form-group">
            <label for="reg-username" class="auth-label">
              <span>Account Username</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">👤</span>
              <input
                type="text"
                id="reg-username"
                class="auth-input"
                placeholder="Choose unique username"
                autocomplete="username"
                required
              />
            </div>
          </div>
        </div>

        <div class="auth-grid-2">
          <div class="auth-form-group">
            <label for="reg-password" class="auth-label">
              <span>Password (min. 6 chars)</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">🔒</span>
              <input
                type="password"
                id="reg-password"
                class="auth-input"
                placeholder="Create strong password"
                autocomplete="new-password"
                required
              />
            </div>
          </div>

          <div class="auth-form-group">
            <label for="reg-confirmpassword" class="auth-label">
              <span>Confirm Password</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">🔒</span>
              <input
                type="password"
                id="reg-confirmpassword"
                class="auth-input"
                placeholder="Re-enter password"
                autocomplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        <!-- Dynamic Role Fields -->
        ${this._generateRoleSpecificFields(role)}

        <button type="submit" class="btn-auth-submit" id="btn-submit-portal-reg">
          <span class="btn-icon">✨</span>
          <span>CREATE ${role.toUpperCase()} ACCOUNT &amp; SIGN IN</span>
        </button>
      </form>
    `;
  }

  /**
   * Generates informative description banner for selected role.
   * @param {'driver'|'enforcer'|'admin'} role
   * @returns {string}
   */
  _getRoleDescription(role) {
    if (role === 'driver') {
      return `
        <span class="info-icon">🚗</span>
        <div class="info-text">
          <strong>Registered Driver Account:</strong>
          <span>Inquire outstanding traffic citations, verify violation records, compute statutory penalties, and settle fines via electronic clearance voucher.</span>
        </div>
      `;
    }
    if (role === 'enforcer') {
      return `
        <span class="info-icon">📋</span>
        <div class="info-text">
          <strong>Traffic Enforcer / Officer Account:</strong>
          <span>Authorized to issue electronic traffic violation citations, calculate statutory base fines, and assign location checkpoints.</span>
        </div>
      `;
    }
    return `
      <span class="info-icon">🛡️</span>
      <div class="info-text">
        <strong>LTO Administrator Account:</strong>
        <span>Full administrative authority over the system citation ledger: view master violation records, search, filter, edit violations, and clear records.</span>
      </div>
    `;
  }

  /**
   * Generates dynamic fields specific to the role.
   * @param {'driver'|'enforcer'|'admin'} role
   */
  _generateRoleSpecificFields(role) {
    if (role === 'driver') {
      return `
        <div class="auth-role-section">
          <div class="role-section-header">DRIVER &amp; VEHICLE CREDENTIALS</div>
          <div class="auth-grid-2">
            <div class="auth-form-group">
              <label for="reg-licenseno" class="auth-label">
                <span>Driver's License Number</span>
                <span class="req">*</span>
              </label>
              <div class="auth-input-wrap">
                <span class="input-icon">💳</span>
                <input
                  type="text"
                  id="reg-licenseno"
                  class="auth-input tabular-nums"
                  placeholder="e.g., N01-23-456789"
                  maxlength="13"
                  required
                />
              </div>
              <span class="auth-input-hint">Format: Letter + 2 digits - 2 digits - 6 digits</span>
            </div>

            <div class="auth-form-group">
              <label for="reg-plateno" class="auth-label">
                <span>Primary Vehicle Plate Number</span>
                <span class="req">*</span>
              </label>
              <div class="auth-input-wrap">
                <span class="input-icon">🚘</span>
                <input
                  type="text"
                  id="reg-plateno"
                  class="auth-input tabular-nums"
                  placeholder="e.g., ABC 1234 or ABC-1234"
                  maxlength="8"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (role === 'enforcer') {
      return `
        <div class="auth-role-section">
          <div class="role-section-header">LAW ENFORCEMENT OFFICER CREDENTIALS</div>
          <div class="auth-grid-2">
            <div class="auth-form-group">
              <label for="reg-badgeno" class="auth-label">
                <span>Badge / Enforcer ID Number</span>
                <span class="req">*</span>
              </label>
              <div class="auth-input-wrap">
                <span class="input-icon">🛡️</span>
                <input
                  type="text"
                  id="reg-badgeno"
                  class="auth-input"
                  placeholder="e.g., LTO-ENF-8492"
                  required
                />
              </div>
            </div>

            <div class="auth-form-group">
              <label for="reg-sector" class="auth-label">
                <span>Patrol Sector / Station Assignment</span>
                <span class="req">*</span>
              </label>
              <div class="auth-input-wrap">
                <span class="input-icon">📍</span>
                <input
                  type="text"
                  id="reg-sector"
                  class="auth-input"
                  placeholder="e.g., Central NCR Sector 01"
                  required
                />
              </div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="auth-role-section">
        <div class="role-section-header">ADMINISTRATOR SECURITY VERIFICATION</div>
        <div class="auth-grid-2">
          <div class="auth-form-group">
            <label for="reg-adminpasscode" class="auth-label">
              <span>Admin Verification Passcode</span>
              <span class="req">*</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">🔐</span>
              <input
                type="password"
                id="reg-adminpasscode"
                class="auth-input"
                placeholder="Passcode: LTO-ADMIN-2026"
                required
              />
            </div>
            <span class="auth-input-hint">Default passcode: <code>LTO-ADMIN-2026</code></span>
          </div>

          <div class="auth-form-group">
            <label for="reg-admintitle" class="auth-label">
              <span>Official Administrative Title</span>
            </label>
            <div class="auth-input-wrap">
              <span class="input-icon">🏷️</span>
              <input
                type="text"
                id="reg-admintitle"
                class="auth-input"
                placeholder="e.g., Regional Operations Director"
              />
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
