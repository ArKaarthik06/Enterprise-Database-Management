# Enterprise Management System - ACID Compliance Documentation

This document explains in detail how the database backend of the Enterprise Management System enforces the four core principles of database reliability: **Atomicity, Consistency, Isolation, and Durability (ACID)**.

The system utilizes Node.js with the `better-sqlite3` native driver, interacting directly with an on-disk SQLite database (`enterprise.db`).

---

## 1. Atomicity ("All or Nothing")

**What it means:** Atomicity guarantees that a transaction is treated as a single, indivisible logical unit of work. If a transaction consists of multiple SQL statements and one fails, the entire transaction is rolled back, and the database state is left unchanged.

**Where and how it is followed:**
- **File:** `server/db/database.js`
  - We have implemented a dedicated helper function called `runTransaction(db, callback)` which utilizes `better-sqlite3`'s native `.transaction()` wrapper.
- **File:** `server/routes/tables.js` and `server/routes/query.js`
  - Every data mutation (INSERT, UPDATE, DELETE) is explicitly wrapped inside `runTransaction()`. 
  - **Example (tables.js - Update endpoint):**
    ```javascript
    // ACID Principle: Atomicity & Isolation
    const result = runTransaction(db, () => {
        return runQuery(db, sql, values);
    });
    ```
  - Because it is wrapped in a transaction block, if a complex query or batch update fails mid-execution, SQLite automatically triggers a `ROLLBACK`, leaving no partial or corrupt records behind.

---

## 2. Consistency ("Valid State to Valid State")

**What it means:** Consistency ensures that a transaction can only bring the database from one valid state to another valid state, maintaining database invariants: any data written to the database must be valid according to all defined rules, including constraints, cascades, and triggers.

**Where and how it is followed:**
- **File:** `server/db/database.js`
  - During database initialization, we explicitly enforce foreign keys by executing `dbInstance.pragma('foreign_keys = ON');`. SQLite normally disables foreign key constraints by default for legacy reasons, so this step is crucial.
- **File:** `server/db/schema.sql`
  - The database schema relies heavily on strict constraints to guarantee consistency.
  - **Data Type and Nullability:** Almost all critical fields have `NOT NULL` constraints (e.g., `employee_id INTEGER NOT NULL`).
  - **Uniqueness:** Fields like `username` and `email` have `UNIQUE` constraints preventing duplicate accounts.
  - **Referential Integrity:** `FOREIGN KEY` constraints are used throughout to enforce relationships. Furthermore, `ON DELETE CASCADE` and `ON DELETE SET NULL` constraints are heavily utilized. 
  - *Example:* If an employee is deleted, their payroll records (`ON DELETE CASCADE`) are automatically removed, ensuring no "orphaned" payroll records are left behind, maintaining a consistent state.

---

## 3. Isolation ("Concurrent Transactions Don't Interfere")

**What it means:** Isolation dictates that concurrent execution of transactions leaves the database in the same state that would have been obtained if the transactions were executed sequentially.

**Where and how it is followed:**
- **File:** `server/db/database.js` (Transactions & WAL Mode)
  - By wrapping mutations in `runTransaction()`, SQLite acquires an immediate write lock. Any other concurrent transaction attempting to write to the database is queued or rejected until the current transaction completes. This strictly isolates the mutation from dirty reads or race conditions.
  - Furthermore, `dbInstance.pragma('journal_mode = WAL');` (Write-Ahead Logging) improves isolation by implementing a form of Multi-Version Concurrency Control (MVCC). In WAL mode, a writer does not block readers. This means one transaction can be reading a table while another transaction is writing to it simultaneously, without interfering with each other's state.
- **Node.js Event Loop (Architecture):**
  - Because Node.js is single-threaded and `better-sqlite3` is synchronous, JavaScript strictly evaluates one request route at a time. This naturally enforces a high level of serializability on the application layer.

---

## 4. Durability ("Saved is Saved")

**What it means:** Durability guarantees that once a transaction has been committed, it will remain committed even in the case of a system failure (e.g., power outage or server crash).

**Where and how it is followed:**
- **File:** `server/db/database.js` (The `better-sqlite3` driver)
  - We use `better-sqlite3`, a native C++ driver that talks directly to the file system synchronously via OS-level fsync operations. This replaces the old architecture where the database lived only in RAM and was manually dumped to a file. 
- **File:** `server/db/database.js` (Write-Ahead Logging)
  - By setting `dbInstance.pragma('journal_mode = WAL');`, SQLite stops modifying the main database file (`enterprise.db`) directly during transactions. 
  - Instead, changes are atomically appended to a separate log file (`enterprise.db-wal`). Appending to a log is inherently crash-safe. Even if the server loses power exactly in the middle of a disk write, the main database file is left completely untouched and uncorrupted, and the interrupted WAL entry is simply ignored upon reboot. This guarantees **True Durability**.
