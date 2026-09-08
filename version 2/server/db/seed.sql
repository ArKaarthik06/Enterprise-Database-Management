-- Enterprise Management System - Seed Data Script
-- Populates all 15 Relational Tables with rich sample data for DBMS Course Demo

-- 1. Roles
INSERT INTO roles (role_id, role_name, description) VALUES
(1, 'Admin', 'System Administrator with full access rights'),
(2, 'HR Manager', 'Manages employee records, payroll, leave requests'),
(3, 'Project Manager', 'Oversees projects, client invoices, and tasks'),
(4, 'Employee', 'Standard employee access for self-service');

-- 2. Users
INSERT INTO users (user_id, username, email, password_hash, role_id, is_active) VALUES
(1, 'admin', 'admin@enterprise.com', 'admin123', 1, 1),
(2, 'sarah_hr', 'sarah.jenkins@enterprise.com', 'hrpass123', 2, 1),
(3, 'michael_pm', 'michael.scott@enterprise.com', 'pmpass123', 3, 1),
(4, 'alex_dev', 'alex.turner@enterprise.com', 'devpass123', 4, 1),
(5, 'emily_dev', 'emily.clarke@enterprise.com', 'devpass123', 4, 1),
(6, 'david_fin', 'david.ross@enterprise.com', 'finpass123', 3, 1),
(7, 'jessica_mkt', 'jessica.alba@enterprise.com', 'mktpass123', 4, 1),
(8, 'robert_tech', 'robert.downey@enterprise.com', 'techpass123', 1, 1);

-- 3. Departments
INSERT INTO departments (department_id, name, description, head_id) VALUES
(1, 'Software Engineering', 'Develops core software products and enterprise solutions', NULL),
(2, 'Human Resources', 'Handles talent acquisition, payroll, and staff welfare', NULL),
(3, 'Project Management', 'Manages client projects, deliverables, and timelines', NULL),
(4, 'Sales & Finance', 'Oversees client invoicing, budgeting, and revenue generation', NULL),
(5, 'IT Infrastructure', 'Maintains corporate hardware, assets, and cloud servers', NULL);

-- 4. Designations
INSERT INTO designations (designation_id, title, department_id, level) VALUES
(1, 'Chief Technology Officer', 1, 5),
(2, 'Lead Full Stack Engineer', 1, 4),
(3, 'Senior Software Engineer', 1, 3),
(4, 'HR Director', 2, 4),
(5, 'HR Operations Specialist', 2, 2),
(6, 'Senior Project Manager', 3, 4),
(7, 'Finance Lead', 4, 4),
(8, 'Senior Systems Administrator', 5, 3);

-- 5. Employees
INSERT INTO employees (employee_id, user_id, first_name, last_name, dob, gender, phone, address, department_id, designation_id, manager_id, joining_date, salary, status) VALUES
(1, 1, 'Robert', 'Downey', '1982-04-12', 'Male', '+1 555-0101', '100 Innovation Way, Tech City', 1, 1, NULL, '2019-01-15', 150000.00, 'Active'),
(2, 2, 'Sarah', 'Jenkins', '1988-09-23', 'Female', '+1 555-0102', '245 Corporate Ave, Business Hub', 2, 4, 1, '2020-03-01', 95000.00, 'Active'),
(3, 3, 'Michael', 'Scott', '1985-03-15', 'Male', '+1 555-0103', '12 Slough Lane, Paper Town', 3, 6, 1, '2019-06-10', 110000.00, 'Active'),
(4, 4, 'Alex', 'Turner', '1992-07-08', 'Male', '+1 555-0104', '88 Coders Blvd, Silicon Bay', 1, 2, 1, '2021-02-15', 125000.00, 'Active'),
(5, 5, 'Emily', 'Clarke', '1994-11-30', 'Female', '+1 555-0105', '45 Frontend Street, Web City', 1, 3, 4, '2022-05-20', 98000.00, 'Active'),
(6, 6, 'David', 'Ross', '1987-01-19', 'Male', '+1 555-0106', '33 Wall St, Finance Plaza', 4, 7, 1, '2020-08-11', 105000.00, 'Active'),
(7, 7, 'Jessica', 'Alba', '1991-05-04', 'Female', '+1 555-0107', '512 People Court, Staff Town', 2, 5, 2, '2022-09-01', 65000.00, 'Active'),
(8, 8, 'Kevin', 'Mitnick', '1989-12-05', 'Male', '+1 555-0108', '77 Cyber Road, Server City', 5, 8, 1, '2021-11-15', 92000.00, 'Active');

