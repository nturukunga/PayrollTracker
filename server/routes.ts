import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./auth";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { 
  insertUserSchema, 
  insertEmployeeSchema, 
  insertDepartmentSchema, 
  insertAttendanceSchema, 
  insertPayrollPeriodSchema, 
  insertPayrollItemSchema,
  insertDeductionTypeSchema,
  insertDeductionSchema,
  insertAllowanceTypeSchema,
  insertAllowanceSchema,
  insertSettingSchema,
  insertApprovalSchema,
  insertActivitySchema
} from "@shared/schema";

// Create a custom error class
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return next(new ApiError('Unauthorized: Please login', 401));
  }
  next();
};

// Helper function to log activity
const logActivity = async (action: string, userId?: number, entityType?: string, entityId?: number, details?: string) => {
  try {
    await storage.createActivity({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress: "127.0.0.1" // In a real application, get this from the request
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // User Routes - Note: Authentication Routes are now handled by setupAuth in auth.ts
  
  router.put('/users/current', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        throw new ApiError('User not authenticated', 401);
      }
      
      const userId = req.user.id;
      const { fullName, username, currentPassword, newPassword } = req.body;
      
      if (currentPassword && newPassword) {
        const user = await storage.getUser(userId);
        if (!user) {
          throw new ApiError('User not found', 404);
        }
        
        const isPasswordValid = await comparePasswords(currentPassword, user.password);
        if (!isPasswordValid) {
          throw new ApiError('Current password is incorrect', 400);
        }
        
        const hashedPassword = await hashPassword(newPassword);
        const updatedUser = await storage.updateUser(userId, {
          fullName,
          username,
          password: hashedPassword
        });
        
        if (!updatedUser) {
          throw new ApiError('Failed to update user', 500);
        }
        
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        const updatedUser = await storage.updateUser(userId, {
          fullName,
          username
        });
        
        if (!updatedUser) {
          throw new ApiError('Failed to update user', 500);
        }
        
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      }
      
      await logActivity('update', userId, 'user', userId, 'User profile updated');
    } catch (error) {
      next(error);
    }
  });
  
  router.get('/employees', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      next(error);
    }
  });
  
  router.get('/employees/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new ApiError('Invalid employee ID', 400);
      }
      
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        throw new ApiError('Employee not found', 404);
      }
      
      res.json(employee);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/employees', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const newEmployee = await storage.createEmployee(employeeData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'employee', 
        newEmployee.id, 
        `Created employee: ${newEmployee.firstName} ${newEmployee.lastName}`
      );
      
      res.status(201).json(newEmployee);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.put('/employees/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new ApiError('Invalid employee ID', 400);
      }
      
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const updatedEmployee = await storage.updateEmployee(id, employeeData);
      
      if (!updatedEmployee) {
        throw new ApiError('Employee not found', 404);
      }
      
      await logActivity(
        'update', 
        req.user?.id, 
        'employee', 
        updatedEmployee.id, 
        `Updated employee: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`
      );
      
      res.json(updatedEmployee);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.delete('/employees/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new ApiError('Invalid employee ID', 400);
      }
      
      const employee = await storage.getEmployee(id);
      if (!employee) {
        throw new ApiError('Employee not found', 404);
      }
      
      const success = await storage.deleteEmployee(id);
      
      if (success) {
        await logActivity(
          'delete', 
          req.user?.id, 
          'employee', 
          id, 
          `Terminated employee: ${employee.firstName} ${employee.lastName}`
        );
      }
      
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });

  router.get('/departments', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/departments', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const newDepartment = await storage.createDepartment(departmentData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'department', 
        newDepartment.id, 
        `Created department: ${newDepartment.name}`
      );
      
      res.status(201).json(newDepartment);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });

  router.get('/attendance/employee/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = Number(req.params.id);
      if (isNaN(employeeId)) {
        throw new ApiError('Invalid employee ID', 400);
      }
      
      const attendance = await storage.getAttendanceByEmployee(employeeId);
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/attendance', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const newAttendance = await storage.createAttendance(attendanceData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'attendance', 
        newAttendance.id, 
        `Created attendance record for employee ID: ${newAttendance.employeeId}`
      );
      
      res.status(201).json(newAttendance);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/attendance/range', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      if (!startDate || !endDate) {
        throw new ApiError('Start date and end date are required', 400);
      }
      
      const attendance = await storage.getAttendanceByDateRange(new Date(startDate), new Date(endDate));
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  });

  router.get('/payroll-periods', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const periods = await storage.getAllPayrollPeriods();
      res.json(periods);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/payroll-periods', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const periodData = insertPayrollPeriodSchema.parse(req.body);
      const newPeriod = await storage.createPayrollPeriod(periodData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'payrollPeriod', 
        newPeriod.id, 
        `Created payroll period: ${newPeriod.startDate} to ${newPeriod.endDate}`
      );
      
      res.status(201).json(newPeriod);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/payroll-items/period/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const periodId = Number(req.params.id);
      if (isNaN(periodId)) {
        throw new ApiError('Invalid period ID', 400);
      }
      
      const items = await storage.getPayrollItemsByPeriod(periodId);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/payroll-items', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const itemData = insertPayrollItemSchema.parse(req.body);
      const newItem = await storage.createPayrollItem(itemData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'payrollItem', 
        newItem.id, 
        `Created payroll item for employee ID: ${newItem.employeeId} in period ID: ${newItem.payrollPeriodId}`
      );
      
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/deduction-types', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await storage.getAllDeductionTypes();
      res.json(types);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/deduction-types', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeData = insertDeductionTypeSchema.parse(req.body);
      const newType = await storage.createDeductionType(typeData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'deductionType', 
        newType.id, 
        `Created deduction type: ${newType.name}`
      );
      
      res.status(201).json(newType);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/deductions/payroll-item/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payrollItemId = Number(req.params.id);
      if (isNaN(payrollItemId)) {
        throw new ApiError('Invalid payroll item ID', 400);
      }
      
      const deductions = await storage.getDeductionsByPayrollItem(payrollItemId);
      res.json(deductions);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/deductions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deductionData = insertDeductionSchema.parse(req.body);
      const newDeduction = await storage.createDeduction(deductionData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'deduction', 
        newDeduction.id, 
        `Created deduction for payroll item ID: ${newDeduction.payrollItemId}`
      );
      
      res.status(201).json(newDeduction);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/allowance-types', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await storage.getAllAllowanceTypes();
      res.json(types);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/allowance-types', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const typeData = insertAllowanceTypeSchema.parse(req.body);
      const newType = await storage.createAllowanceType(typeData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'allowanceType', 
        newType.id, 
        `Created allowance type: ${newType.name}`
      );
      
      res.status(201).json(newType);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/allowances/payroll-item/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payrollItemId = Number(req.params.id);
      if (isNaN(payrollItemId)) {
        throw new ApiError('Invalid payroll item ID', 400);
      }
      
      const allowances = await storage.getAllowancesByPayrollItem(payrollItemId);
      res.json(allowances);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/allowances', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allowanceData = insertAllowanceSchema.parse(req.body);
      const newAllowance = await storage.createAllowance(allowanceData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'allowance', 
        newAllowance.id, 
        `Created allowance for payroll item ID: ${newAllowance.payrollItemId}`
      );
      
      res.status(201).json(newAllowance);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/settings', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const allSettings = await storage.getAllSettings();
      
      // Convert to key-value object for easier frontend consumption
      const settings = allSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/settings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First check if the setting already exists
      const { key, value, description } = req.body;
      
      if (!key || !value) {
        throw new ApiError('Key and value are required', 400);
      }
      
      const existingSetting = await storage.getSetting(key);
      
      if (existingSetting) {
        // Update the existing setting
        const updatedSetting = await storage.updateSetting(existingSetting.id, { value, description });
        
        await logActivity(
          'update', 
          req.user?.id, 
          'setting', 
          existingSetting.id, 
          `Updated setting: ${key}`
        );
        
        return res.json(updatedSetting);
      }
      
      const settingData = insertSettingSchema.parse(req.body);
      const newSetting = await storage.createSetting(settingData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'setting', 
        newSetting.id, 
        `Created setting: ${newSetting.key}`
      );
      
      res.status(201).json(newSetting);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.get('/approvals/pending', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const approvals = await storage.getPendingApprovals();
      res.json(approvals);
    } catch (error) {
      next(error);
    }
  });
  
  router.post('/approvals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approvalData = insertApprovalSchema.parse(req.body);
      const newApproval = await storage.createApproval(approvalData);
      
      await logActivity(
        'create', 
        req.user?.id, 
        'approval', 
        newApproval.id, 
        `Created ${newApproval.type} approval request for employee ID: ${newApproval.employeeId}`
      );
      
      res.status(201).json(newApproval);
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ApiError(`Validation error: ${fromZodError(error).message}`, 400));
      }
      next(error);
    }
  });
  
  router.put('/approvals/:id/approve', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new ApiError('Invalid approval ID', 400);
      }
      
      const approval = await storage.getApproval(id);
      
      if (!approval) {
        throw new ApiError('Approval not found', 404);
      }
      
      // Update only allowed properties via Drizzle schema
      const updatedApproval = await storage.updateApproval(id, {
        status: 'approved'
      });
      
      await logActivity(
        'approve', 
        req.user?.id, 
        'approval', 
        id, 
        `Approved ${approval.type} request for employee ID: ${approval.employeeId}`
      );
      
      res.json(updatedApproval);
    } catch (error) {
      next(error);
    }
  });
  
  router.put('/approvals/:id/reject', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        throw new ApiError('Invalid approval ID', 400);
      }
      
      const { reason } = req.body;
      
      if (!reason) {
        throw new ApiError('Rejection reason is required', 400);
      }
      
      const approval = await storage.getApproval(id);
      
      if (!approval) {
        throw new ApiError('Approval not found', 404);
      }
      
      // Update only allowed properties via Drizzle schema
      const updatedApproval = await storage.updateApproval(id, {
        status: 'rejected'
        // Note: rejectedReason isn't included in the insertApprovalSchema,
        // so we can't update it directly this way
      });
      
      await logActivity(
        'reject', 
        req.user?.id, 
        'approval', 
        id, 
        `Rejected ${approval.type} request for employee ID: ${approval.employeeId}`
      );
      
      res.json(updatedApproval);
    } catch (error) {
      next(error);
    }
  });
  
  router.get('/activities/recent/:limit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number(req.params.limit) || 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  // Setup script route to create the initial database tables
  router.post('/setup/init-db', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Create admin user if it doesn't exist
      const adminUser = await storage.getUserByUsername('admin');
      
      if (!adminUser) {
        await storage.createUser({
          username: 'admin',
          password: 'admin123', // In production, use hashed passwords
          email: 'admin@example.com',
          fullName: 'System Administrator',
          role: 'admin'
        });
      }
      
      // Create some default settings
      const taxRateSetting = await storage.getSetting('tax_rate');
      if (!taxRateSetting) {
        await storage.createSetting({
          key: 'tax_rate',
          value: '0.15',
          description: 'Default tax rate (15%)'
        });
      }
      
      const deductionTypes = await storage.getAllDeductionTypes();
      if (deductionTypes.length === 0) {
        await storage.createDeductionType({
          name: 'Income Tax',
          description: 'Mandatory income tax',
          isPercentage: true,
          defaultValue: 15,
          isRequired: true
        });
        
        await storage.createDeductionType({
          name: 'Health Insurance',
          description: 'Health insurance contribution',
          isPercentage: true,
          defaultValue: 3,
          isRequired: true
        });
        
        await storage.createDeductionType({
          name: 'Pension Fund',
          description: 'Retirement pension fund',
          isPercentage: true,
          defaultValue: 5,
          isRequired: true
        });
      }
      
      // Create default allowance types
      const allowanceTypes = await storage.getAllAllowanceTypes();
      if (allowanceTypes.length === 0) {
        await storage.createAllowanceType({
          name: 'Transportation',
          description: 'Transportation allowance',
          isTaxable: false
        });
        
        await storage.createAllowanceType({
          name: 'Meal',
          description: 'Meal allowance',
          isTaxable: false
        });
        
        await storage.createAllowanceType({
          name: 'Performance Bonus',
          description: 'Performance-based bonus',
          isTaxable: true
        });
      }
      
      res.json({ success: true, message: 'Database initialized with default values' });
    } catch (error) {
      next(error);
    }
  });
  
  // SQL Export route to generate SQL for XAMPP setup
  router.get('/setup/sql-export', (_req: Request, res: Response) => {
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
VALUES ('tax_rate', '0.15', 'Default tax rate (15%)')
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
    `;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="payroll_setup.sql"');
    res.send(sql);
  });

  // Theme API endpoint
  router.post('/theme', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { primary, variant, appearance, name } = req.body;
      
      if (!primary || !variant || !appearance) {
        throw new ApiError('Missing required theme parameters', 400);
      }
      
      // In a production app, we might save this to the user's preferences in the database
      // For now, we just return success
      
      if (req.user?.id) {
        // If user is logged in, log this activity
        logActivity(
          'update', 
          req.user?.id, 
          'theme', 
          undefined, 
          `Updated theme to: ${name || 'Custom'}`
        );
      }
      
      res.json({ success: true, message: 'Theme updated' });
    } catch (error) {
      next(error);
    }
  });

  // Register the router with prefix
  app.use('/api', router);

  const httpServer = createServer(app);
  return httpServer;
}
