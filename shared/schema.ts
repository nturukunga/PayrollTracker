import { pgTable, text, serial, integer, boolean, date, timestamp, doublePrecision, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: text("employee_code").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  dateHired: date("date_hired").notNull(),
  dateTerminated: date("date_terminated"),
  basicSalary: doublePrecision("basic_salary").notNull(),
  hourlyRate: doublePrecision("hourly_rate"),
  status: text("status").notNull().default("active"),
  taxId: text("tax_id"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  date: date("date").notNull(),
  timeIn: timestamp("time_in").notNull(),
  timeOut: timestamp("time_out"),
  status: text("status").notNull().default("present"),
  notes: text("notes"),
}, (table) => {
  return {
    employeeIdDateIdx: index("employee_id_date_idx").on(table.employeeId, table.date),
    employeeIdDateUnique: unique("employee_id_date_unique").on(table.employeeId, table.date),
  };
});

export const payrollPeriods = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("draft"),
  processedDate: timestamp("processed_date"),
}, (table) => {
  return {
    startEndDateUnique: unique("start_end_date_unique").on(table.startDate, table.endDate),
  };
});

export const payrollItems = pgTable("payroll_items", {
  id: serial("id").primaryKey(),
  payrollPeriodId: integer("payroll_period_id").notNull().references(() => payrollPeriods.id),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  basicSalary: doublePrecision("basic_salary").notNull(),
  hoursWorked: doublePrecision("hours_worked"),
  overtimeHours: doublePrecision("overtime_hours").default(0),
  overtimeAmount: doublePrecision("overtime_amount").default(0),
  grossPay: doublePrecision("gross_pay").notNull(),
  taxAmount: doublePrecision("tax_amount").notNull(),
  otherDeductions: doublePrecision("other_deductions").default(0),
  netPay: doublePrecision("net_pay").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
}, (table) => {
  return {
    periodEmployeeIdx: index("period_employee_idx").on(table.payrollPeriodId, table.employeeId),
    periodEmployeeUnique: unique("period_employee_unique").on(table.payrollPeriodId, table.employeeId),
  };
});

export const deductionTypes = pgTable("deduction_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isPercentage: boolean("is_percentage").notNull().default(false),
  defaultValue: doublePrecision("default_value").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
});

export const deductions = pgTable("deductions", {
  id: serial("id").primaryKey(),
  payrollItemId: integer("payroll_item_id").notNull().references(() => payrollItems.id),
  deductionTypeId: integer("deduction_type_id").notNull().references(() => deductionTypes.id),
  amount: doublePrecision("amount").notNull(),
  notes: text("notes"),
}, (table) => {
  return {
    payrollDeductionTypeIdx: index("payroll_deduction_type_idx").on(table.payrollItemId, table.deductionTypeId),
  };
});

export const allowanceTypes = pgTable("allowance_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isTaxable: boolean("is_taxable").notNull().default(true),
});

export const allowances = pgTable("allowances", {
  id: serial("id").primaryKey(),
  payrollItemId: integer("payroll_item_id").notNull().references(() => payrollItems.id),
  allowanceTypeId: integer("allowance_type_id").notNull().references(() => allowanceTypes.id),
  amount: doublePrecision("amount").notNull(),
  notes: text("notes"),
}, (table) => {
  return {
    payrollAllowanceTypeIdx: index("payroll_allowance_type_idx").on(table.payrollItemId, table.allowanceTypeId),
  };
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
});

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  type: text("type").notNull(), // overtime, leave, reimbursement, etc.
  requestDate: timestamp("request_date").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  hours: doublePrecision("hours"),
  amount: doublePrecision("amount"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedDate: timestamp("approved_date"),
  rejectedReason: text("rejected_reason"),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"), // employee, payroll, attendance, etc.
  entityId: integer("entity_id"),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: text("ip_address"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({ id: true, processedDate: true });
export const insertPayrollItemSchema = createInsertSchema(payrollItems).omit({ id: true });
export const insertDeductionTypeSchema = createInsertSchema(deductionTypes).omit({ id: true });
export const insertDeductionSchema = createInsertSchema(deductions).omit({ id: true });
export const insertAllowanceTypeSchema = createInsertSchema(allowanceTypes).omit({ id: true });
export const insertAllowanceSchema = createInsertSchema(allowances).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export const insertApprovalSchema = createInsertSchema(approvals).omit({ 
  id: true, 
  approvedBy: true, 
  approvedDate: true, 
  rejectedReason: true 
});
export const insertActivitySchema = createInsertSchema(activities).omit({ 
  id: true, 
  timestamp: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;

export type PayrollItem = typeof payrollItems.$inferSelect;
export type InsertPayrollItem = z.infer<typeof insertPayrollItemSchema>;

export type DeductionType = typeof deductionTypes.$inferSelect;
export type InsertDeductionType = z.infer<typeof insertDeductionTypeSchema>;

export type Deduction = typeof deductions.$inferSelect;
export type InsertDeduction = z.infer<typeof insertDeductionSchema>;

export type AllowanceType = typeof allowanceTypes.$inferSelect;
export type InsertAllowanceType = z.infer<typeof insertAllowanceTypeSchema>;

export type Allowance = typeof allowances.$inferSelect;
export type InsertAllowance = z.infer<typeof insertAllowanceSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
