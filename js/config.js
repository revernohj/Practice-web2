// Owner: Shared (Members 1, 2, 3)
/**
 * config.js
 * Application constants and configuration settings for LTO System.
 * Contains only constants: storage keys, placeholder violation types,
 * format validation rules, and initial demo seed data.
 */

// LocalStorage Keys for persistent state across browser reloads
export const STORAGE_KEY_VIOLATIONS = 'lto_prototype_violations_v1';
export const STORAGE_KEY_PAYMENTS = 'lto_prototype_payments_v1';
export const STORAGE_KEY_ROLE = 'lto_prototype_role_v1';
export const STORAGE_KEY_USERS = 'lto_prototype_users_v2';
export const STORAGE_KEY_CURRENT_USER = 'lto_prototype_current_user_v2';
export const STORAGE_KEY_ACTIVITY = 'lto_prototype_activity_v1';
export const STORAGE_KEY_DISPUTES = 'lto_prototype_disputes_v1';

// Administrative Verification Passcode required to register as LTO Administrator
export const ADMIN_PASSCODE = 'LTO-ADMIN-2026';

/**
 * Pre-seeded User Accounts for Demonstration & Grading
 * Available for 1-click immediate evaluation without manual typing.
 */
export const INITIAL_SEED_USERS = [
  {
    id: 'USR-ADMIN-001',
    username: 'admin',
    password: 'password123',
    role: 'admin',
    fullName: 'Director Arturo Santos',
    title: 'LTO Central Office Director',
    email: 'director.santos@lto.gov.ph',
    createdAt: '2026-01-15'
  },
  {
    id: 'USR-ENF-001',
    username: 'enforcer',
    password: 'password123',
    role: 'enforcer',
    fullName: 'Officer Rommel Cruz',
    badgeNo: 'LTO-ENF-8492',
    sector: 'Central NCR Patrol Sector 01',
    createdAt: '2026-02-01'
  },
  {
    id: 'USR-DRV-001',
    username: 'driver',
    password: 'password123',
    role: 'driver',
    fullName: 'Juan Dela Cruz',
    licenseNo: 'N01-23-456789',
    plateNo: 'ABC 1234',
    createdAt: '2026-02-10'
  },
  {
    id: 'USR-DRV-002',
    username: 'maria',
    password: 'password123',
    role: 'driver',
    fullName: 'Maria Santos',
    licenseNo: 'C02-18-987654',
    plateNo: 'NDK 8392',
    createdAt: '2026-02-15'
  }
];

// Format validation patterns according to Philippine LTO standards
// Example License: N01-23-456789 (Letter + 2 digits - 2 digits - 6 digits)
export const LICENSE_REGEX = /^[A-Z]\d{2}-\d{2}-\d{6}$/;

// Philippine Vehicle Plates: 3 letters + 3 or 4 digits (e.g. ABC 1234 or ABC-1234), or 2 letters + 4-5 digits (motorcycles)
export const PLATE_REGEX = /^[A-Z]{3}[-\s]?\d{3,4}$|^[A-Z]{2}[-\s]?\d{4,5}$|^\d{4}[-\s]?[A-Z]{2}$/i;

/**
 * Placeholder Violation Types (Sample academic data only)
 * Clearly marked as prototype estimates based on general LTO RA 4136 / JAO schedules.
 */
