// Owner: Shared (Members 1, 2, 3)
/**
 * AuthView.js
 * View component for User Authentication: Login & Registration.
 * Supports Driver, Traffic Enforcer, and Administrator roles with
 * Extends base View.
 */

import View from './View.js';

export default class AuthView extends View {
  constructor() {
    super('#auth-modal-container');
    this._activeTab = 'login'; // 'login' | 'register'
    this._selectedRole = 'driver'; // 'driver' | 'enforcer' | 'admin'
  }

  /**
   * Overrides render to keep track of local UI tab/role state if provided.
   */
  render(data) {
    if (data?.tab) this._activeTab = data.tab;
    if (data?.role) this._selectedRole = data.role;
    super.render(data);
  }

  /**
   * Renders an error banner inside the auth message slot.
   * @param {string} message
   */
  renderAuthError(message) {
    const slot = this._parentElement ? this._parentElement.querySelector('#auth-message-slot') : null;
    if (!slot) return;
    slot.innerHTML = `
      <div class="auth-alert auth-alert-danger" role="alert">
        <span class="alert-icon">⚠️</span>
        <span class="alert-text">${this._escapeHtml(message)}</span>
      </div>
    `;
  }

  /**
   * Renders a success banner inside the auth message slot.
   * @param {string} message
   */
  renderAuthSuccess(message) {
    const slot = this._parentElement ? this._parentElement.querySelector('#auth-message-slot') : null;
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
    const slot = this._parentElement ? this._parentElement.querySelector('#auth-message-slot') : null;
    if (slot) slot.innerHTML = '';
  }