-- Update department heads now that employees exist
UPDATE departments SET head_id = 1 WHERE department_id = 1;
UPDATE departments SET head_id = 2 WHERE department_id = 2;
UPDATE departments SET head_id = 3 WHERE department_id = 3;
UPDATE departments SET head_id = 6 WHERE department_id = 4;
UPDATE departments SET head_id = 8 WHERE department_id = 5;

-- 6. Projects
INSERT INTO projects (project_id, name, description, start_date, end_date, status, manager_id) VALUES
(1, 'Enterprise Cloud ERP', 'Migrating core business processes to cloud microservices', '2025-01-10', '2026-06-30', 'In Progress', 3),
(2, 'AI Customer Support Hub', 'Automated ticketing and agent assistant engine', '2025-03-01', '2025-11-30', 'In Progress', 3),
(3, 'Payroll & HR Suite v2', 'Redesign of automated monthly payroll & attendance tracking', '2024-09-15', '2025-02-28', 'Completed', 3),
(4, 'Cybersecurity Audit & Zero Trust', 'Implementing RBAC, encryption and asset tracking', '2025-05-01', '2026-01-15', 'In Progress', 1);

-- 7. Tasks
INSERT INTO tasks (task_id, project_id, title, description, assigned_to, priority, status, due_date) VALUES
(1, 1, 'Database Schema Migration to PostgreSQL', 'Draft schema DDL and execute dry runs', 4, 'High', 'In Progress', '2025-09-15'),
(2, 1, 'API Gateway Authentication Middleware', 'Implement JWT verification and rate limiting', 5, 'High', 'Completed', '2025-08-30'),
(3, 2, 'LLM Prompt Pipeline Integration', 'Connect customer support bot to vector database', 4, 'Medium', 'In Progress', '2025-10-01'),
(4, 2, 'React Dashboard UI Components', 'Build real-time websocket metrics feed', 5, 'Low', 'Pending', '2025-10-15'),
(5, 3, 'Tax Calculation Engine', 'Implement localized deduction rules for 2025', 6, 'Critical', 'Completed', '2025-01-20'),
(6, 4, 'Hardware Asset Tagging & Encryption', 'Enforce BitLocker on all developer workstations', 8, 'High', 'In Progress', '2025-09-30');

-- 8. Clients
INSERT INTO clients (client_id, name, company, email, phone, address) VALUES
(1, 'Apex Financial Corp', 'Apex Global Ltd', 'contact@apexfin.com', '+1 800-555-0199', '1 Enterprise Tower, NY'),
(2, 'Nexus Health Tech', 'Nexus Health Inc', 'billing@nexushealth.org', '+1 800-555-0288', '500 Biotech Blvd, Boston'),
(3, 'Vanguard Retail Systems', 'Vanguard Group', 'accounts@vanguardretail.com', '+1 800-555-0377', '12 Commerce Ave, Chicago'),
(4, 'Global Logistics Solutions', 'Global Freight Logistics', 'info@gls-freight.com', '+1 800-555-0466', '88 Freight Way, Seattle');

-- 9. Invoices
INSERT INTO invoices (invoice_id, client_id, project_id, amount, issue_date, due_date, status) VALUES
(1, 1, 1, 45000.00, '2025-06-01', '2025-07-01', 'Paid'),
(2, 1, 1, 45000.00, '2025-07-01', '2025-08-01', 'Paid'),
(3, 2, 2, 32000.00, '2025-06-15', '2025-07-15', 'Paid'),
(4, 2, 2, 28000.00, '2025-07-15', '2025-08-15', 'Pending'),
(5, 3, 3, 60000.00, '2025-02-01', '2025-03-01', 'Paid'),
(6, 4, 4, 55000.00, '2025-08-01', '2025-09-01', 'Overdue');

-- 10. Assets
INSERT INTO assets (asset_id, name, category, purchase_date, assigned_to, status) VALUES
(1, 'MacBook Pro M3 Max 16"', 'Laptop', '2024-02-10', 4, 'In Use'),
(2, 'Dell XPS 15 Developer Edition', 'Laptop', '2024-03-15', 5, 'In Use'),
(3, 'Apple Studio Display 27"', 'Monitor', '2024-02-12', 4, 'In Use'),
(4, 'Lenovo ThinkPad P1 Gen 6', 'Laptop', '2024-01-20', 3, 'In Use'),
(5, 'Cisco Meraki Switch 48-Port', 'Networking', '2023-11-05', 8, 'In Use'),
(6, 'Dell PowerEdge R750 Server', 'Server', '2023-09-18', 8, 'Maintenance'),
(7, 'Ergonomic Standing Desk Pro', 'Furniture', '2024-04-01', 2, 'In Use');

