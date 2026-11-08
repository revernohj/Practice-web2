// Owner: Shared (Members 1, 2, 3)
/**
 * controller.js
 * MVC Controller: The central orchestrator of user interactions.
 *
 * Requirements & Access Control:
 * 1. Must go through login page to access the main panel.
 * 2. Unauthenticated visitors are gated behind the Login Page.
 * 3. Registered Drivers can ONLY access the Driver Panel.
 * 4. LTO Traffic Enforcers / Officers can ONLY access the Officer Panel.
 * 5. LTO Administrators can ONLY access the Admin Panel.
 * 6. Admin edits violations via an Admin Edit Modal inside the Admin panel.
 */

// Model imports
import * as model from './model.js';
import { VIOLATION_TYPES } from './config.js';

// View imports
import RoleSwitchView from './views/RoleSwitchView.js';
import ViolationFormView from './views/ViolationFormView.js';
import ViolationListView from './views/ViolationListView.js';
import DriverBalanceView from './views/DriverBalanceView.js';
import PaymentView from './views/PaymentView.js';
import ReceiptView from './views/ReceiptView.js';
import AuthView from './views/AuthView.js';
import UserSessionView from './views/UserSessionView.js';
import LoginView from './views/LoginView.js';
import AdminEditModalView from './views/AdminEditModalView.js';

// Instantiate view singletons
const roleSwitchView = new RoleSwitchView();
const violationFormView = new ViolationFormView();
const violationListView = new ViolationListView();
const driverBalanceView = new DriverBalanceView();
const paymentView = new PaymentView();
const receiptView = new ReceiptView();
const authView = new AuthView();
const userSessionView = new UserSessionView();
const loginView = new LoginView();
const adminEditModalView = new AdminEditModalView();


// ==========================================
// 1. ACCESS CONTROL & ROLE SWITCHING
// ==========================================

/**
 * Returns formatted human-readable role name.
 * @param {string} role
 * @returns {string}
 */
function formatRoleName(role) {
  if (role === 'admin') return 'LTO Administrator';
  if (role === 'enforcer') return 'LTO Traffic Enforcer / Officer';
  if (role === 'driver') return 'Registered Driver';
  return 'User';
}

/**
 * Returns target panel name.
 * @param {string} role
 * @returns {string}
 */
function formatPanelName(role) {
  if (role === 'admin') return 'Administrator Panel';
  if (role === 'enforcer') return 'Officer Citation Panel';
  if (role === 'driver') return 'Driver Balance & Payment Panel';
  return 'Main Panel';
}

/**
 * Reads the hash-based route used by the single-page portal.
 * @returns {'home'|'login'|'admin'|'enforcer'|'driver'}
 */
function getRoute() {
  const route = window.location.hash.replace(/^#/, '').split('?')[0].toLowerCase();
  return ['login', 'admin', 'enforcer', 'driver'].includes(route) ? route : 'home';
}

/**
 * Displays an access-denied notification banner when an unauthorized action is attempted.
 * @param {string} message
 */
function showAccessDenied(message) {
  const alertContainer = document.querySelector('#portal-access-alert-container');
  if (!alertContainer) return;

  alertContainer.innerHTML = `
    <div class="access-alert-banner alert-danger" role="alert">
      <div class="alert-icon-col">⛔</div>
      <div class="alert-text-col">
        <strong class="alert-title">ACCESS RESTRICTED</strong>
        <p class="alert-msg">${message}</p>
      </div>
      <button type="button" class="btn-dismiss-alert" id="btn-close-access-alert" aria-label="Dismiss alert">✕</button>
    </div>
  `;

  const closeBtn = alertContainer.querySelector('#btn-close-access-alert');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      alertContainer.innerHTML = '';
    });
  }

  alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Clears the access alert banner.
 */
function clearAccessAlert() {
  const alertContainer = document.querySelector('#portal-access-alert-container');
  if (alertContainer) {
    alertContainer.innerHTML = '';
  }
}

/**
 * Resolves the destination HTML page for a specific role.
 * @param {'admin'|'enforcer'|'driver'|string} role
 * @returns {string}
 */
function getDashboardUrl(role) {
  if (role === 'admin') return 'index.html#admin';
  if (role === 'enforcer') return 'index.html#enforcer';
  if (role === 'driver') return 'index.html#driver';
  return 'index.html#home';
}

