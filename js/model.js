// Owner: Member 1, Member 2, Member 3
/**
 * model.js
 * MVC Model: Manages application state, business logic calculations,
 * data validation, and localStorage synchronization.
 *
 * RULES:
 * 1. NEVER touches the DOM.
 * 2. NEVER imports any View.
 * 3. All application state is held in the single exported `state` object.
 */

import {
  STORAGE_KEY_VIOLATIONS,
  STORAGE_KEY_PAYMENTS,
  STORAGE_KEY_ROLE,
  STORAGE_KEY_USERS,
  STORAGE_KEY_CURRENT_USER,
  ADMIN_PASSCODE,
  INITIAL_SEED_USERS,
  LICENSE_REGEX,
  PLATE_REGEX,
  VIOLATION_TYPES,
  INITIAL_SEED_VIOLATIONS,
  INITIAL_SEED_PAYMENTS,
  STORAGE_KEY_ACTIVITY,
  STORAGE_KEY_DISPUTES
} from './config.js';

// ==========================================
// 1. CENTRAL APPLICATION STATE
// ==========================================
// When false, the signed-in user is kept for this browser tab only.
let persistSession = true;

export const state = {
  // Current active portal role: 'admin' | 'enforcer' | 'driver' (null when unauthenticated)
  role: null,

  // Registered user accounts (admin, enforcer, driver)
  users: [],

  // Currently authenticated user object (or null if guest/unauthenticated)
  currentUser: null,

  // Auth modal presentation state
  authModal: {
    isOpen: false,
    tab: 'login', // 'login' | 'register'
    selectedRole: 'driver' // 'driver' | 'enforcer' | 'admin'
  },

  // Master list of LTO Violation Records
  violations: [],

  // History of completed Payment Transactions
  payments: [],
  disputes: [],
  activityLog: [],
  selectedViolationIds: [],
  offensePresets: [],
  driverFilters: {
    status: 'all',
    date: ''
  },

  // Administrator filter and search parameters
  filter: {
    status: 'all', // 'all' | 'unpaid' | 'paid'
    query: ''      // searches licenseNo or plateNo
  },

  // State when administrator is editing an existing violation
  editingViolationId: null,

  // Driver portal search state
  driverSearch: {
    licenseNo: '',
    searched: false
  },

  // Violation currently selected by the driver for payment
  selectedViolationId: null,
  disputeViolationId: null,

  // Live payment computation state (amount tendered vs total fine)
  paymentDraft: {
    amountTendered: 0,
    changeDue: 0,
    remainingBalance: 0,
    isSufficient: false
  },
  paymentMethod: 'credit-card',

  // Most recent Payment Transaction receipt to display
  lastReceipt: null
};

state.offensePresets = [
  { label: 'No Helmet', code: 'SBL-04', name: 'Failure to Wear Prescribed Seatbelt / Helmet', baseFine: 1000, surchargeRate: 0.05, demeritPoints: 2 },
  { label: 'Expired Registration', code: 'ORV-06', name: 'Operating an Unregistered Motor Vehicle', baseFine: 5000, surchargeRate: 0.20, demeritPoints: 5 },
  { label: 'Disregarding Traffic Signs', code: 'DTS-01', name: 'Disregarding Traffic Signs (DTS)', baseFine: 1000, surchargeRate: 0.10, demeritPoints: 3 }
];


// ==========================================
// 2. PURE BUSINESS CALCULATIONS (Shared)
// ==========================================

/**
 * Pure calculation: Computes surcharge and total Fine and Penalty.
 * Member 1 (Enforcer logic)
 * @param {number} baseFine - Base violation fine in PHP
 * @param {number} surchargeRate - Percentage surcharge (e.g. 0.10 for 10%)
 * @returns {{ baseFine: number, surcharge: number, total: number }}
 */
export function calculateFineAndPenalty(baseFine, surchargeRate = 0) {
  const base = Math.max(0, Number(baseFine) || 0);
  const rate = Math.max(0, Number(surchargeRate) || 0);
  const surcharge = Math.round(base * rate);
  const total = base + surcharge;
  return { baseFine: base, surcharge, total };
}

