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
import ThemeView from './views/ThemeView.js';
import AppShellView from './views/AppShellView.js';

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
new ThemeView();
const appShellView = new AppShellView();


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
  if (!route || route === 'home') return 'home';
  return ['login', 'admin', 'enforcer', 'driver'].includes(route) ? route : 'home';
}

/**
 * Displays an access-denied notification banner when an unauthorized action is attempted.
 * @param {string} message
 */
function showAccessDenied(message) {
  appShellView.showAccessDenied(message);
}

/**
 * Clears the access alert banner.
 */
function clearAccessAlert() {
  appShellView.clearAccessDenied();
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
  appShellView.syncRoleVisibility(model.state.currentUser && role ? role : null);
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
  appShellView.updateHeroMetrics(model.getSummary(model.state.violations));
}

function executeDashboardRailAction(action) {
  const route = getRoute();
  appShellView.executeRailAction(route, action);
  if (['admin', 'enforcer', 'driver'].includes(route)) return;

  if (action === 'login') showLoginPage('', 'driver');
  if (action === 'inquiry') controlSwitchRole('driver');
  if (action === 'citation') controlSwitchRole('enforcer');
  if (action === 'records') controlSwitchRole('admin');
}

/**
 * Updates top navigation and left vertical rail highlights according to active user role.
 */