/**
 * Directs the user to the dedicated login page (login.html) when authentication is required.
 * @param {string} notice
 * @param {string} role
 */
function showLoginPage(notice = '', role = 'driver') {
  const hash = `#login?notice=${encodeURIComponent(notice)}&role=${encodeURIComponent(role)}`;
  window.location.hash = hash.slice(1);
}

/**
 * Switches the active portal role with strict Role-Based Access Control (RBAC).
 * Enforces:
 * 1. User must be authenticated to access any main panel.
 * 2. Drivers can only access the Driver panel (driver.html).
 * 3. Admins can only access the Admin panel (admin.html).
 * 4. Officers can only access the Officer panel (officer.html).
 * @param {'admin'|'enforcer'|'driver'} newRole
 */
function controlSwitchRole(newRole) {
  // Check 1: User must be authenticated
  if (!model.state.currentUser) {
    showLoginPage(`Authentication Required: Please sign in to access the ${formatPanelName(newRole)}.`, newRole);
    return;
  }

  // Check 2: Strict RBAC enforcement
  const userRole = model.state.currentUser.role;
  if (userRole !== newRole) {
    showAccessDenied(
      `Access Denied: As a ${formatRoleName(userRole)}, you are only authorized to access the ${formatPanelName(userRole)}. You do not have permission to access the ${formatPanelName(newRole)}.`
    );
    return;
  }

  // Check 3: Route to the matching in-page dashboard
  const targetUrl = getDashboardUrl(newRole);
  const route = getRoute();
  if (route !== newRole) {
    window.location.assign(targetUrl);
    return;
  }

  clearAccessAlert();
  model.setRole(newRole);
  renderActiveRoleViews();
  updateNavIndicators();
}

/**
 * Toggles section visibility in the DOM based on active role and authentication.
 * If unauthenticated, displays the login view and hides all role panels.
 * @param {'admin'|'enforcer'|'driver'|null} role
 */
function updateRoleSectionsVisibility(role) {
  const loginSection = document.querySelector('#login-view-section');
  const adminSection = document.querySelector('#admin-view-section');
  const enforcerSection = document.querySelector('#enforcer-view-section');
  const driverSection = document.querySelector('#driver-view-section');

  const isAuthenticated = Boolean(model.state.currentUser && role);

  // Show login section ONLY when unauthenticated
  if (loginSection) {
    loginSection.classList.toggle('hidden', isAuthenticated);
  }

  // Role sections are only visible when authenticated AND matching their role
  if (adminSection) {
    adminSection.classList.toggle('hidden', !isAuthenticated || role !== 'admin');
  }
  if (enforcerSection) {
    enforcerSection.classList.toggle('hidden', !isAuthenticated || role !== 'enforcer');
  }
  if (driverSection) {
    driverSection.classList.toggle('hidden', !isAuthenticated || role !== 'driver');
  }
}

/**
 * Re-renders views based on the current state and synchronizes hero showcase metrics.
 */
function renderActiveRoleViews() {
  if (!model.state.currentUser || !model.state.role) {
    updateHeroMetrics();
    return;
  }

  const currentRole = model.state.role;

  if (currentRole === 'admin') {
    renderAdminViews();
  } else if (currentRole === 'enforcer') {
    renderEnforcerFormView();
  } else if (currentRole === 'driver') {
    renderDriverViews();
  }

  updateHeroMetrics();
}

/**
 * Synchronizes the hero showcase outstanding fine total and active nav indicators.
 */
function updateHeroMetrics() {
  const heroVal = document.querySelector('#hero-outstanding-val');
  if (heroVal) {
    const summary = model.getSummary(model.state.violations);
    heroVal.textContent = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(summary.totalUnpaidFines);
  }
}

/**
 * Updates top navigation and left vertical rail highlights according to active user role.
 */
function updateNavIndicators() {
  const currentUser = model.state.currentUser;
  const activeRole = currentUser ? currentUser.role : null;

  // Sync role triggers across top-nav, left-rail, and hero buttons
  const roleTriggers = document.querySelectorAll('[data-role-switch]');
  roleTriggers.forEach(el => {
    const triggerRole = el.dataset.roleSwitch;
    const isTarget = activeRole && triggerRole === activeRole;
    el.classList.toggle('active', Boolean(isTarget));
    el.classList.toggle('restricted-nav-item', Boolean(currentUser && !isTarget));
  });

  // Rail authentication highlight button
  const railAuthBtn = document.querySelector('#rail-auth-btn');
  if (railAuthBtn) {
    railAuthBtn.classList.toggle('active', !currentUser);
  }
}