/**
 * Pure calculation: Computes change due and remaining balance for a payment.
 * Member 3 (Driver payment logic)
 * @param {number} amountDue - Total fine and penalty due in PHP
 * @param {number} amountTendered - Amount entered by the user
 * @returns {{ amountDue: number, amountTendered: number, changeDue: number, remainingBalance: number, isSufficient: boolean }}
 */
export function calculateChange(amountDue, amountTendered) {
  const due = Math.max(0, Number(amountDue) || 0);
  const tendered = Math.max(0, Number(amountTendered) || 0);

  if (tendered >= due) {
    return {
      amountDue: due,
      amountTendered: tendered,
      changeDue: Math.round((tendered - due) * 100) / 100,
      remainingBalance: 0,
      isSufficient: tendered > 0 && due > 0
    };
  } else {
    return {
      amountDue: due,
      amountTendered: tendered,
      changeDue: 0,
      remainingBalance: Math.round((due - tendered) * 100) / 100,
      isSufficient: tendered > 0 && due > 0
    };
  }
}

export function getViolationBalance(violation) {
  if (!violation) return 0;
  const totalDue = (Number(violation.fine) || 0) + (Number(violation.surcharge) || 0);
  if (violation.status === 'paid') return 0;
  const paidAmount = Math.max(0, Number(violation.paidAmount) || 0);
  return Math.max(0, Math.round((totalDue - paidAmount) * 100) / 100);
}

/**
 * Pure calculation: Returns the total Outstanding Balance for a specific driver.
 * Member 3 (Driver logic)
 * @param {Array} violations - Array of violation objects
 * @param {string} licenseNo - Driver's License Number
 * @returns {number} Sum of all unpaid (fine + surcharge)
 */
export function getOutstandingBalance(violations, licenseNo) {
  if (!licenseNo) return 0;
  const cleanLicense = licenseNo.trim().toUpperCase();

  return violations
    .filter(v => v.licenseNo.toUpperCase() === cleanLicense && v.status !== 'paid')
    .reduce((sum, v) => sum + getViolationBalance(v), 0);
}

/**
 * Pure calculation: Generates summary metrics for LTO Administrator.
 * Member 2 (Admin summary logic)
 * @param {Array} violations - Array of violation objects
 * @returns {{ totalRecords: number, totalUnpaidCount: number, totalUnpaidFines: number, totalPaidCount: number, totalPaidFines: number }}
 */
export function getSummary(violations) {
  const totalRecords = violations.length;

  const unpaidList = violations.filter(v => v.status === 'unpaid');
  const paidList = violations.filter(v => v.status === 'paid');

  const totalUnpaidFines = unpaidList.reduce((sum, v) => sum + (Number(v.fine) || 0) + (Number(v.surcharge) || 0), 0);
  const totalPaidFines = paidList.reduce((sum, v) => sum + (Number(v.fine) || 0) + (Number(v.surcharge) || 0), 0);

  return {
    totalRecords,
    totalUnpaidCount: unpaidList.length,
    totalUnpaidFines,
    totalPaidCount: paidList.length,
    totalPaidFines
  };
}


// ==========================================
// 3. VALIDATION FUNCTIONS
// ==========================================

