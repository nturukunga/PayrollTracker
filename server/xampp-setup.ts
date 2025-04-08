import { Express, Request, Response } from "express";
import { createConnection, Connection } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { log } from "./vite";

const getSqlFilePath = () => {
  return path.resolve(import.meta.dirname, "..", "setup", "payroll_setup.sql");
};

export const testDatabaseConnection = async (req: Request, res: Response) => {
  const { host, port, database, username, password } = req.body;
  
  if (!host || !port || !database || !username) {
    return res.status(400).json({
      success: false,
      message: "Missing required connection parameters",
    });
  }
  
  let connection: Connection | null = null;
  
  try {
    connection = await createConnection({
      host,
      port: parseInt(port),
      user: username,
      password: password || undefined,
    });
    
    log(`Successfully connected to MySQL server at ${host}:${port}`);
    
    // Check if database exists
    const [rows] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [database]
    );
    
    const databaseExists = Array.isArray(rows) && rows.length > 0;
    
    if (databaseExists) {
      log(`Database '${database}' exists`);
    } else {
      log(`Database '${database}' does not exist, but can be created`);
    }
    
    return res.json({
      success: true,
      databaseExists,
      message: databaseExists 
        ? `Successfully connected to database '${database}'` 
        : `Connected to MySQL server. Database '${database}' doesn't exist but can be created.`,
    });
  } catch (error) {
    log(`Database connection test failed: ${error}`, "error");
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown database connection error",
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Generate SQL script for database setup
export const generateSqlScript = (req: Request, res: Response) => {
  const sql = `
-- Database creation
CREATE DATABASE IF NOT EXISTS payrollsystem;
USE payrollsystem;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  date_hired DATE NOT NULL,
  date_terminated DATE NULL,
  basic_salary DECIMAL(12,2) NOT NULL,
  hourly_rate DECIMAL(10,2) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  tax_id VARCHAR(50),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  date DATE NOT NULL,
  time_in DATETIME NOT NULL,
  time_out DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  notes TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE KEY (employee_id, date)
);

-- Payroll Periods table
CREATE TABLE IF NOT EXISTS payroll_periods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  processed_date DATETIME NULL,
  UNIQUE KEY (start_date, end_date)
);

-- Payroll Items table
CREATE TABLE IF NOT EXISTS payroll_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payroll_period_id INT NOT NULL,
  employee_id INT NOT NULL,
  basic_salary DECIMAL(12,2) NOT NULL,
  hours_worked DECIMAL(8,2) NULL,
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  overtime_amount DECIMAL(12,2) DEFAULT 0,
  gross_pay DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE KEY (payroll_period_id, employee_id)
);

-- Deduction Types table
CREATE TABLE IF NOT EXISTS deduction_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_percentage BOOLEAN NOT NULL DEFAULT FALSE,
  default_value DECIMAL(10,2) NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE
);

-- Deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payroll_item_id INT NOT NULL,
  deduction_type_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id),
  FOREIGN KEY (deduction_type_id) REFERENCES deduction_types(id),
  INDEX (payroll_item_id, deduction_type_id)
);

-- Allowance Types table
CREATE TABLE IF NOT EXISTS allowance_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_taxable BOOLEAN NOT NULL DEFAULT TRUE
);

-- Allowances table
CREATE TABLE IF NOT EXISTS allowances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payroll_item_id INT NOT NULL,
  allowance_type_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  notes TEXT,
  FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(id),
  FOREIGN KEY (allowance_type_id) REFERENCES allowance_types(id),
  INDEX (payroll_item_id, allowance_type_id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  request_date DATETIME NOT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  hours DECIMAL(8,2) NULL,
  amount DECIMAL(12,2) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  approved_by INT NULL,
  approved_date DATETIME NULL,
  rejected_reason TEXT NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id INT NULL,
  details TEXT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Default data: admin user
INSERT INTO users (username, password, email, full_name, role, is_active)
VALUES ('admin', 'admin123', 'admin@example.com', 'System Administrator', 'admin', TRUE)
ON DUPLICATE KEY UPDATE id = id;

-- Default settings
INSERT INTO settings (key, value, description)
VALUES 
  ('company_name', 'PayrollPro Inc.', 'Company name for reports and payslips'),
  ('company_address', '123 Business St, Tech City, 12345', 'Company address for reports and payslips'),
  ('company_phone', '+1 (555) 123-4567', 'Company phone for reports and payslips'),
  ('company_email', 'payroll@payrollpro.com', 'Company email for reports and payslips'),
  ('tax_rate', '0.15', 'Default tax rate (15%)'),
  ('overtime_multiplier', '1.5', 'Multiplier for overtime calculations'),
  ('standard_work_hours', '160', 'Standard monthly work hours'),
  ('prorate_salary', 'true', 'Whether to prorate salary for partial periods')
ON DUPLICATE KEY UPDATE id = id;

-- Default deduction types
INSERT INTO deduction_types (name, description, is_percentage, default_value, is_required)
VALUES 
  ('Income Tax', 'Mandatory income tax', TRUE, 15, TRUE),
  ('Health Insurance', 'Health insurance contribution', TRUE, 3, TRUE),
  ('Pension Fund', 'Retirement pension fund', TRUE, 5, TRUE)
ON DUPLICATE KEY UPDATE id = id;

-- Default allowance types
INSERT INTO allowance_types (name, description, is_taxable)
VALUES 
  ('Transportation', 'Transportation allowance', FALSE),
  ('Meal', 'Meal allowance', FALSE),
  ('Performance Bonus', 'Performance-based bonus', TRUE)
ON DUPLICATE KEY UPDATE id = id;

-- Sample departments
INSERT INTO departments (name, description)
VALUES 
  ('Engineering', 'Software development and IT operations'),
  ('Marketing', 'Marketing and promotion activities'),
  ('Finance', 'Financial operations and accounting'),
  ('Human Resources', 'HR management and recruitment'),
  ('Operations', 'Business operations management')
ON DUPLICATE KEY UPDATE id = id;
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="payroll_setup.sql"');
  res.send(sql);
};

// Register XAMPP setup routes
export function registerXamppSetupRoutes(app: Express) {
  app.post('/api/setup/test-connection', testDatabaseConnection);
  app.get('/api/setup/sql-export', generateSqlScript);
}