// ==========================================
// 2. MEMBER 1: TRAFFIC ENFORCER / OFFICER CONTROLS
// ==========================================

/**
 * Renders the violation issuance form.
 * Member 1 (Enforcer / Officer)
 */
function renderEnforcerFormView() {
  let editingViolation = null;
  let initialType = VIOLATION_TYPES[0].name;

  if (model.state.editingViolationId) {
    editingViolation = model.state.violations.find(v => v.id === model.state.editingViolationId) || null;
    if (editingViolation) {
      initialType = editingViolation.type;
    }
  }

  const typeConfig = VIOLATION_TYPES.find(t => t.name === initialType) || VIOLATION_TYPES[0];
  const calculation = model.calculateFineAndPenalty(typeConfig.baseFine, typeConfig.surchargeRate);

  violationFormView.render({
    editingViolation,
    violationTypes: VIOLATION_TYPES,
    calculation
  });
}

/**
 * Live recompute of Fine and Penalty when violation type is selected.
 * Member 1 (Officer live computation)
 * @param {string} typeName
 */
function controlLiveFineCompute(typeName) {
  const typeConfig = VIOLATION_TYPES.find(t => t.name === typeName);
  if (!typeConfig) return;

  const calculation = model.calculateFineAndPenalty(typeConfig.baseFine, typeConfig.surchargeRate);
  violationFormView.updateLiveFine(calculation);
}

/**
 * Handles submission of a Traffic Violation issued by an Officer.
 * Member 1 (Officer form submission & validation)
 * @param {Object} formData
 */
function controlSubmitViolation(formData) {
  if (!model.state.currentUser || model.state.currentUser.role !== 'enforcer') {
    showAccessDenied('Only authorized Law Enforcement Officers can issue traffic violations.');
    return;
  }

  violationFormView.clearError();

  const validation = model.validateViolationData(formData);
  if (!validation.isValid) {
    violationFormView.renderError(validation.errors.join(' '));
    return;
  }

  if (model.state.editingViolationId) {
    const updated = model.updateViolation(model.state.editingViolationId, formData);
    if (updated) {
      violationFormView.renderMessage(`Traffic Violation record #${updated.id} was updated successfully.`);
      model.setEditingViolation(null);
    }
  } else {
    const created = model.addViolation(formData);
    violationFormView.renderMessage(`Traffic Violation successfully issued! Official Citation ID: ${created.id}`);
    violationFormView.resetForm();
    controlLiveFineCompute(VIOLATION_TYPES[0].name);
  }
}

/**
 * Cancels editing mode on the Enforcer form.
 */
function controlCancelEdit() {
  model.setEditingViolation(null);
  renderEnforcerFormView();
}


// ==========================================
// 3. MEMBER 2: ADMINISTRATOR CONTROLS
// ==========================================

/**
 * Renders the LTO Violation Management master table and summary totals.
 * Member 2 (Admin view)
 */
function renderAdminViews() {
  const filteredViolations = model.getFilteredViolations();
  const summary = model.getSummary(model.state.violations);

  violationListView.render({
    violations: filteredViolations,
    summary,
    currentStatus: model.state.filter.status,
    searchQuery: model.state.filter.query
  });
}

/**
 * Handles status filter pills (All / Unpaid / Paid).
 * Member 2 (Admin filter)
 * @param {'all'|'unpaid'|'paid'} status
 */
function controlFilterStatus(status) {
  if (!model.state.currentUser || model.state.currentUser.role !== 'admin') return;
  model.setFilter({ status });
  renderAdminViews();
}

/**
 * Handles search input for license number or plate.
 * Member 2 (Admin search)
 * @param {string} query
 */
function controlSearchViolations(query) {
  if (!model.state.currentUser || model.state.currentUser.role !== 'admin') return;
  model.setFilter({ query });
  renderAdminViews();
}

/**
 * Opens Admin Edit Modal to modify a citation record directly within the Admin panel.
 * Keeps Admin within their assigned panel without switching to the Enforcer section.
 * Member 2 (Admin edit)
 * @param {string} violationId
 */