/**
 * Validates a Traffic Violation submission.
 * Member 1 (Enforcer logic)
 * Rules:
 * - Driver's License Number format (e.g. N01-23-456789)
 * - Vehicle Plate Number format (e.g. ABC 1234)
 * - Driver name required
 * - Violation type required
 * - Location required
 * - Date required and cannot be in the future
 * @param {Object} data - Form input fields
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateViolationData(data) {
  const errors = [];

  const licenseNo = (data.licenseNo || '').trim().toUpperCase();
  const plateNo = (data.plateNo || '').trim().toUpperCase();
  const driverName = (data.driverName || '').trim();
  const type = (data.type || '').trim();
  const location = (data.location || '').trim();
  const dateStr = (data.date || '').trim();

  // 1. License Number
  if (!licenseNo) {
    errors.push("Driver's License Number is required.");
  } else if (!LICENSE_REGEX.test(licenseNo)) {
    errors.push("Driver's License Number must follow Philippine LTO format (e.g., N01-23-456789).");
  }

  // 2. Plate Number
  if (!plateNo) {
    errors.push('Vehicle Plate Number is required.');
  } else if (!PLATE_REGEX.test(plateNo)) {
    errors.push('Vehicle Plate Number must follow standard format (e.g., ABC 1234 or ABC-1234).');
  }

  // 3. Driver Name
  if (!driverName) {
    errors.push('Driver Name is required.');
  } else if (driverName.length < 3) {
    errors.push('Driver Name must be at least 3 characters.');
  }

  // 4. Violation Type
  if (!type) {
    errors.push('Traffic Violation type must be selected.');
  }

  // 5. Location
  if (!location) {
    errors.push('Apprehension Location is required.');
  }

  // 6. Date validation (not in the future)
  if (!dateStr) {
    errors.push('Violation Date is required.');
  } else {
    const violationDate = new Date(dateStr);
    const today = new Date();
    // Reset time portions for pure date comparison
    today.setHours(23, 59, 59, 999);
    if (isNaN(violationDate.getTime())) {
      errors.push('Invalid date format.');
    } else if (violationDate > today) {
      errors.push('Violation Date cannot be in the future.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates Login credentials.
 * @param {{ username?: string, password?: string }} credentials
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateLoginData(credentials = {}) {
  const errors = [];
  const username = (credentials.username || '').trim();
  const password = (credentials.password || '').trim();

  if (!username) {
    errors.push('Username is required.');
  }
  if (!password) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user registration data for Driver or Enforcer roles.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateRegisterData(data = {}) {
  const errors = [];
  const fullName = (data.fullName || '').trim();
  const username = (data.username || '').trim().toLowerCase();
  const password = (data.password || '').trim();
  const confirmPassword = (data.confirmPassword || '').trim();
  const role = (data.role || '').trim().toLowerCase();

  // 1. Role validation
  if (!['driver', 'enforcer'].includes(role)) {
    errors.push('Registration is available only for Driver and Enforcer accounts.');
  }

  // 2. Full Name
  if (!fullName) {
    errors.push('Full Name is required.');
  } else if (fullName.length < 3) {
    errors.push('Full Name must be at least 3 characters.');
  }

  // 3. Username format and uniqueness
  if (!username) {
    errors.push('Username is required.');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters.');
  } else if (!/^[a-z0-9_.-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, dots, and underscores.');
  } else {
    const existing = state.users.find(u => u.username.toLowerCase() === username);
    if (existing) {
      errors.push(`Username "${username}" is already taken. Please choose another.`);
    }
  }

  // 4. Password validation
  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  if (password !== confirmPassword) {
    errors.push('Password and Confirm Password do not match.');
  }

  // 5. Role-specific validation rules
  if (role === 'driver') {
    const licenseNo = (data.licenseNo || '').trim().toUpperCase();
    const plateNo = (data.plateNo || '').trim().toUpperCase();

    if (!licenseNo) {
      errors.push("Driver's License Number is required.");
    } else if (!LICENSE_REGEX.test(licenseNo)) {
      errors.push("License Number must follow Philippine standard (e.g., N01-23-456789).");
    }

    if (!plateNo) {
      errors.push('Vehicle Plate Number is required.');
    } else if (!PLATE_REGEX.test(plateNo)) {
      errors.push('Plate Number must follow standard format (e.g., ABC 1234 or ABC-1234).');
    }
  } else if (role === 'enforcer') {
    const badgeNo = (data.badgeNo || '').trim().toUpperCase();
    const sector = (data.sector || '').trim();

    if (!badgeNo) {
      errors.push('Enforcer Badge / ID Number is required.');
    } else if (badgeNo.length < 4) {
      errors.push('Badge Number must be at least 4 characters (e.g. LTO-ENF-8492).');
    }

    if (!sector) {
      errors.push('Patrol Sector / Station Assignment is required.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}


// ==========================================
// 4. STATE MODIFIERS & LOCALSTORAGE
// ==========================================

/**
 * Persists the current state (violations, payments, role, users, session) to localStorage.
 */
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY_VIOLATIONS, JSON.stringify(state.violations));
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(state.payments));
    localStorage.setItem(STORAGE_KEY_DISPUTES, JSON.stringify(state.disputes));
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(state.activityLog));
    if (state.role) {
      localStorage.setItem(STORAGE_KEY_ROLE, state.role);
    } else {
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(state.users));

    if (state.currentUser && persistSession) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(state.currentUser));
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } else if (state.currentUser) {
      sessionStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(state.currentUser));
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_ROLE);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch (err) {
    // If storage is disabled or quota exceeded, warn gracefully
  }
}