-- 11. Notifications
INSERT INTO notifications (notification_id, user_id, title, message, is_read, created_at) VALUES
(1, 1, 'Monthly Revenue Report Ready', 'June 2025 financial invoices have been compiled successfully.', 1, '2025-07-01 09:00:00'),
(2, 4, 'Task Assigned: Schema Migration', 'You have been assigned to Task #1 on Project Cloud ERP.', 0, '2025-08-01 10:15:00'),
(3, 2, 'Leave Request Submitted', 'Employee Emily Clarke requested 3 days of sick leave.', 0, '2025-08-10 14:20:00'),
(4, 3, 'Invoice Overdue Warning', 'Invoice #6 for Global Logistics Solutions is overdue.', 0, '2025-08-15 08:30:00');

-- 12. Attendance
INSERT INTO attendance (attendance_id, employee_id, date, check_in, check_out, status) VALUES
(1, 1, '2025-08-25', '08:45:00', '17:30:00', 'Present'),
(2, 2, '2025-08-25', '09:00:00', '17:15:00', 'Present'),
(3, 3, '2025-08-25', '08:50:00', '18:00:00', 'Present'),
(4, 4, '2025-08-25', '09:15:00', '18:10:00', 'Present'),
(5, 5, '2025-08-25', '09:05:00', '17:45:00', 'Present'),
(6, 6, '2025-08-25', '08:30:00', '17:00:00', 'Present'),
(7, 7, '2025-08-25', '09:00:00', '17:00:00', 'Present'),
(8, 8, '2025-08-25', '08:40:00', '17:50:00', 'Present'),
(9, 4, '2025-08-26', '09:10:00', '18:05:00', 'Present'),
(10, 5, '2025-08-26', '00:00:00', '00:00:00', 'On Leave');

-- 13. Leave Requests
INSERT INTO leave_requests (leave_id, employee_id, leave_type, start_date, end_date, reason, status, approved_by) VALUES
(1, 5, 'Sick Leave', '2025-08-26', '2025-08-28', 'Fever and rest recommended by doctor', 'Approved', 2),
(2, 4, 'Casual Leave', '2025-09-05', '2025-09-08', 'Family function vacation', 'Approved', 1),
(3, 7, 'Maternity Leave', '2025-10-01', '2025-12-31', 'Maternity leave plan', 'Pending', 2);

-- 14. Payroll
INSERT INTO payroll (payroll_id, employee_id, month, year, basic_salary, bonus, deductions, net_salary, payment_date, status) VALUES
(1, 1, 7, 2025, 12500.00, 2000.00, 1500.00, 13000.00, '2025-07-31', 'Paid'),
(2, 2, 7, 2025, 7916.67, 800.00, 950.00, 7766.67, '2025-07-31', 'Paid'),
(3, 3, 7, 2025, 9166.67, 1000.00, 1100.00, 9066.67, '2025-07-31', 'Paid'),
(4, 4, 7, 2025, 10416.67, 1500.00, 1200.00, 10716.67, '2025-07-31', 'Paid'),
(5, 5, 7, 2025, 8166.67, 700.00, 900.00, 7966.67, '2025-07-31', 'Paid'),
(6, 6, 7, 2025, 8750.00, 1200.00, 1000.00, 8950.00, '2025-07-31', 'Paid'),
(7, 7, 7, 2025, 5416.67, 400.00, 600.00, 5216.67, '2025-07-31', 'Paid'),
(8, 8, 7, 2025, 7666.67, 900.00, 850.00, 7716.67, '2025-07-31', 'Paid');

-- 15. Performance Reviews
INSERT INTO performance_reviews (review_id, employee_id, reviewer_id, review_date, rating, comments) VALUES
(1, 4, 1, '2025-06-30', 4.8, 'Exceptional full-stack technical leadership and high productivity.'),
(2, 5, 4, '2025-06-28', 4.5, 'Great UI component quality and fast task delivery.'),
(3, 2, 1, '2025-06-25', 4.9, 'Outstanding management of employee welfare, recruiting, and payroll.'),
(4, 3, 1, '2025-06-20', 4.4, 'Effective project delivery and client communications.'),
(5, 6, 3, '2025-06-22', 4.6, 'Flawless invoice processing and accurate project budget tracking.');
