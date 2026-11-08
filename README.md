# LTO Driver Violation Tracking and Fine Payment System

Official Land Transportation Office (LTO) portal academic prototype with dedicated, role-specific dashboards and a separate authentication gateway.

## System Pages & Dashboards

- **`index.html` (Portal Home)**: The public landing page showcasing the highway patrol fleet, real-time fine summary statistics, and portal terminal navigation.
- **`login.html` (Dedicated Login Page)**: Dedicated authentication gateway featuring 1-click Quick Demo accounts, secure Sign In, and registration with role-based field verification.
- **`admin.html` (Administrator Dashboard)**: Master violation ledger, search, filters (Unpaid, Settled, Overdue), admin citation edit modal, fine clearance, and audit trails.
- **`officer.html` (Traffic Officer Dashboard)**: Roadside traffic citation issuance form, dynamic base fine & penalty computation, violator logging, and patrol sector tracking.
- **`driver.html` (Registered Driver Dashboard)**: Driver citation inquiry by license number, balance breakdown, cash tender settlement calculator, and official printable electronic receipt modal.

## How to Run

Open `index.html` or `login.html` directly in any web browser, or serve this folder using any local static HTTP server (e.g. `npx serve .` or `python -m http.server`).

When logging in from `login.html`, the system automatically routes each account to its specific dashboard depending on the user's role:
- **Administrator** $\rightarrow$ `admin.html`
- **Traffic Officer** $\rightarrow$ `officer.html`
- **Registered Driver** $\rightarrow$ `driver.html`

## Example Accounts

All sample accounts use the password `password123`.

| Role | Name | Username | Password | Dedicated Dashboard |
| --- | --- | --- | --- | --- |
| **Administrator** | Director Arturo Santos | `admin` | `password123` | `admin.html` |
| **Traffic Enforcer** | Officer Rommel Cruz | `enforcer` | `password123` | `officer.html` |
| **Registered Driver** | Juan Dela Cruz | `driver` | `password123` | `driver.html` |
| **Registered Driver** | Maria Santos | `maria` | `password123` | `driver.html` |

New administrator registrations also require the verification passcode: `LTO-ADMIN-2026`.

Strict Role-Based Access Control (RBAC) ensures each user can only access their authorized dashboard. Unauthorized cross-panel attempts are automatically redirected to `login.html` with an access alert.