export function addActivity(message, type = 'status') {
  state.activityLog.unshift({
    id: `ACT-${Date.now()}`,
    message: String(message),
    type,
    actor: state.currentUser ? state.currentUser.fullName : 'System',
    timestamp: new Date().toISOString()
  });
  state.activityLog = state.activityLog.slice(0, 50);
  saveState();
}

/**
 * Initializes state from localStorage, or loads default seeds if first run.
 * Ensures user must authenticate through the login page to access any role panel.
 */
export function loadState() {
  try {
    const savedViolations = localStorage.getItem(STORAGE_KEY_VIOLATIONS);
    const savedPayments = localStorage.getItem(STORAGE_KEY_PAYMENTS);
    const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    const savedDisputes = localStorage.getItem(STORAGE_KEY_DISPUTES);
    const savedActivity = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    const savedCurrentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
      || sessionStorage.getItem(STORAGE_KEY_CURRENT_USER);
    persistSession = Boolean(localStorage.getItem(STORAGE_KEY_CURRENT_USER));

    if (savedViolations) {
      state.violations = JSON.parse(savedViolations);
    } else {
      // First load: seed demo records
      state.violations = [...INITIAL_SEED_VIOLATIONS];
    }

    if (savedPayments) {
      state.payments = JSON.parse(savedPayments);
    } else {
      state.payments = [...INITIAL_SEED_PAYMENTS];
    }

    state.disputes = savedDisputes ? JSON.parse(savedDisputes) : [];
    state.activityLog = savedActivity ? JSON.parse(savedActivity) : [];

    // Load registered user accounts (or defaults)
    if (savedUsers) {
      state.users = JSON.parse(savedUsers);
    } else {
      state.users = JSON.parse(JSON.stringify(INITIAL_SEED_USERS));
    }

    // Restore active session if present and valid
    if (savedCurrentUser) {
      const parsedUser = JSON.parse(savedCurrentUser);
      const verified = state.users.find(u => u.username.toLowerCase() === (parsedUser.username || '').toLowerCase());
      if (verified) {
        state.currentUser = verified;
        state.role = verified.role;
      } else {
        state.currentUser = null;
        state.role = null;
      }
    } else {
      // Unauthenticated by default: visitor MUST log in to access the main panel
      state.currentUser = null;
      state.role = null;
    }

    // If active session is a registered driver, auto-populate license search
    if (state.currentUser && state.currentUser.role === 'driver' && state.currentUser.licenseNo) {
      state.driverSearch.licenseNo = state.currentUser.licenseNo;
      state.driverSearch.searched = true;
    }

    saveState();
  } catch (err) {
    // Fallback to seed data on parse error
    state.violations = [...INITIAL_SEED_VIOLATIONS];
    state.payments = [...INITIAL_SEED_PAYMENTS];
    state.users = JSON.parse(JSON.stringify(INITIAL_SEED_USERS));
    state.currentUser = null;
    state.role = null;
  }
}

/**
 * Authenticates a user with username and password.
 * Sets the active role and session.
 * @param {string} rawUsername
 * @param {string} rawPassword
 * @returns {Object} Authenticated user profile
 */
export function login(rawUsername, rawPassword, remember = true) {
  const username = (rawUsername || '').trim().toLowerCase();
  const password = (rawPassword || '').trim();

  const user = state.users.find(u => u.username.toLowerCase() === username && u.password === password);
  if (!user) {
    throw new Error('Invalid credentials. Please verify your username and password.');
  }

  state.currentUser = user;
  state.role = user.role;
  persistSession = remember !== false;

  if (user.role === 'driver' && user.licenseNo) {
    state.driverSearch.licenseNo = user.licenseNo;
    state.driverSearch.searched = true;
  }

  saveState();
  return user;
}