function controlOpenAdminEdit(violationId) {
  if (!model.state.currentUser || model.state.currentUser.role !== 'admin') {
    showAccessDenied('Only Administrators can edit citations in the master ledger.');
    return;
  }

  const violation = model.state.violations.find(v => v.id === violationId);
  if (!violation) return;

  const typeConfig = VIOLATION_TYPES.find(t => t.name === violation.type) || VIOLATION_TYPES[0];
  const calculation = model.calculateFineAndPenalty(typeConfig.baseFine, typeConfig.surchargeRate);

  model.setEditingViolation(violationId);
  adminEditModalView.render({
    violation,
    violationTypes: VIOLATION_TYPES,
    calculation
  });
}

/**
 * Live recompute of Fine and Penalty inside the Admin Edit Modal.
 * @param {string} typeName
 */
function controlAdminEditLiveCompute(typeName) {
  const typeConfig = VIOLATION_TYPES.find(t => t.name === typeName);
  if (!typeConfig) return;

  const calculation = model.calculateFineAndPenalty(typeConfig.baseFine, typeConfig.surchargeRate);
  adminEditModalView.updateLiveFine(calculation);
}

/**
 * Saves edited violation record and updates the Admin ledger table.
 * @param {string} id
 * @param {Object} formData
 */
function controlSaveAdminEdit(id, formData) {
  adminEditModalView.clearError();

  const validation = model.validateViolationData(formData);
  if (!validation.isValid) {
    adminEditModalView.renderError(validation.errors.join(' '));
    return;
  }

  const updated = model.updateViolation(id, formData);
  if (updated) {
    adminEditModalView.clear();
    renderAdminViews();
    violationListView.renderMessage(`Citation #${updated.id} was updated successfully.`);
  }
}

/**
 * Cancels and closes the Admin Edit Modal.
 */
function controlCloseAdminEdit() {
  model.setEditingViolation(null);
  adminEditModalView.clear();
}

/**
 * Deletes a violation record and re-renders the list.
 * Member 2 (Admin delete)
 * @param {string} violationId
 */
function controlDeleteViolation(violationId) {
  if (!model.state.currentUser || model.state.currentUser.role !== 'admin') {
    showAccessDenied('Only Administrators can delete citations from the master ledger.');
    return;
  }

  const deleted = model.deleteViolation(violationId);
  if (deleted) {
    renderAdminViews();
    violationListView.renderMessage(`Citation #${violationId} was permanently deleted.`);
  }
}

/**
 * Resets demo data back to initial seeds.
 * Member 2 (Admin utility)
 */
function controlResetDemoData() {
  if (!model.state.currentUser || model.state.currentUser.role !== 'admin') {
    showAccessDenied('Only Administrators can reset system demo data.');
    return;
  }

  model.resetDemoData();
  renderAdminViews();
  violationListView.renderMessage('Demo citations restored to default coursework state.');
}


// ==========================================
// 4. MEMBER 3: REGISTERED DRIVER CONTROLS
// ==========================================

/**
 * Renders Driver Portal views: DriverBalanceView, PaymentView, and ReceiptView.
 * Member 3 (Driver view)
 */
function renderDriverViews() {
  const violations = model.getDriverViolations();
  const outstandingBalance = model.getOutstandingBalance(model.state.violations, model.state.driverSearch.licenseNo);

  // 1. Render Driver Balance & History
  driverBalanceView.render({
    driverSearch: model.state.driverSearch,
    violations,
    outstandingBalance
  });

  // 2. Render Payment View if a violation is selected for payment
  if (model.state.selectedViolationId) {
    const selectedViolation = model.state.violations.find(v => v.id === model.state.selectedViolationId);
    paymentView.render({
      violation: selectedViolation,
      paymentDraft: model.state.paymentDraft
    });
  } else {
    paymentView.clear();
  }

  // 3. Render Official Payment Receipt modal if present
  if (model.state.lastReceipt) {
    receiptView.render(model.state.lastReceipt);
  } else {
    receiptView.clear();
  }
}

/**
 * Searches violations by Driver's License Number.
 * Member 3 (Driver search)
 * @param {string} licenseNo
 */