  /**
   * Attaches handler for modal close (button, backdrop click, or ESC key).
   * @param {Function} handler
   */
  addHandlerClose(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#btn-close-auth') || e.target.closest('.auth-modal-backdrop');
      if (closeBtn && !e.target.closest('.auth-modal-card')) {
        handler();
      } else if (e.target.closest('#btn-close-auth')) {
        handler();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._parentElement.innerHTML.trim() !== '') {
        handler();
      }
    });
  }

  /**
   * Attaches handler for switching between Login and Register tabs.
   * @param {Function} handler
   */
  addHandlerTabSwitch(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-auth-tab]');
      if (!tabBtn) return;
      const targetTab = tabBtn.dataset.authTab;
      if (targetTab && (targetTab === 'login' || targetTab === 'register')) {
        this._activeTab = targetTab;
        handler(targetTab, this._selectedRole);
      }
    });
  }

  /**
   * Attaches handler for switching the registration role (driver, enforcer, admin).
   * @param {Function} handler
   */
  addHandlerRoleSelect(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const roleBtn = e.target.closest('[data-auth-role-select]');
      if (!roleBtn) return;
      const targetRole = roleBtn.dataset.authRoleSelect;
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
      const form = e.target.closest('#form-auth-login');
      if (!form) return;
      e.preventDefault();

      const usernameInput = form.querySelector('#login-username');
      const passwordInput = form.querySelector('#login-password');

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
      const form = e.target.closest('#form-auth-register');
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
        payload.title = form.querySelector('#reg-admintitle')?.value || 'LTO System Administrator';
      }

      handler(payload);
    });
  }


  /**
   * Generates markup for the Auth Modal.
   */
  _generateMarkup() {
    const isLogin = this._activeTab === 'login';
    const role = this._selectedRole;

    return `
      <div class="auth-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div class="auth-modal-card">
          <!-- Modal Top Control Bar -->
          <div class="auth-modal-top">
            <div class="auth-badge-kicker">LTO SECURITY &amp; ACCESS CONTROL</div>
            <button type="button" id="btn-close-auth" class="auth-close-btn" aria-label="Close authentication modal">
              ✕
            </button>
          </div>

          <!-- Official Agency Wordmark -->
          <div class="auth-brand-row">
            <img src="img/lto-logo.png" alt="LTO Seal" class="auth-brand-logo" width="56" height="56" />
            <div class="auth-brand-text">
              <span class="auth-republic">REPUBLIC OF THE PHILIPPINES</span>
              <h2 id="auth-modal-title" class="auth-title">PORTAL AUTHENTICATION</h2>
              <span class="auth-system">Driver Violation Tracking &amp; Fine Settlement System</span>
            </div>
          </div>

          <!-- Main Tab Switcher: Sign In vs Register -->
          <div class="auth-tab-switch" role="tablist">
            <button
              type="button"
              role="tab"
              class="auth-tab-btn ${isLogin ? 'active' : ''}"
              data-auth-tab="login"
              aria-selected="${isLogin}"
            >
              <span class="tab-icon">🔑</span>
              <span>Sign In</span>
            </button>
            <button
              type="button"
              role="tab"
              class="auth-tab-btn ${!isLogin ? 'active' : ''}"
              data-auth-tab="register"
              aria-selected="${!isLogin}"
            >
              <span class="tab-icon">📝</span>
              <span>Register Account</span>
            </button>
          </div>

          <!-- Slot for Validation Errors or Success Messages -->
          <div id="auth-message-slot" class="auth-alert-slot" aria-live="polite"></div>

          ${isLogin ? this._generateLoginMarkup() : this._generateRegisterMarkup(role)}

          <!-- Footer Notice -->
          <div class="auth-footer-notice">
            <p>Authorized access only &middot; Land Transportation Office Portal</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   */
  _generateLoginMarkup() {
    return `
      <form id="form-auth-login" class="auth-form" novalidate>
        <div class="auth-form-group">
          <label for="login-username" class="auth-label">
            <span>Username or Account ID</span>
            <span class="req">*</span>
          </label>
          <div class="auth-input-wrap">
            <span class="input-icon">👤</span>
            <input
              type="text"
              id="login-username"
              name="username"
              class="auth-input"
              placeholder="e.g., admin, enforcer, driver"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="auth-form-group">
          <label for="login-password" class="auth-label">
            <span>Password</span>
            <span class="req">*</span>
          </label>
          <div class="auth-input-wrap">
            <span class="input-icon">🔒</span>
            <input
              type="password"
              id="login-password"
              name="password"
              class="auth-input"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn-auth-submit">
          <span class="btn-icon">⚡</span>
          <span>SIGN IN TO PORTAL</span>
        </button>

        <div class="auth-bottom-switch">
          <span>Don't have an account yet?</span>
          <button type="button" class="link-switch" data-auth-tab="register">Register as Driver, Enforcer, or Admin</button>
        </div>
      </form>
    `;
  }

  /**
   * Generates Registration Form markup with dynamic role switcher.
   * @param {'driver'|'enforcer'|'admin'} role
   */
  _generateRegisterMarkup(role) {
    return `
      <form id="form-auth-register" class="auth-form" novalidate>
        <!-- Role Selection Segmented Control -->
        <div class="auth-role-picker">
          <span class="role-picker-label">Select Account Type to Register:</span>
          <div class="role-picker-tabs">
            <button
              type="button"
              class="role-picker-btn ${role === 'driver' ? 'active' : ''}"
              data-auth-role-select="driver"
            >
              <span class="picker-icon">🚗</span>
              <span class="picker-name">Driver</span>
            </button>
            <button
              type="button"
              class="role-picker-btn ${role === 'enforcer' ? 'active' : ''}"
              data-auth-role-select="enforcer"
            >
              <span class="picker-icon">📋</span>
              <span class="picker-name">Enforcer</span>
            </button>
            <button
              type="button"
              class="role-picker-btn ${role === 'admin' ? 'active' : ''}"
              data-auth-role-select="admin"
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

        <!-- Common User Credentials -->
        <div class="auth-grid-2">
          <div class="auth-form-group">
            <label for="reg-fullname" class="auth-label">
              <span>Full Legal Name</span>
              <span class="req">*</span>
            </label>
            <input
              type="text"
              id="reg-fullname"
              name="fullName"
              class="auth-input"
              placeholder="${role === 'enforcer' ? 'e.g. Officer Juan Reyes' : 'e.g. Juan C. Dela Cruz'}"
              required
            />
          </div>

          <div class="auth-form-group">
            <label for="reg-username" class="auth-label">
              <span>Account Username</span>
              <span class="req">*</span>
            </label>
            <input
              type="text"
              id="reg-username"
              name="username"
              class="auth-input"
              placeholder="e.g. jdelacruz"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="auth-grid-2">
          <div class="auth-form-group">
            <label for="reg-password" class="auth-label">
              <span>Password (min. 6 chars)</span>
              <span class="req">*</span>
            </label>
            <input
              type="password"
              id="reg-password"
              name="password"
              class="auth-input"
              placeholder="Create strong password"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="auth-form-group">
            <label for="reg-confirmpassword" class="auth-label">
              <span>Confirm Password</span>
              <span class="req">*</span>
            </label>
            <input
              type="password"
              id="reg-confirmpassword"
              name="confirmPassword"
              class="auth-input"
              placeholder="Re-enter password"
              autocomplete="new-password"
              required
            />
          </div>
        </div>

        <!-- Dynamic Role-Specific Inputs -->
        ${this._generateRoleSpecificFields(role)}

        <button type="submit" class="btn-auth-submit">
          <span class="btn-icon">✨</span>
          <span>CREATE ${role.toUpperCase()} ACCOUNT &amp; SIGN IN</span>
        </button>

        <div class="auth-bottom-switch">
          <span>Already registered?</span>
          <button type="button" class="link-switch" data-auth-tab="login">Sign In with your credentials</button>
        </div>
      </form>
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
              <input
                type="text"
                id="reg-licenseno"
                name="licenseNo"
                class="auth-input tabular-nums"
                placeholder="e.g., N01-23-456789"
                maxlength="13"
                required
              />
              <span class="auth-input-hint">Format: Letter + 2 digits - 2 digits - 6 digits</span>
            </div>

            <div class="auth-form-group">
              <label for="reg-plateno" class="auth-label">
                <span>Primary Vehicle Plate Number</span>
                <span class="req">*</span>
              </label>
              <input
                type="text"
                id="reg-plateno"
                name="plateNo"
                class="auth-input tabular-nums"
                placeholder="e.g., ABC 1234 or ABC-1234"
                maxlength="8"
                required
              />
              <span class="auth-input-hint">Standard LTO vehicle registration plate</span>
            </div>
          </div>
        </div>
      `;
    }

    if (role === 'enforcer') {
      return `
        <div class="auth-role-section">
          <div class="role-section-header">LAW ENFORCEMENT CREDENTIALS</div>
          <div class="auth-grid-2">
            <div class="auth-form-group">
              <label for="reg-badgeno" class="auth-label">
                <span>Officer Badge / ID Number</span>
                <span class="req">*</span>
              </label>
              <input
                type="text"
                id="reg-badgeno"
                name="badgeNo"
                class="auth-input tabular-nums"
                placeholder="e.g., LTO-ENF-8492"
                required
              />
              <span class="auth-input-hint">Official Highway Patrol / LTO Badge</span>
            </div>

            <div class="auth-form-group">
              <label for="reg-sector" class="auth-label">
                <span>Assigned Sector / Station</span>
                <span class="req">*</span>
              </label>
              <input
                type="text"
                id="reg-sector"
                name="sector"
                class="auth-input"
                placeholder="e.g., Sector 01 Central NCR"
                required
              />
              <span class="auth-input-hint">Jurisdiction / patrol deployment sector</span>
            </div>
          </div>
        </div>
      `;
    }

    if (role === 'admin') {
      return `
        <div class="auth-role-section">
          <div class="role-section-header">AGENCY AUTHORIZATION &amp; SECURITY</div>
          <div class="auth-grid-2">
            <div class="auth-form-group">
              <label for="reg-adminpasscode" class="auth-label">
                <span>Admin Authorization Passcode</span>
                <span class="req">*</span>
              </label>
              <input
                type="password"
                id="reg-adminpasscode"
                name="adminPasscode"
                class="auth-input tabular-nums"
                placeholder="Enter administrator passcode"
                required
              />
            </div>

            <div class="auth-form-group">
              <label for="reg-admintitle" class="auth-label">
                <span>Official Designation / Title</span>
              </label>
              <input
                type="text"
                id="reg-admintitle"
                name="adminTitle"
                class="auth-input"
                placeholder="e.g., Central Records Officer"
              />
              <span class="auth-input-hint">Department role or division title</span>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  /**
   * Returns a helpful summary badge describing what privileges this role has.
   * @param {'driver'|'enforcer'|'admin'} role
   */
  _getRoleDescription(role) {
    if (role === 'driver') {
      return `
        <span class="info-icon">🚗</span>
        <div class="info-text">
          <strong>Registered Driver Account:</strong>
          <span>Inquire outstanding traffic citations, verify violation records, compute statutory penalties, and settle fines via official electronic clearance voucher.</span>
        </div>
      `;
    }
    if (role === 'enforcer') {
      return `
        <span class="info-icon">📋</span>
        <div class="info-text">
          <strong>Traffic Enforcer Account:</strong>
          <span>Authorized to issue electronic traffic violation citations, calculate statutory base fines and administrative surcharges, and assign location checkpoints.</span>
        </div>
      `;
    }
    return `
      <span class="info-icon">🛡️</span>
      <div class="info-text">
        <strong>LTO Administrator Account:</strong>
        <span>Full master audit access: manage violation records, edit citations, perform clearances, review revenue summaries, and monitor traffic enforcement operations.</span>
      </div>
    `;
  }
}
