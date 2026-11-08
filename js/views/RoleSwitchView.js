// Owner: Member 2
/**
 * RoleSwitchView.js
 * View component for the portal role switcher with Role-Based Access Control (RBAC).
 *
 * Rules:
 * 1. Unauthenticated users see the access gate banner.
 * 2. Authenticated users see their authorized panel active and other roles locked.
 * 3. Prevents unauthorized role switching across Driver, Officer, and Admin.
 * Extends base View.
 */

import View from './View.js';

export default class RoleSwitchView extends View {
  constructor() {
    super('#role-switch-container');
  }

  /**
   * Attaches click listener to role buttons and notifies the controller.
   * @param {Function} handler - Callback function receiving selected role
   */
  addHandlerRoleChange(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.role-btn');
      if (!btn) return;

      const newRole = btn.dataset.role;
      if (newRole) {
        handler(newRole);
      }
    });
  }

  /**
   * Generates markup for the role switcher navigation.
   * Enforces visual RBAC indicators.
   */
  _generateMarkup() {
    const user = this._data?.user || null;
    const currentRole = user ? user.role : null;

    // 1. Unauthenticated State: Show Portal Access Controlled Gate
    if (!user) {
      return `
        <nav class="role-nav role-nav-gated" aria-label="Portal Role Selection Gate">
          <div class="role-nav-inner">
            <div class="role-nav-gate-notice">
              <span class="gate-lock-icon" aria-hidden="true">🔒</span>
              <div class="gate-text-group">
                <span class="gate-title">SYSTEM PANELS SECURED &middot; AUTHENTICATION REQUIRED</span>
                <span class="gate-desc">Sign in on the <a href="login.html" style="color: var(--accent-cyan-glow); font-weight: 700; text-decoration: underline;">login page</a> to access the Administrator, Officer, or Driver dashboard.</span>
              </div>
            </div>
          </div>
        </nav>
      `;
    }

    // 2. Authenticated State: Show user's authorized panel as active, others locked
    const roles = [
      {
        id: 'admin',
        title: 'LTO Administrator',
        icon: '🛡️',
        desc: 'Violation Management & Records'
      },
      {
        id: 'enforcer',
        title: 'LTO Traffic Enforcer',
        icon: '📋',
        desc: 'Issue Traffic Violations'
      },
      {
        id: 'driver',
        title: 'Registered Driver',
        icon: '🚗',
        desc: 'Driver Inquiries & Pay Fines'
      }
    ];

    return `
      <nav class="role-nav" aria-label="Portal Role Selection">
        <div class="role-nav-inner">
          <div class="role-nav-header-row">
            <span class="role-nav-label">Current Role &amp; Assigned Portal Panel:</span>
            <span class="rbac-indicator-pill">
              <span class="rbac-dot"></span>
              <span>Isolated Role Access Active</span>
            </span>
          </div>

          <div class="role-buttons-group" role="tablist">
            ${roles.map(r => {
              const isUserRole = currentRole === r.id;
              return `
                <button
                  type="button"
                  role="tab"
                  class="role-btn ${isUserRole ? 'active role-btn-authorized' : 'role-btn-locked'}"
                  data-role="${r.id}"
                  aria-selected="${isUserRole}"
                  id="tab-${r.id}"
                  ${!isUserRole ? 'aria-disabled="true"' : ''}
                  title="${isUserRole ? `Active Authorized Panel (${r.title})` : `Access Restricted: Assigned to ${r.title} only`}"
                >
                  <span class="role-icon" aria-hidden="true">${isUserRole ? r.icon : '🔒'}</span>
                  <span class="role-text-wrap">
                    <span class="role-title">${r.title}</span>
                    <span class="role-desc">
                      ${isUserRole ? '✓ Authorized Active Panel' : `Restricted (${r.title})`}
                    </span>
                  </span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </nav>
    `;
  }
}