function updateNavIndicators() {
  appShellView.updateNavIndicators(model.state.currentUser);
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
    calculation,
    presets: model.state.offensePresets,
    shiftSummary: model.getShiftSummary()
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

function controlPresetSelect(typeName) {
  const preset = model.state.offensePresets.find(p => p.name === typeName);
  const typeConfig = VIOLATION_TYPES.find(t => t.name === typeName) || preset;
  if (!typeConfig) return;
  const calculation = model.calculateFineAndPenalty(
    typeConfig.baseFine,
    typeConfig.surchargeRate || 0
  );
  violationFormView.updatePreset({
    code: preset?.code || typeConfig.code || '—',
    name: typeName,
    description: preset?.name === typeName
      ? VIOLATION_TYPES.find(t => t.name === typeName)?.description || ''
      : typeConfig.description || ''
  }, calculation);
}

function controlDemeritLookup(licenseNo) {
  violationFormView.updateDemerits(model.getDemeritPoints(licenseNo));
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
    searchQuery: model.state.filter.query,
    executiveMetrics: model.getExecutiveMetrics(),
    activityLog: model.state.activityLog,
    selectedCount: model.state.selectedViolationIds.length,
    pendingReviewCount: model.state.violations.filter(v => v.status === 'pending_review').length
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

function controlViolationSelection(ids) {
  model.setSelectedViolationIds(ids);
  renderAdminViews();
}

function controlBulkSettle() {
  if (!model.state.currentUser || model.state.currentUser.role !== 'admin') return;
  const count = model.bulkSettleViolations(model.state.selectedViolationIds);
  renderAdminViews();
  violationListView.renderMessage(count > 0 ? `${count} selected citation(s) marked as Settled.` : 'No eligible citations selected.');
}

function controlExportSelected() {
  const selected = model.state.violations.filter(v => model.state.selectedViolationIds.includes(v.id));
  violationListView.exportCsv(selected);
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
  const filteredViolations = model.getFilteredDriverViolations();

  // 1. Render Driver Balance & History
  driverBalanceView.render({
    driverSearch: model.state.driverSearch,
    violations,
    filteredViolations,
    driverFilters: model.state.driverFilters,
    disputeViolationId: model.state.disputeViolationId,
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

function controlDriverFilter(status, date) {
  model.setDriverFilter({ status, date });
  renderDriverViews();
}

function controlContestViolation(violationId) {
  model.setDisputeViolation(violationId);
  renderDriverViews();
}

function controlSubmitDispute(payload) {
  try {
    model.submitDispute(payload.violationId, payload.reason, payload.notes);
    model.setDisputeViolation(null);
    renderDriverViews();
    driverBalanceView.renderMessage('Your citation dispute was submitted for administrative review.');
  } catch (err) {
    model.setDisputeViolation(payload.violationId);
    renderDriverViews();
    driverBalanceView.renderError(err.message || 'Dispute submission failed.');
  }
}

function controlPrintClearance() {
  window.print();
}

/**
 * Opens payment view for a specific unpaid citation.
 * Member 3 (Driver payment selection)
 * @param {string} violationId
 */
function controlSelectPayment(violationId) {
  model.selectViolationForPayment(violationId);
  renderDriverViews();
  appShellView.scrollPayment();
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

function controlPaymentMethod(paymentMethod) {
  model.updatePaymentMethod(paymentMethod);
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
 * Provides password recovery feedback from the login portal.
 */
function controlForgotPassword(username) {
  if (!username.trim()) {
    loginView.renderAuthError('Enter your email or username first, then request password recovery.');
    return;
  }

  loginView.renderAuthSuccess('Password recovery instructions are available for registered accounts.');
}

/**
 * Handles new user registration for Driver or Enforcer.
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

// ==========================================
// 6. APPLICATION INITIALIZATION
// ==========================================

/**
 * Subscribes all view event handlers to controller functions
 * and initializes state and routing according to the active page.
 */
function init() {
  model.loadState();

  const initialHash = window.location.hash.toLowerCase();
  if (!initialHash || initialHash === '#home' || initialHash.startsWith('#home?')) {
    window.location.replace('#login');
  }

  userSessionView.addHandlerOpenAuth(controlOpenAuth);
  userSessionView.addHandlerSignOut(controlLogout);
  roleSwitchView.addHandlerRoleChange(controlSwitchRole);
  roleSwitchView.addHandlerRailAction(executeDashboardRailAction);
  authView.addHandlerClose(controlCloseAuth);
  authView.addHandlerTabSwitch(controlSwitchAuthTab);
  authView.addHandlerRoleSelect(controlSelectAuthRole);
  authView.addHandlerLogin(controlLogin);
  authView.addHandlerRegister(controlRegister);

  function routePortal() {
    const route = getRoute();
    const hashParts = window.location.hash.replace(/^#/, '').split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    appShellView.syncRouteSections(route);
    roleSwitchView.renderRail(route, model.state.currentUser);
    roleSwitchView.syncHeader(route, model.state.currentUser);

    renderUserSession();
    clearAccessAlert();

    if (route === 'login') {
      if (model.state.currentUser) {
        window.location.replace(getDashboardUrl(model.state.currentUser.role));
        return;
      }
      appShellView.setPageState(null, null);
      loginView.addHandlerLogin(controlLogin);
      loginView.addHandlerRegister(controlRegister);
      loginView.addHandlerForgotPassword(controlForgotPassword);
      loginView.addHandlerTabSwitch((tab, role) => loginView.render({ tab, role }));
      loginView.addHandlerRoleSelect((tab, role) => loginView.render({ tab, role }));
      loginView.render({
        tab: 'login',
        role: params.get('role') || 'driver',
        initialNotice: params.get('notice') || ''
      });
      appShellView.setPageState('login');
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
      appShellView.setPageState(null, route);

      if (route === 'admin') {
        adminEditModalView.addHandlerSave(controlSaveAdminEdit);
        adminEditModalView.addHandlerLiveCompute(controlAdminEditLiveCompute);
        adminEditModalView.addHandlerCancel(controlCloseAdminEdit);
        adminEditModalView.addHandlerIdentifierFormatting();
        violationListView.addHandlerFilter(controlFilterStatus);
        violationListView.addHandlerSearch(controlSearchViolations);
        violationListView.addHandlerEdit(controlOpenAdminEdit);
        violationListView.addHandlerDelete(controlDeleteViolation);
        violationListView.addHandlerSelection(controlViolationSelection);
        violationListView.addHandlerBatchActions(controlBulkSettle, controlExportSelected);
        renderAdminViews();
      } else if (route === 'enforcer') {
        violationFormView.addHandlerSubmit(controlSubmitViolation);
        violationFormView.addHandlerLiveCompute(controlLiveFineCompute);
        violationFormView.addHandlerCancelEdit(controlCancelEdit);
        violationFormView.addHandlerResetFields();
        violationFormView.addHandlerPresetClick(controlPresetSelect);
        violationFormView.addHandlerDemeritLookup(controlDemeritLookup);
        violationFormView.addHandlerIdentifierFormatting();
        renderEnforcerFormView();
      } else {
        driverBalanceView.addHandlerSearch(controlSearchDriver);
        driverBalanceView.addHandlerPayClick(controlSelectPayment);
        driverBalanceView.addHandlerFilter(controlDriverFilter);
        driverBalanceView.addHandlerContestClick(controlContestViolation);
        driverBalanceView.addHandlerDisputeSubmit(controlSubmitDispute);
        driverBalanceView.addHandlerPrintClearance(controlPrintClearance);
        paymentView.addHandlerTenderedInput(controlPaymentInput);
        paymentView.addHandlerPaymentMethod(controlPaymentMethod);
        paymentView.addHandlerQuickCash(controlPaymentInput);
        paymentView.addHandlerSubmitPayment(controlPay);
        paymentView.addHandlerSlideConfirm(controlPay);
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

    appShellView.setPageState('home', null);
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

  appShellView.setCurrentDate();
  appShellView.addHandlerGlobalUi({
    onLogin: () => {
      if (!model.state.currentUser) showLoginPage();
      else window.location.assign(getDashboardUrl(model.state.currentUser.role));
    },
    onRoleSwitch: targetRole => {
      if (!targetRole) return;
      if (!model.state.currentUser) {
        showLoginPage(`Please sign in to access the ${formatPanelName(targetRole)}.`, targetRole);
        return;
      }
      if (model.state.currentUser.role !== targetRole) {
        showAccessDenied(
          `Access Denied: As a ${formatRoleName(model.state.currentUser.role)}, you can only access the ${formatPanelName(model.state.currentUser.role)}. You do not have permission to view the ${formatPanelName(targetRole)}.`
        );
        return;
      }
      window.location.assign(getDashboardUrl(targetRole));
    }
  });
}

// Kickstart the application once DOM is ready
appShellView.runWhenReady(init);