/**
 * Registers a new user account for Driver or Enforcer.
 * Automatically signs them in upon successful registration.
 * @param {Object} rawData
 * @returns {Object} Newly registered user account
 */
export function register(rawData) {
  const validation = validateRegisterData(rawData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  const role = rawData.role.toLowerCase();
  const timestamp = Date.now().toString().slice(-4);
  const id = `USR-${role.toUpperCase()}-${timestamp}`;

  const newUser = {
    id,
    username: rawData.username.trim().toLowerCase(),
    password: rawData.password.trim(),
    role,
    fullName: rawData.fullName.trim(),
    createdAt: new Date().toISOString().slice(0, 10)
  };

  if (role === 'driver') {
    newUser.licenseNo = rawData.licenseNo.trim().toUpperCase();
    newUser.plateNo = rawData.plateNo.trim().toUpperCase();
  } else if (role === 'enforcer') {
    newUser.badgeNo = rawData.badgeNo.trim().toUpperCase();
    newUser.sector = rawData.sector.trim();
  }

  state.users.push(newUser);
  state.currentUser = newUser;
  state.role = newUser.role;
  persistSession = true;

  if (newUser.role === 'driver' && newUser.licenseNo) {
    state.driverSearch.licenseNo = newUser.licenseNo;
    state.driverSearch.searched = true;
  }

  saveState();
  return newUser;
}

/**
 * Terminates active user session and resets application panel access.
 */
export function logout() {
  persistSession = true;
  state.currentUser = null;
  state.role = null;
  state.editingViolationId = null;
  state.selectedViolationId = null;
  state.driverSearch = { licenseNo: '', searched: false };
  state.paymentDraft = {
    amountTendered: 0,
    changeDue: 0,
    remainingBalance: 0,
    isSufficient: false
  };
  state.paymentMethod = 'credit-card';
  saveState();
}

/**
 * Sets auth modal presentation state.
 * @param {boolean} isOpen
 * @param {'login'|'register'} tab
 * @param {'driver'|'enforcer'|'admin'} role
 */
export function setAuthModal(isOpen, tab = 'login', role = 'driver') {
  state.authModal.isOpen = Boolean(isOpen);
  if (tab) state.authModal.tab = tab;
  if (role) state.authModal.selectedRole = role;
}

/**
 * Switch active role in state and persist.
 * Strictly enforces that a user can only activate the panel for their assigned role.
 * Unauthenticated users cannot activate any role.
 * @param {'admin'|'enforcer'|'driver'} role
 * @returns {boolean} Success status of role activation
 */
export function setRole(role) {
  if (!state.currentUser) {
    state.role = null;
    saveState();
    return false;
  }

  // Strict RBAC: drivers only driver, admin only admin, officer only officer
  if (state.currentUser.role !== role) {
    return false;
  }

  state.role = role;
  saveState();
  return true;
}

/**
 * Checks if a session is currently active.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return Boolean(state.currentUser);
}

/**
 * Checks if the currently active user is authorized for a specific role.
 * @param {'admin'|'enforcer'|'driver'} role
 * @returns {boolean}
 */
export function isAuthorizedFor(role) {
  return Boolean(state.currentUser && state.currentUser.role === role);
}

/**
 * Adds a new Traffic Violation record to state and localStorage.
 * Member 1 (Enforcer logic)
 * @param {Object} rawData - Form input data
 * @returns {Object} Newly created violation record
 */
export function addViolation(rawData) {
  // Find matching violation config to get base fine and surcharge rate
  const typeObj = VIOLATION_TYPES.find(t => t.name === rawData.type) || VIOLATION_TYPES[0];
  const { baseFine, surcharge } = calculateFineAndPenalty(typeObj.baseFine, typeObj.surchargeRate);

  // Generate unique LTO Violation Record ID
  const timestamp = Date.now().toString().slice(-4);
  const randomNum = Math.floor(100 + Math.random() * 900);
  const id = `LTO-VIO-2026-${timestamp}${randomNum}`;

  const newViolation = {
    id,
    licenseNo: rawData.licenseNo.trim().toUpperCase(),
    plateNo: rawData.plateNo.trim().toUpperCase(),
    driverName: rawData.driverName.trim(),
    type: typeObj.name,
    location: rawData.location.trim(),
    date: rawData.date,
    fine: baseFine,
    surcharge: surcharge,
    status: 'unpaid'
  };

  // Add to top of list
  state.violations.unshift(newViolation);
  addActivity(`Ticket #${newViolation.id} issued by Officer`, 'issue');
  saveState();
  return newViolation;
}

/**
 * Updates an existing LTO Violation Record.
 * Member 2 (Admin logic)
 * @param {string} id - Record ID
 * @param {Object} updateData - Updated values
 * @returns {Object|null} Updated violation record
 */
export function updateViolation(id, updateData) {
  const index = state.violations.findIndex(v => v.id === id);
  if (index === -1) return null;

  const typeObj = VIOLATION_TYPES.find(t => t.name === updateData.type) || {
    name: updateData.type,
    baseFine: state.violations[index].fine,
    surchargeRate: 0
  };

  const { baseFine, surcharge } = calculateFineAndPenalty(typeObj.baseFine, typeObj.surchargeRate);

  state.violations[index] = {
    ...state.violations[index],
    licenseNo: updateData.licenseNo.trim().toUpperCase(),
    plateNo: updateData.plateNo.trim().toUpperCase(),
    driverName: updateData.driverName.trim(),
    type: typeObj.name,
    location: updateData.location.trim(),
    date: updateData.date,
    fine: baseFine,
    surcharge: surcharge
  };

  state.editingViolationId = null;
  addActivity(`Ticket #${id} edited by ${state.currentUser?.role === 'admin' ? 'Administrator' : 'Officer'}`, 'edit');
  saveState();
  return state.violations[index];
}

/**
 * Deletes a violation record by ID.
 * Member 2 (Admin logic)
 * @param {string} id - Record ID
 * @returns {boolean} Success status
 */
export function deleteViolation(id) {
  const initialLength = state.violations.length;
  const deleted = state.violations.find(v => v.id === id);
  state.violations = state.violations.filter(v => v.id !== id);

  if (state.editingViolationId === id) {
    state.editingViolationId = null;
  }
  if (state.selectedViolationId === id) {
    state.selectedViolationId = null;
  }

  if (deleted && state.violations.length < initialLength) {
    addActivity(`Ticket #${id} deleted by Administrator`, 'delete');
  }
  saveState();
  return state.violations.length < initialLength;
}

/**
 * Sets the ID of a violation to be edited by Admin.
 * Member 2 (Admin logic)
 * @param {string|null} id
 */
export function setEditingViolation(id) {
  state.editingViolationId = id;
}

/**
 * Updates Admin search and status filter settings.
 * Member 2 (Admin logic)
 * @param {{ status?: string, query?: string }} filterOptions
 */
export function setFilter(filterOptions) {
  if (filterOptions.status !== undefined) {
    state.filter.status = filterOptions.status;
  }
  if (filterOptions.query !== undefined) {
    state.filter.query = filterOptions.query.trim().toUpperCase();
  }
}

/**
 * Returns filtered violations according to current Admin filter settings.
 * Member 2 (Admin logic)
 * @returns {Array} Filtered violation records
 */
export function getFilteredViolations() {
  const { status, query } = state.filter;

  return state.violations.filter(v => {
    // Status check
    const matchesStatus = (status === 'all') || (v.status === status);

    // Search query check (license or plate number)
    const matchesQuery = !query ||
      v.licenseNo.toUpperCase().includes(query) ||
      v.plateNo.toUpperCase().includes(query) ||
      v.driverName.toUpperCase().includes(query);

    return matchesStatus && matchesQuery;
  });
}

export function setDriverFilter(filterOptions) {
  if (filterOptions.status !== undefined) state.driverFilters.status = filterOptions.status;
  if (filterOptions.date !== undefined) state.driverFilters.date = filterOptions.date;
}

export function getFilteredDriverViolations() {
  const violations = getDriverViolations();
  return violations.filter(v => {
    const statusMatch = state.driverFilters.status === 'all' ||
      (state.driverFilters.status === 'pending_review'
        ? v.status === 'pending_review'
        : v.status === state.driverFilters.status);
    const dateMatch = !state.driverFilters.date || v.date === state.driverFilters.date;
    return statusMatch && dateMatch;
  });
}

export function setDisputeViolation(id) {
  state.disputeViolationId = id;
}

export function submitDispute(violationId, reason, notes = '') {
  const violation = state.violations.find(v => v.id === violationId);
  if (!violation) throw new Error('Citation record was not found.');
  if (violation.status !== 'unpaid') throw new Error('Only unpaid citations can be contested.');

  violation.status = 'pending_review';
  state.disputes.unshift({
    id: `DSP-${Date.now()}`,
    violationId,
    licenseNo: violation.licenseNo,
    reason: String(reason).trim(),
    notes: String(notes).trim(),
    submittedAt: new Date().toISOString(),
    status: 'pending_review'
  });
  addActivity(`Ticket #${violationId} contested by ${violation.driverName}`, 'dispute');
  saveState();
  return state.disputes[0];
}

export function getDemeritPoints(licenseNo) {
  const cleanLicense = String(licenseNo || '').trim().toUpperCase();
  if (!cleanLicense) return { points: 0, recentCount: 0 };

  const violations = state.violations.filter(v =>
    v.licenseNo.toUpperCase() === cleanLicense && v.status !== 'paid'
  );
  const points = violations.reduce((total, violation) => {
    const preset = state.offensePresets.find(p => p.name === violation.type);
    return total + (preset?.demeritPoints || 1);
  }, 0);
  return { points, recentCount: violations.length };
}

export function getShiftSummary() {
  const today = new Date().toISOString().slice(0, 10);
  const todayViolations = state.violations.filter(v => v.date === today);
  const totalFines = todayViolations.reduce((sum, v) => sum + (Number(v.fine) || 0) + (Number(v.surcharge) || 0), 0);
  return {
    ticketsToday: todayViolations.length,
    totalFines,
    recentSubmissions: state.violations.slice(0, 3)
  };
}

export function getExecutiveMetrics() {
  const summary = getSummary(state.violations);
  const counts = {};
  state.violations.forEach(v => {
    counts[v.type] = (counts[v.type] || 0) + 1;
  });
  const topOffense = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
  return {
    revenueSettled: summary.totalPaidFines,
    activeViolations: state.violations.filter(v => v.status !== 'paid').length,
    topOffense
  };
}

export function setSelectedViolationIds(ids) {
  state.selectedViolationIds = Array.isArray(ids) ? [...new Set(ids)] : [];
}

export function bulkSettleViolations(ids) {
  let settledCount = 0;
  ids.forEach(id => {
    const violation = state.violations.find(v => v.id === id);
    if (violation && violation.status !== 'paid') {
      violation.status = 'paid';
      settledCount += 1;
    }
  });
  if (settledCount > 0) {
    addActivity(`${settledCount} selected ticket${settledCount === 1 ? '' : 's'} marked as Paid`, 'settlement');
    state.selectedViolationIds = [];
    saveState();
  }
  return settledCount;
}

/**
 * Driver search by license number.
 * Member 3 (Driver logic)
 * @param {string} licenseNo
 */
export function searchDriver(licenseNo) {
  state.driverSearch.licenseNo = (licenseNo || '').trim().toUpperCase();
  state.driverSearch.searched = true;
  state.selectedViolationId = null;
  state.lastReceipt = null;
}

/**
 * Get all violations for the currently searched driver.
 * Member 3 (Driver logic)
 * @returns {Array} List of violations for this driver
 */
export function getDriverViolations() {
  const license = state.driverSearch.licenseNo;
  if (!license) return [];
  return state.violations.filter(v => v.licenseNo.toUpperCase() === license);
}

/**
 * Selects an unpaid violation to open the payment view.
 * Member 3 (Driver payment logic)
 * @param {string|null} violationId
 */
export function selectViolationForPayment(violationId) {
  state.selectedViolationId = violationId;
  state.paymentMethod = 'credit-card';
  state.paymentDraft = {
    amountTendered: 0,
    changeDue: 0,
    remainingBalance: 0,
    isSufficient: false
  };
  state.lastReceipt = null;
}

/**
 * Updates live payment calculation draft as the user types amount tendered.
 * Member 3 (Driver live-recompute logic)
 * @param {number} amountTendered
 */
export function updatePaymentDraft(amountTendered) {
  const selected = state.violations.find(v => v.id === state.selectedViolationId);
  if (!selected) return;

  const totalDue = getViolationBalance(selected);
  state.paymentDraft = calculateChange(totalDue, amountTendered);
}

export function updatePaymentMethod(paymentMethod) {
  const allowedMethods = ['credit-card', 'gcash', 'paymaya', 'qrph'];
  state.paymentMethod = allowedMethods.includes(paymentMethod) ? paymentMethod : 'credit-card';
}

/**
 * Records a completed payment transaction, marks violation as paid,
 * generates an official receipt object, and saves state.
 * Member 3 (Driver payment logic)
 * @param {number} amountTendered - Amount handed over
 * @returns {Object} Payment Transaction receipt
 */
export function recordPayment(amountTendered) {
  const violation = state.violations.find(v => v.id === state.selectedViolationId);
  if (!violation) {
    throw new Error('No violation selected for payment.');
  }

  const totalDue = getViolationBalance(violation);
  const tendered = Number(amountTendered) || 0;

  if (tendered <= 0) {
    throw new Error('Enter an amount greater than ₱0.00.');
  }
  if (tendered > totalDue) {
    // Keep overpayments as change while settling only the citation balance.
    amountTendered = totalDue;
  }

  const appliedAmount = Math.min(tendered, totalDue);
  const change = Math.max(0, Math.round((tendered - totalDue) * 100) / 100);
  const previousPaidAmount = Math.max(0, Number(violation.paidAmount) || 0);
  const newPaidAmount = previousPaidAmount + appliedAmount;
  const remainingBalance = Math.max(0, Math.round((totalDue - appliedAmount) * 100) / 100);
  violation.paidAmount = Math.round(newPaidAmount * 100) / 100;

  if (remainingBalance === 0) {
    violation.status = 'paid';
  } else {
    violation.status = 'unpaid';
  }

  // Format current date and time
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toLocaleTimeString('en-PH', { hour12: false });
  const formattedDateTime = `${now.toISOString().slice(0, 10)} ${timeStr}`;

  // Generate Reference Number
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const refNo = `LTO-PAY-${dateStr}-${randomSuffix}`;
  const paymentId = `PAY-${Date.now()}`;

  const paymentRecord = {
    id: paymentId,
    violationId: violation.id,
    refNo,
    paymentMethod: state.paymentMethod,
    amount: appliedAmount,
    tendered,
    change,
    remainingBalance,
    isPartial: remainingBalance > 0,
    paidAt: formattedDateTime,
    driverName: violation.driverName,
    licenseNo: violation.licenseNo,
    plateNo: violation.plateNo,
    violationType: violation.type,
    baseFine: violation.fine,
    surcharge: violation.surcharge
  };

  // Add to payments ledger
  state.payments.unshift(paymentRecord);

  // Clear payment draft & store last receipt
  state.lastReceipt = paymentRecord;
  state.selectedViolationId = null;

  addActivity(`Ticket #${violation.id} marked as Paid`, 'payment');
  saveState();
  return paymentRecord;
}

/**
 * Closes the receipt view.
 * Member 3 (Driver logic)
 */
export function clearReceipt() {
  state.lastReceipt = null;
}

/**
 * Resets demo data back to default initial seed violations and payments.
 * Shared utility for grading/testing.
 */
export function resetDemoData() {
  state.violations = JSON.parse(JSON.stringify(INITIAL_SEED_VIOLATIONS));
  state.payments = JSON.parse(JSON.stringify(INITIAL_SEED_PAYMENTS));
  state.users = JSON.parse(JSON.stringify(INITIAL_SEED_USERS));
  state.currentUser = null;
  state.editingViolationId = null;
  state.selectedViolationId = null;
  state.lastReceipt = null;
  state.driverSearch = { licenseNo: '', searched: false };
  state.filter = { status: 'all', query: '' };
  state.driverFilters = { status: 'all', date: '' };
  state.disputes = [];
  state.activityLog = [];
  state.selectedViolationIds = [];
  state.paymentMethod = 'credit-card';
  saveState();
}