export const VIOLATION_TYPES = [
  {
    code: 'DTS-01',
    name: 'Disregarding Traffic Signs (DTS)',
    baseFine: 1000,
    surchargeRate: 0.10, // 10% administrative surcharge
    description: 'Failure to obey official road markings or traffic light signals.'
  },
  {
    code: 'DVL-02',
    name: 'Driving Without Valid Driver’s License',
    baseFine: 3000,
    surchargeRate: 0.15, // 15% surcharge
    description: 'Operating a motor vehicle without a valid, non-expired LTO license.'
  },
  {
    code: 'RD-03',
    name: 'Reckless Driving (1st Offense)',
    baseFine: 2000,
    surchargeRate: 0.20, // 20% surcharge
    description: 'Operating a motor vehicle without reasonable caution or endangering property.'
  },
  {
    code: 'SBL-04',
    name: 'Failure to Wear Prescribed Seatbelt / Helmet',
    baseFine: 1000,
    surchargeRate: 0.05, // 5% surcharge
    description: 'Non-compliance with Republic Act No. 8750 or Helmet Act.'
  },
  {
    code: 'OBS-05',
    name: 'Obstruction of Traffic Flow',
    baseFine: 1000,
    surchargeRate: 0.10, // 10% surcharge
    description: 'Illegal parking or blocking major thoroughfares/intersections.'
  },
  {
    code: 'ORV-06',
    name: 'Operating an Unregistered Motor Vehicle',
    baseFine: 5000,
    surchargeRate: 0.20, // 20% surcharge
    description: 'Vehicle operated on public roads without active annual registration.'
  }
];

/**
 * Initial Seed Violations (Demo Data)
 * Pre-loaded on first visit to demonstrate Admin, Enforcer, and Driver workflows.
 */
export const INITIAL_SEED_VIOLATIONS = [
  {
    id: 'LTO-VIO-2026-001',
    licenseNo: 'N01-23-456789',
    plateNo: 'ABC 1234',
    driverName: 'Juan Dela Cruz',
    type: 'Disregarding Traffic Signs (DTS)',
    location: 'EDSA corner Ortigas Ave, Quezon City',
    date: '2026-11-02',
    fine: 1000,
    surcharge: 100,
    status: 'unpaid'
  },
  {
    id: 'LTO-VIO-2026-002',
    licenseNo: 'N01-23-456789',
    plateNo: 'ABC 1234',
    driverName: 'Juan Dela Cruz',
    type: 'Failure to Wear Prescribed Seatbelt / Helmet',
    location: 'Commonwealth Ave, Quezon City',
    date: '2026-11-05',
    fine: 1000,
    surcharge: 50,
    status: 'unpaid'
  },
  {
    id: 'LTO-VIO-2026-003',
    licenseNo: 'C02-18-987654',
    plateNo: 'NDK 8392',
    driverName: 'Maria Santos',
    type: 'Reckless Driving (1st Offense)',
    location: 'Roxas Blvd corner Buendia, Pasay City',
    date: '2026-10-28',
    fine: 2000,
    surcharge: 400,
    status: 'paid'
  },
  {
    id: 'LTO-VIO-2026-004',
    licenseNo: 'C02-18-987654',
    plateNo: 'NDK 8392',
    driverName: 'Maria Santos',
    type: 'Driving Without Valid Driver’s License',
    location: 'Taft Ave, Manila',
    date: '2026-11-04',
    fine: 3000,
    surcharge: 450,
    status: 'unpaid'
  },
  {
    id: 'LTO-VIO-2026-005',
    licenseNo: 'D03-21-345678',
    plateNo: 'CAE 4589',
    driverName: 'Ricardo Dalisay',
    type: 'Obstruction of Traffic Flow',
    location: 'C5 Road near Bagong Ilog, Pasig City',
    date: '2026-11-01',
    fine: 1000,
    surcharge: 100,
    status: 'paid'
  }
];

export const INITIAL_SEED_PAYMENTS = [
  {
    id: 'PAY-2026-001',
    violationId: 'LTO-VIO-2026-003',
    refNo: 'LTO-PAY-20261028-1038',
    amount: 2400,
    tendered: 2500,
    change: 100,
    paidAt: '2026-10-28 14:35:00',
    driverName: 'Maria Santos',
    licenseNo: 'C02-18-987654',
    plateNo: 'NDK 8392',
    violationType: 'Reckless Driving (1st Offense)'
  },
  {
    id: 'PAY-2026-002',
    violationId: 'LTO-VIO-2026-005',
    refNo: 'LTO-PAY-20261101-4491',
    amount: 1100,
    tendered: 1100,
    change: 0,
    paidAt: '2026-11-01 11:20:00',
    driverName: 'Ricardo Dalisay',
    licenseNo: 'D03-21-345678',
    plateNo: 'CAE 4589',
    violationType: 'Obstruction of Traffic Flow'
  }
];
