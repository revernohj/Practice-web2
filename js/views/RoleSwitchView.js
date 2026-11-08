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

  renderRail(route = 'home', user = null) {
    const rail = document.querySelector('.left-action-rail');
    if (!rail) return;

    const actions = {
      admin: [
        ['search', '🔍', 'Search Records'],
        ['ledger', '📊', 'Violation Ledger'],
        ['pending', '◷', 'Pending Review'],
        ['export', '⬇', 'Export Selected']
      ],
      enforcer: [
        ['issue', '＋', 'New Citation'],
        ['presets', '⚡', 'Offense Presets'],
        ['demerit', '•', 'Demerit Lookup'],
        ['reset', '↺', 'Clear Form']
      ],
      driver: [
        ['search', '🔍', 'Search License'],
        ['balance', '₱', 'View Balance'],
        ['pay', '💳', 'Pay Fine'],
        ['history', '📋', 'Violation History'],
        ['clearance', '✓', 'Clearance / Print']
      ],
      home: [
        ['login', '🔑', 'Sign In'],
        ['inquiry', '🔍', 'Driver Inquiry'],
        ['citation', '📋', 'Issue Citation'],
        ['records', '🛡️', 'Manage Records']
      ],
      login: [
        ['login', '🔑', 'Sign In'],
        ['inquiry', '🔍', 'Driver Inquiry'],
        ['citation', '📋', 'Issue Citation'],
        ['records', '🛡️', 'Manage Records']
      ]
    };

    const currentActions = actions[route] || actions.home;
    rail.setAttribute('aria-label', route === 'home' || route === 'login'
      ? 'Portal Functions'
      : `${route} dashboard functions`);
    rail.innerHTML = currentActions.map(([action, icon, label]) => `
      <button type="button" class="rail-icon-btn" data-dashboard-action="${action}" aria-label="${label}" title="${label}">
        <span class="rail-icon">${icon}</span>
        <span class="rail-label">${label}</span>
      </button>
    `).join('');

    rail.querySelectorAll('.rail-icon-btn').forEach((button, index) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      button.animate([
        { opacity: 0, transform: 'translateX(-10px) scale(0.72)' },
        { opacity: 1, transform: 'translateX(3px) scale(1.08)', offset: 0.72 },
        { transform: 'translateX(0) scale(1)', offset: 1 }
      ], {
        duration: 480,
        delay: index * 55,
        easing: 'cubic-bezier(.34, 1.56, .64, 1)',
        fill: 'both'
      });
    });
  }

  syncHeader(role = 'home', user = null) {
    const roleMap = {
      admin: 'admin',
      enforcer: 'enforcer',
      driver: 'driver'
    };

    document.querySelectorAll('.top-nav-link[data-role-switch]').forEach((button) => {
      const buttonRole = button.dataset.roleSwitch;
      const isAuthorized = Boolean(user && user.role === buttonRole);
      button.hidden = Boolean(user && !isAuthorized);
      button.classList.toggle('role-nav-hidden', Boolean(user && !isAuthorized));
      button.classList.toggle('active', roleMap[role] === buttonRole && isAuthorized);
    });

    document.querySelectorAll('[data-role-switch]').forEach((button) => {
      button.classList.toggle('active', roleMap[role] === button.dataset.roleSwitch);
    });

    document.querySelectorAll('.top-nav-link[data-role-switch]').forEach((button, index) => {
      if (!button.classList.contains('active') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      button.animate([
        { transform: 'scale(0.92, 1.08)' },
        { transform: 'scale(1.07, 0.94)', offset: 0.55 },
        { transform: 'scale(1)' }
      ], {
        duration: 420,
        delay: index * 20,
        easing: 'cubic-bezier(.34, 1.56, .64, 1)'
      });
    });
  }

  addHandlerRailAction(handler) {
    const rail = document.querySelector('.left-action-rail');
    if (!rail) return;
    rail.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dashboard-action]');
      if (!button) return;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        button.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.18, 0.82)', offset: 0.32 },
          { transform: 'scale(0.92, 1.12)', offset: 0.68 },
          { transform: 'scale(1)' }
        ], {
          duration: 460,
          easing: 'cubic-bezier(.34, 1.56, .64, 1)'
        });
      }
      handler(button.dataset.dashboardAction);
    });
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
                <span class="gate-desc">Sign in through the <a href="#login" style="color: var(--accent-cyan-glow); font-weight: 700; text-decoration: underline;">portal login</a> to access the Administrator, Officer, or Driver dashboard.</span>
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
