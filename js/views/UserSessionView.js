// Owner: Shared (Members 1, 2, 3)
/**
 * UserSessionView.js
 * View component for rendering active user profile, credentials badge,
 * and authentication triggers in the top-level agency header.
 * Extends base View.
 */

import View from './View.js';

export default class UserSessionView extends View {
  constructor() {
    super('#header-user-session');
  }

  /**
   * Attaches handler for opening the Authentication Modal (Sign In or Register).
   * @param {Function} handler
   */
  addHandlerOpenAuth(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const openBtn = e.target.closest('#btn-header-auth-trigger') || e.target.closest('#btn-switch-account');
      if (!openBtn) return;
      handler('login', 'driver');
    });
  }

  /**
   * Attaches handler for terminating active user session.
   * @param {Function} handler
   */
  addHandlerSignOut(handler) {
    if (!this._parentElement) return;

    this._parentElement.addEventListener('click', (e) => {
      const signOutBtn = e.target.closest('#btn-sign-out');
      if (!signOutBtn) return;
      handler();
    });
  }

  /**
   * Generates markup for the Header User Session.
   */
  _generateMarkup() {
    const user = this._data?.user || null;

    if (!user) {
      return `
        <a href="#login" class="btn-header-auth" id="btn-header-auth-trigger" title="Sign In to Portal">
          <span class="auth-icon" aria-hidden="true">🔑</span>
          <span class="auth-label-wrap">
            <span class="auth-primary-text">LOGIN</span>
            <span class="auth-sub-text">Driver &middot; Enforcer &middot; Admin</span>
          </span>
        </a>
      `;
    }

    const roleIcons = {
      admin: '🛡️',
      enforcer: '📋',
      driver: '🚗'
    };

    const roleLabels = {
      admin: 'LTO ADMINISTRATOR',
      enforcer: 'TRAFFIC ENFORCER',
      driver: 'REGISTERED DRIVER'
    };

    const dashboardUrls = {
      admin: '#admin',
      enforcer: '#enforcer',
      driver: '#driver'
    };

    const targetUrl = dashboardUrls[user.role] || 'index.html';
    const route = typeof window !== 'undefined'
      ? window.location.hash.replace(/^#/, '').split('?')[0].toLowerCase()
      : '';
    const isCurrentDashboard =
      (user.role === 'admin' && route === 'admin') ||
      (user.role === 'enforcer' && route === 'enforcer') ||
      (user.role === 'driver' && route === 'driver');

    let metaInfo = '';
    if (user.role === 'driver' && user.licenseNo) {
      metaInfo = `Lic: ${user.licenseNo}`;
    } else if (user.role === 'enforcer' && user.badgeNo) {
      metaInfo = `Badge: ${user.badgeNo}`;
    } else if (user.role === 'admin' && user.title) {
      metaInfo = user.title;
    }

    return `
      <div class="user-session-pill" role="region" aria-label="Authenticated User Account">
        <div class="user-avatar-wrap">
          <span class="user-avatar-icon" aria-hidden="true">${roleIcons[user.role] || '👤'}</span>
        </div>
        <div class="user-details-group">
          <div class="user-role-badge badge-${this._escapeHtml(user.role)}">
            ${roleLabels[user.role] || user.role.toUpperCase()}
          </div>
          <span class="user-display-name">${this._escapeHtml(user.fullName)}</span>
          ${metaInfo ? `<span class="user-meta-sub tabular-nums">${this._escapeHtml(metaInfo)}</span>` : ''}
        </div>
        <div class="user-actions-group">
          ${!isCurrentDashboard ? `
            <a href="${targetUrl}" class="btn-user-switch" style="text-decoration:none; color: var(--accent-cyan); border-color: var(--accent-cyan);" title="Open My Dashboard">
              Dashboard
            </a>
          ` : ''}
          <button type="button" class="btn-user-switch" id="btn-switch-account" title="Switch Account">
            Switch
          </button>
          <button type="button" class="btn-user-signout" id="btn-sign-out" title="Sign Out">
            Sign Out
          </button>
        </div>
      </div>
    `;
  }
}
