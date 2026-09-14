# Enterprise Database Management System - Walkthrough

## High-Level Overview
We have completely overhauled the backend to ensure robust data integrity, replacing an unreliable in-memory database with a native disk-backed SQLite driver (`better-sqlite3`). Following this backend migration, we built a dynamic **Role-Based Simulation Dashboard** to actively demonstrate database interactions (like querying and transactional updates) across different user permission levels. Finally, we polished the UI to ensure a premium, responsive experience.

---

## 1. Database Architecture & ACID Compliance Migration
The core objective of this phase was to guarantee that our database operations strictly adhere to ACID principles:

### A. Durability & Isolation Upgrade (`better-sqlite3`)
- **Action:** Removed the legacy `sql.js` (which buffered data in memory and occasionally dumped it to a file, risking catastrophic data loss on crashes) and implemented `better-sqlite3`.
- **Feature Details:** 
  - Enabled **Write-Ahead Logging (WAL)** (`PRAGMA journal_mode = WAL;`). This guarantees **Durability** by atomically logging changes to disk before applying them to the main database file. 
  - WAL mode also provides superior **Isolation** by allowing concurrent reads during database writes.

### B. Atomicity & Isolation via Transactions
- **Action:** Created a centralized `runTransaction()` helper in the database layer.
- **Feature Details:**
  - All data mutation operations (INSERT, UPDATE, DELETE) across our endpoints are explicitly wrapped in these transaction blocks.
  - If a multi-step database operation fails midway, the entire transaction is rolled back automatically, enforcing strict **Atomicity**.

### C. Consistency Enforcement
- **Action:** Enforced foreign key constraints at the SQLite engine level (`PRAGMA foreign_keys = ON;`).
- **Feature Details:** The database strictly prevents orphaned records and enforces schema-level relationships natively across all 15 relational tables, ensuring structural **Consistency**.

---

## 2. Role-Based Simulation Dashboard
We introduced a brand new "Role Simulation" tab to the application to demonstrate real-world usage of the database through tailored views.

### A. Dynamic User Roles
- The system checks the authenticated user's profile and adapts the UI immediately. 
- You can log in using preset accounts (e.g., "HR Manager", "Employee") directly from the Sign-In modal to test different permissions without manually typing passwords.

### B. Manager View
- **Direct Reports Analytics:** Managers see a live table of all employees working under their `manager_id`, pulling data dynamically from the relational `employees` and `departments` tables.
- **Workflow Approvals:** A dedicated panel lists all pending leave requests from their subordinates. Managers can click "Approve", triggering an **Atomic Transaction** on the backend to update the leave status securely.

### C. Employee View
- **Leave Request Portal:** Employees have access to a form where they can submit time-off requests. Submitting this form executes a backend transaction to securely insert the new request.
- **Personal History:** A table displaying a history of all past requests and their current approval status, complete with color-coded badges (`Pending`, `Approved`).

---

## 3. UI Fixes & Layout Improvements
To ensure the new dashboard matches the premium aesthetics of the platform, we applied several layout and styling optimizations.

- **Fixed Table Styling:** Updated `RoleDashboard.jsx` to map correctly to the global `index.css` design system. Tables now use the `data-table` and `table-container` classes, properly rendering clean borders, cell padding, and subtle row hover animations.
- **Prevented Horizontal Scrolling:** Re-architected the dashboard layout from a constrained two-column grid into a stacked, full-width vertical layout. This ensures that data-heavy tables (like the Leave Requests table with its action buttons) can expand naturally to the full container width, eliminating awkward horizontal scrollbars.