function controlSearchDriver(licenseNo) {
  driverBalanceView.clearError();

  const cleanLicense = (licenseNo || '').trim();
  if (!cleanLicense) {
    driverBalanceView.renderError("Please enter a Driver's License Number.");
    return;
  }

  model.searchDriver(cleanLicense);
  renderDriverViews();
}

/**
 * Opens payment view for a specific unpaid citation.
 * Member 3 (Driver payment selection)
 * @param {string} violationId
 */
function controlSelectPayment(violationId) {
  model.selectViolationForPayment(violationId);
  renderDriverViews();

  const paymentSection = document.querySelector('#payment-portal-container');
  if (paymentSection) {
    paymentSection.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Live recompute of change / remaining balance as user types Amount Tendered.
 * Member 3 (Driver live-recompute)
 * @param {number} amountTendered
 */
function controlPaymentInput(amountTendered) {
  model.updatePaymentDraft(amountTendered);
  paymentView.updateLiveComputation(model.state.paymentDraft);
}

/**
 * Processes and records completed Payment Transaction.
 * Member 3 (Driver checkout & receipt)
 * @param {number} amountTendered
 */
function controlPay(amountTendered) {
  try {
    paymentView.clearError();
    model.recordPayment(amountTendered);
    renderDriverViews();
  } catch (err) {
    paymentView.renderError(err.message || 'Payment processing failed.');
  }
}

/**
 * Cancels active payment session and returns to citation history.
 * Member 3 (Driver cancel payment)
 */
function controlCancelPayment() {
  model.selectViolationForPayment(null);
  renderDriverViews();
}

/**
 * Closes Official Payment Receipt modal.
 * Member 3 (Driver dismiss receipt)
 */
function controlCloseReceipt() {
  model.clearReceipt();
  receiptView.clear();
}


// ==========================================
// 5. USER AUTHENTICATION & SESSION CONTROLS
// ==========================================

/**
 * Updates the user session indicator in the header.
 */
function renderUserSession() {
  userSessionView.render({ user: model.state.currentUser });
}

/**
 * Opens the Authentication Modal.
 * @param {'login'|'register'} tab
 * @param {'driver'|'enforcer'|'admin'} role
 */
function controlOpenAuth(tab = 'login', role = 'driver') {
  if (!model.state.currentUser) {
    // If not authenticated, focus the in-page login gateway
    showLoginPage();
    return;
  }

  model.setAuthModal(true, tab, role);
  authView.render({
    tab,
    role,
    currentUser: model.state.currentUser
  });
}

/**
 * Closes the Authentication Modal.
 */
function controlCloseAuth() {
  model.setAuthModal(false);
  authView.clear();
}

/**
 * Switches between Login and Register tabs inside Auth modal.
 * @param {'login'|'register'} tab
 * @param {'driver'|'enforcer'|'admin'} role
 */
function controlSwitchAuthTab(tab, role) {
  model.setAuthModal(true, tab, role);
  authView.render({
    tab,
    role,
    currentUser: model.state.currentUser
  });
}

/**
 * Switches the selected role for registration inside Auth modal.
 * @param {'login'|'register'} tab
 * @param {'driver'|'enforcer'|'admin'} role
 */
function controlSelectAuthRole(tab, role) {
  model.setAuthModal(true, tab, role);
  authView.render({
    tab,
    role,
    currentUser: model.state.currentUser
  });
}

/**
 * Handles user login attempt from in-page LoginView or AuthView modal.
 * @param {{ username?: string, password?: string }} credentials
 */
function controlLogin(credentials) {
  loginView.clearAuthMessage();
  authView.clearAuthMessage();

  const validation = model.validateLoginData(credentials);
  if (!validation.isValid) {
    const errorMsg = validation.errors.join(' ');
    loginView.renderAuthError(errorMsg);
    authView.renderAuthError(errorMsg);
    return;
  }

  try {
    const user = model.login(credentials.username, credentials.password);
    const welcomeMsg = `Welcome, ${user.fullName}! Entering ${formatPanelName(user.role)}...`;

    loginView.renderAuthSuccess(welcomeMsg);
    authView.renderAuthSuccess(welcomeMsg);

    const targetUrl = getDashboardUrl(user.role);
    setTimeout(() => {
      controlCloseAuth();
      window.location.assign(targetUrl);
    }, 400);
  } catch (err) {
    const errMsg = err.message || 'Invalid username or password.';
    loginView.renderAuthError(errMsg);
    authView.renderAuthError(errMsg);
  }
}

/**
 * Handles new user registration for Driver, Enforcer, or Admin.
 * @param {Object} payload
 */
function controlRegister(payload) {
  loginView.clearAuthMessage();
  authView.clearAuthMessage();

  try {
    const user = model.register(payload);
    const welcomeMsg = `Account created! Welcome, ${user.fullName}. Entering ${formatPanelName(user.role)}...`;

    loginView.renderAuthSuccess(welcomeMsg);
    authView.renderAuthSuccess(welcomeMsg);

    const targetUrl = getDashboardUrl(user.role);
    setTimeout(() => {
      controlCloseAuth();
      window.location.assign(targetUrl);
    }, 450);
  } catch (err) {
    const errMsg = err.message || 'Registration failed.';
    loginView.renderAuthError(errMsg);
    authView.renderAuthError(errMsg);
  }
}

/**
 * Terminates active user session and redirects to login.html.
 */
function controlLogout() {
  model.logout();
  window.location.hash = 'login?notice=' + encodeURIComponent('You have been signed out successfully.');
}

/**
 * Handles 1-click Quick Demo logins for immediate grading and evaluation.
 * @param {string} demoRole
 */
function controlQuickDemo(demoRole) {
  const targetUser = model.state.users.find(u => u.username === demoRole || u.role === demoRole);
  if (targetUser) {
    controlLogin({
      username: targetUser.username,
      password: targetUser.password
    });
  }
}


// ==========================================
// 6. APPLICATION INITIALIZATION
// ==========================================

/**
 * Subscribes all view event handlers to controller functions
 * and initializes state and routing according to the active page.
 */
function init() {
  model.loadState();

  userSessionView.addHandlerOpenAuth(controlOpenAuth);
  userSessionView.addHandlerSignOut(controlLogout);
  roleSwitchView.addHandlerRoleChange(controlSwitchRole);
  authView.addHandlerClose(controlCloseAuth);
  authView.addHandlerTabSwitch(controlSwitchAuthTab);
  authView.addHandlerRoleSelect(controlSelectAuthRole);
  authView.addHandlerLogin(controlLogin);
  authView.addHandlerRegister(controlRegister);
  authView.addHandlerQuickDemo(controlQuickDemo);

  function routePortal() {
    const route = getRoute();
    const hashParts = window.location.hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    const loginSection = document.querySelector('#login-view-section');
    const adminSection = document.querySelector('#admin-view-section');
    const enforcerSection = document.querySelector('#enforcer-view-section');
    const driverSection = document.querySelector('#driver-view-section');
    const homeSections = document.querySelectorAll('[data-home-section]');

    homeSections.forEach(section => section.classList.toggle('hidden', route !== 'home'));
    if (loginSection) loginSection.classList.toggle('hidden', route !== 'login');
    if (adminSection) adminSection.classList.toggle('hidden', route !== 'admin');
    if (enforcerSection) enforcerSection.classList.toggle('hidden', route !== 'enforcer');
    if (driverSection) driverSection.classList.toggle('hidden', route !== 'driver');

    renderUserSession();
    clearAccessAlert();

    if (route === 'login') {
      if (model.state.currentUser) {
        window.location.replace(getDashboardUrl(model.state.currentUser.role));
        return;
      }
      loginView.addHandlerLogin(controlLogin);
      loginView.addHandlerRegister(controlRegister);
      loginView.addHandlerQuickDemo(controlQuickDemo);
      loginView.addHandlerTabSwitch((tab, role) => loginView.render({ tab, role }));
      loginView.addHandlerRoleSelect((tab, role) => loginView.render({ tab, role }));
      loginView.render({
        tab: 'login',
        role: params.get('role') || 'driver',
        initialNotice: params.get('notice') || ''
      });
      document.body.dataset.page = 'login';
      return;
    }

    if (['admin', 'enforcer', 'driver'].includes(route)) {
      if (!model.state.currentUser) {
        const notice = `Authentication Required: Please sign in to access the ${formatPanelName(route)}.`;
        window.location.hash = `login?role=${route}&notice=${encodeURIComponent(notice)}`;
        return;
      }
      if (model.state.currentUser.role !== route) {
        const notice = `Access Denied: As a ${formatRoleName(model.state.currentUser.role)}, you are only authorized to access the ${formatPanelName(model.state.currentUser.role)}.`;
        window.location.hash = `login?role=${model.state.currentUser.role}&notice=${encodeURIComponent(notice)}`;
        return;
      }

      model.setRole(route);
      document.body.dataset.dashboard = route;

      if (route === 'admin') {
        adminEditModalView.addHandlerSave(controlSaveAdminEdit);
        adminEditModalView.addHandlerLiveCompute(controlAdminEditLiveCompute);
        adminEditModalView.addHandlerCancel(controlCloseAdminEdit);
        violationListView.addHandlerFilter(controlFilterStatus);
        violationListView.addHandlerSearch(controlSearchViolations);
        violationListView.addHandlerEdit(controlOpenAdminEdit);
        violationListView.addHandlerDelete(controlDeleteViolation);
        violationListView.addHandlerResetData(controlResetDemoData);
        renderAdminViews();
      } else if (route === 'enforcer') {
        violationFormView.addHandlerSubmit(controlSubmitViolation);
        violationFormView.addHandlerLiveCompute(controlLiveFineCompute);
        violationFormView.addHandlerCancelEdit(controlCancelEdit);
        violationFormView.addHandlerResetFields();
        renderEnforcerFormView();
      } else {
        driverBalanceView.addHandlerSearch(controlSearchDriver);
        driverBalanceView.addHandlerSampleClick(controlSearchDriver);
        driverBalanceView.addHandlerPayClick(controlSelectPayment);
        paymentView.addHandlerTenderedInput(controlPaymentInput);
        paymentView.addHandlerQuickCash(controlPaymentInput);
        paymentView.addHandlerSubmitPayment(controlPay);
        paymentView.addHandlerCancel(controlCancelPayment);
        receiptView.addHandlerClose(controlCloseReceipt);
        receiptView.addHandlerPrint();
        renderDriverViews();
        if (model.state.currentUser.licenseNo) {
          controlSearchDriver(model.state.currentUser.licenseNo);
        }
      }
      return;
    }

    delete document.body.dataset.dashboard;
    delete document.body.dataset.page;
    if (model.state.currentUser && model.state.role) {
      roleSwitchView.render({ user: model.state.currentUser, role: model.state.role });
    } else {
      roleSwitchView.render({ user: null, role: null });
    }
    updateHeroMetrics();
    updateNavIndicators();
  }

  window.addEventListener('hashchange', routePortal);
  routePortal();

  // Left action rail buttons
  const railAuthBtn = document.querySelector('#rail-auth-btn');
  if (railAuthBtn) {
    railAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!model.state.currentUser) {
        showLoginPage();
      } else {
        window.location.assign(getDashboardUrl(model.state.currentUser.role));
      }
    });
  }

  const heroAuthBtn = document.querySelector('#hero-auth-trigger');
  if (heroAuthBtn) {
    heroAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!model.state.currentUser) {
        showLoginPage();
      } else {
        window.location.assign(getDashboardUrl(model.state.currentUser.role));
      }
    });
  }

  // Display official date in header if element exists
  const dateEl = document.querySelector('#portal-current-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Global listener for dark automotive hero, top-nav, and rail role triggers
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-role-switch]');
    if (!trigger) return;

    e.preventDefault();
    const targetRole = trigger.dataset.roleSwitch;
    if (!targetRole) return;

    // A. Unauthenticated: route to login.html with intent
    if (!model.state.currentUser) {
      showLoginPage(`Please sign in to access the ${formatPanelName(targetRole)}.`, targetRole);
      return;
    }

    // B. Strict RBAC: only allow their assigned role
    if (model.state.currentUser.role !== targetRole) {
      showAccessDenied(
        `Access Denied: As a ${formatRoleName(model.state.currentUser.role)}, you can only access the ${formatPanelName(model.state.currentUser.role)}. You do not have permission to view the ${formatPanelName(targetRole)}.`
      );
      return;
    }

    // C. Authorized: open dashboard
    window.location.assign(getDashboardUrl(targetRole));
  });

  // Mobile hamburger toggle for top navigation
  const hamburgerBtn = document.querySelector('#btn-hamburger-toggle');
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
      const topNav = document.querySelector('.top-nav-menu');
      if (topNav) {
        topNav.classList.toggle('nav-open');
      }
    });
  }
}

// Kickstart the application once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
