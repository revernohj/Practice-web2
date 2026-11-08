# LTO Driver Violation Tracking and Fine Payment System

Official Land Transportation Office (LTO) portal academic prototype with dedicated, role-specific dashboards and a separate authentication gateway.

## System Pages & Dashboards

- **`index.html` (Portal Home)**: The public landing page showcasing the highway patrol fleet, real-time fine summary statistics, and portal terminal navigation.
- **Login (`index.html#login`)**: Authentication gateway with Quick Demo accounts, sign in, and registration.
- **Administrator (`index.html#admin`)**: Violation ledger, filters, citation editing, fine clearance, and audit trails.
- **Traffic Officer (`index.html#enforcer`)**: Citation issuance, dynamic fine computation, and patrol logging.
- **Driver (`index.html#driver`)**: Citation inquiry, balance lookup, fine payment, and electronic receipts.

## How to Run

Open `index.html` directly in any web browser, or serve this folder using a local static HTTP server (e.g. `npx serve .` or `python -m http.server`).

After login, the system automatically switches to the dashboard assigned to the user's role:
- **Administrator** → `index.html#admin`
- **Traffic Officer** → `index.html#enforcer`
- **Registered Driver** → `index.html#driver`

## Example Accounts

All sample accounts use the password `password123`.

| Role | Name | Username | Password | Dedicated Dashboard |
| --- | --- | --- | --- | --- |
| **Administrator** | Director Arturo Santos | `admin` | `password123` | `index.html#admin` |
| **Traffic Enforcer** | Officer Rommel Cruz | `enforcer` | `password123` | `index.html#enforcer` |
| **Registered Driver** | Juan Dela Cruz | `driver` | `password123` | `index.html#driver` |
| **Registered Driver** | Maria Santos | `maria` | `password123` | `index.html#driver` |

New administrator registrations also require the verification passcode: `LTO-ADMIN-2026`.

Strict Role-Based Access Control (RBAC) ensures each user can only access their authorized dashboard. Unauthorized cross-panel attempts are redirected to the login view with an access alert.
