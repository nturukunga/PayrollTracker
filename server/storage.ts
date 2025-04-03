import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { 
  users, activities, allowances, allowanceTypes, attendance, 
  approvals, deductions, deductionTypes, departments, 
  employees, payrollItems, payrollPeriods, settings,
  type User, type InsertUser, type Employee, type InsertEmployee,
  type Department, type InsertDepartment, type Attendance, type InsertAttendance,
  type PayrollPeriod, type InsertPayrollPeriod, type PayrollItem, type InsertPayrollItem,
  type DeductionType, type InsertDeductionType, type Deduction, type InsertDeduction,
  type AllowanceType, type InsertAllowanceType, type Allowance, type InsertAllowance,
  type Setting, type InsertSetting, type Approval, type InsertApproval,
  type Activity, type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Employee Methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Department Methods
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Attendance Methods
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByEmployee(employeeId: number): Promise<Attendance[]>;
  getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;
  
  // PayrollPeriod Methods
  getPayrollPeriod(id: number): Promise<PayrollPeriod | undefined>;
  getAllPayrollPeriods(): Promise<PayrollPeriod[]>;
  createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod>;
  updatePayrollPeriod(id: number, period: Partial<InsertPayrollPeriod>): Promise<PayrollPeriod | undefined>;
  deletePayrollPeriod(id: number): Promise<boolean>;
  
  // PayrollItem Methods
  getPayrollItem(id: number): Promise<PayrollItem | undefined>;
  getPayrollItemsByPeriod(periodId: number): Promise<PayrollItem[]>;
  getPayrollItemsByEmployee(employeeId: number): Promise<PayrollItem[]>;
  createPayrollItem(item: InsertPayrollItem): Promise<PayrollItem>;
  updatePayrollItem(id: number, item: Partial<InsertPayrollItem>): Promise<PayrollItem | undefined>;
  deletePayrollItem(id: number): Promise<boolean>;
  
  // DeductionType Methods
  getDeductionType(id: number): Promise<DeductionType | undefined>;
  getAllDeductionTypes(): Promise<DeductionType[]>;
  createDeductionType(type: InsertDeductionType): Promise<DeductionType>;
  updateDeductionType(id: number, type: Partial<InsertDeductionType>): Promise<DeductionType | undefined>;
  deleteDeductionType(id: number): Promise<boolean>;
  
  // Deduction Methods
  getDeduction(id: number): Promise<Deduction | undefined>;
  getDeductionsByPayrollItem(payrollItemId: number): Promise<Deduction[]>;
  createDeduction(deduction: InsertDeduction): Promise<Deduction>;
  updateDeduction(id: number, deduction: Partial<InsertDeduction>): Promise<Deduction | undefined>;
  deleteDeduction(id: number): Promise<boolean>;
  
  // AllowanceType Methods
  getAllowanceType(id: number): Promise<AllowanceType | undefined>;
  getAllAllowanceTypes(): Promise<AllowanceType[]>;
  createAllowanceType(type: InsertAllowanceType): Promise<AllowanceType>;
  updateAllowanceType(id: number, type: Partial<InsertAllowanceType>): Promise<AllowanceType | undefined>;
  deleteAllowanceType(id: number): Promise<boolean>;
  
  // Allowance Methods
  getAllowance(id: number): Promise<Allowance | undefined>;
  getAllowancesByPayrollItem(payrollItemId: number): Promise<Allowance[]>;
  createAllowance(allowance: InsertAllowance): Promise<Allowance>;
  updateAllowance(id: number, allowance: Partial<InsertAllowance>): Promise<Allowance | undefined>;
  deleteAllowance(id: number): Promise<boolean>;
  
  // Setting Methods
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(id: number, setting: Partial<InsertSetting>): Promise<Setting | undefined>;
  deleteSetting(id: number): Promise<boolean>;

  // Approval Methods
  getApproval(id: number): Promise<Approval | undefined>;
  getApprovalsByEmployee(employeeId: number): Promise<Approval[]>;
  getPendingApprovals(): Promise<Approval[]>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: number, approval: Partial<InsertApproval>): Promise<Approval | undefined>;
  deleteApproval(id: number): Promise<boolean>;
  
  // Activity Methods
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(): Promise<Activity[]>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class DatabaseStorage implements IStorage {
  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await getDb().select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await getDb().insert(users).values(user).returning();
    return result;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await getDb()
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await getDb().delete(users).where(eq(users.id, id));
    return result.length > 0;
  }
  
  // Employee Methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await getDb().select().from(employees).where(eq(employees.id, id));
    return result[0];
  }
  
  async getAllEmployees(): Promise<Employee[]> {
    return await getDb().select().from(employees);
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [result] = await getDb().insert(employees).values(employee).returning();
    return result;
  }
  
  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [updated] = await getDb()
      .update(employees)
      .set(employeeData)
      .where(eq(employees.id, id))
      .returning();
    return updated;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    const result = await getDb().delete(employees).where(eq(employees.id, id));
    return result.length > 0;
  }
  
  // Department Methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await getDb().select().from(departments).where(eq(departments.id, id));
    return result[0];
  }
  
  async getAllDepartments(): Promise<Department[]> {
    return await getDb().select().from(departments);
  }
  
  async createDepartment(department: InsertDepartment): Promise<Department> {
    const [result] = await getDb().insert(departments).values(department).returning();
    return result;
  }
  
  async updateDepartment(id: number, departmentData: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [updated] = await getDb()
      .update(departments)
      .set(departmentData)
      .where(eq(departments.id, id))
      .returning();
    return updated;
  }
  
  async deleteDepartment(id: number): Promise<boolean> {
    const result = await getDb().delete(departments).where(eq(departments.id, id));
    return result.length > 0;
  }
  
  // Attendance Methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await getDb().select().from(attendance).where(eq(attendance.id, id));
    return result[0];
  }
  
  async getAttendanceByEmployee(employeeId: number): Promise<Attendance[]> {
    return await getDb().select().from(attendance).where(eq(attendance.employeeId, employeeId));
  }
  
  async getAttendanceByDateRange(startDate: Date, endDate: Date): Promise<Attendance[]> {
    return await getDb()
      .select()
      .from(attendance)
      .where(
        and(
          sql`${attendance.date} >= ${startDate.toISOString().split('T')[0]}`,
          sql`${attendance.date} <= ${endDate.toISOString().split('T')[0]}`
        )
      );
  }
  
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [result] = await getDb().insert(attendance).values(attendanceData).returning();
    return result;
  }
  
  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updated] = await getDb()
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return updated;
  }
  
  async deleteAttendance(id: number): Promise<boolean> {
    const result = await getDb().delete(attendance).where(eq(attendance.id, id));
    return result.length > 0;
  }
  
  // PayrollPeriod Methods
  async getPayrollPeriod(id: number): Promise<PayrollPeriod | undefined> {
    const result = await getDb().select().from(payrollPeriods).where(eq(payrollPeriods.id, id));
    return result[0];
  }
  
  async getAllPayrollPeriods(): Promise<PayrollPeriod[]> {
    return await getDb().select().from(payrollPeriods);
  }
  
  async createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod> {
    const [result] = await getDb().insert(payrollPeriods).values(period).returning();
    return result;
  }
  
  async updatePayrollPeriod(id: number, periodData: Partial<InsertPayrollPeriod>): Promise<PayrollPeriod | undefined> {
    const [updated] = await getDb()
      .update(payrollPeriods)
      .set(periodData)
      .where(eq(payrollPeriods.id, id))
      .returning();
    return updated;
  }
  
  async deletePayrollPeriod(id: number): Promise<boolean> {
    const result = await getDb().delete(payrollPeriods).where(eq(payrollPeriods.id, id));
    return result.length > 0;
  }
  
  // PayrollItem Methods
  async getPayrollItem(id: number): Promise<PayrollItem | undefined> {
    const result = await getDb().select().from(payrollItems).where(eq(payrollItems.id, id));
    return result[0];
  }
  
  async getPayrollItemsByPeriod(periodId: number): Promise<PayrollItem[]> {
    return await getDb().select().from(payrollItems).where(eq(payrollItems.payrollPeriodId, periodId));
  }
  
  async getPayrollItemsByEmployee(employeeId: number): Promise<PayrollItem[]> {
    return await getDb().select().from(payrollItems).where(eq(payrollItems.employeeId, employeeId));
  }
  
  async createPayrollItem(item: InsertPayrollItem): Promise<PayrollItem> {
    const [result] = await getDb().insert(payrollItems).values(item).returning();
    return result;
  }
  
  async updatePayrollItem(id: number, itemData: Partial<InsertPayrollItem>): Promise<PayrollItem | undefined> {
    const [updated] = await getDb()
      .update(payrollItems)
      .set(itemData)
      .where(eq(payrollItems.id, id))
      .returning();
    return updated;
  }
  
  async deletePayrollItem(id: number): Promise<boolean> {
    const result = await getDb().delete(payrollItems).where(eq(payrollItems.id, id));
    return result.length > 0;
  }
  
  // DeductionType Methods
  async getDeductionType(id: number): Promise<DeductionType | undefined> {
    const result = await getDb().select().from(deductionTypes).where(eq(deductionTypes.id, id));
    return result[0];
  }
  
  async getAllDeductionTypes(): Promise<DeductionType[]> {
    return await getDb().select().from(deductionTypes);
  }
  
  async createDeductionType(type: InsertDeductionType): Promise<DeductionType> {
    const [result] = await getDb().insert(deductionTypes).values(type).returning();
    return result;
  }
  
  async updateDeductionType(id: number, typeData: Partial<InsertDeductionType>): Promise<DeductionType | undefined> {
    const [updated] = await getDb()
      .update(deductionTypes)
      .set(typeData)
      .where(eq(deductionTypes.id, id))
      .returning();
    return updated;
  }
  
  async deleteDeductionType(id: number): Promise<boolean> {
    const result = await getDb().delete(deductionTypes).where(eq(deductionTypes.id, id));
    return result.length > 0;
  }
  
  // Deduction Methods
  async getDeduction(id: number): Promise<Deduction | undefined> {
    const result = await getDb().select().from(deductions).where(eq(deductions.id, id));
    return result[0];
  }
  
  async getDeductionsByPayrollItem(payrollItemId: number): Promise<Deduction[]> {
    return await getDb().select().from(deductions).where(eq(deductions.payrollItemId, payrollItemId));
  }
  
  async createDeduction(deduction: InsertDeduction): Promise<Deduction> {
    const [result] = await getDb().insert(deductions).values(deduction).returning();
    return result;
  }
  
  async updateDeduction(id: number, deductionData: Partial<InsertDeduction>): Promise<Deduction | undefined> {
    const [updated] = await getDb()
      .update(deductions)
      .set(deductionData)
      .where(eq(deductions.id, id))
      .returning();
    return updated;
  }
  
  async deleteDeduction(id: number): Promise<boolean> {
    const result = await getDb().delete(deductions).where(eq(deductions.id, id));
    return result.length > 0;
  }
  
  // AllowanceType Methods
  async getAllowanceType(id: number): Promise<AllowanceType | undefined> {
    const result = await getDb().select().from(allowanceTypes).where(eq(allowanceTypes.id, id));
    return result[0];
  }
  
  async getAllAllowanceTypes(): Promise<AllowanceType[]> {
    return await getDb().select().from(allowanceTypes);
  }
  
  async createAllowanceType(type: InsertAllowanceType): Promise<AllowanceType> {
    const [result] = await getDb().insert(allowanceTypes).values(type).returning();
    return result;
  }
  
  async updateAllowanceType(id: number, typeData: Partial<InsertAllowanceType>): Promise<AllowanceType | undefined> {
    const [updated] = await getDb()
      .update(allowanceTypes)
      .set(typeData)
      .where(eq(allowanceTypes.id, id))
      .returning();
    return updated;
  }
  
  async deleteAllowanceType(id: number): Promise<boolean> {
    const result = await getDb().delete(allowanceTypes).where(eq(allowanceTypes.id, id));
    return result.length > 0;
  }
  
  // Allowance Methods
  async getAllowance(id: number): Promise<Allowance | undefined> {
    const result = await getDb().select().from(allowances).where(eq(allowances.id, id));
    return result[0];
  }
  
  async getAllowancesByPayrollItem(payrollItemId: number): Promise<Allowance[]> {
    return await getDb().select().from(allowances).where(eq(allowances.payrollItemId, payrollItemId));
  }
  
  async createAllowance(allowance: InsertAllowance): Promise<Allowance> {
    const [result] = await getDb().insert(allowances).values(allowance).returning();
    return result;
  }
  
  async updateAllowance(id: number, allowanceData: Partial<InsertAllowance>): Promise<Allowance | undefined> {
    const [updated] = await getDb()
      .update(allowances)
      .set(allowanceData)
      .where(eq(allowances.id, id))
      .returning();
    return updated;
  }
  
  async deleteAllowance(id: number): Promise<boolean> {
    const result = await getDb().delete(allowances).where(eq(allowances.id, id));
    return result.length > 0;
  }
  
  // Setting Methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await getDb().select().from(settings).where(eq(settings.key, key));
    return result[0];
  }
  
  async getAllSettings(): Promise<Setting[]> {
    return await getDb().select().from(settings);
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const [result] = await getDb().insert(settings).values(setting).returning();
    return result;
  }
  
  async updateSetting(id: number, settingData: Partial<InsertSetting>): Promise<Setting | undefined> {
    const [updated] = await getDb()
      .update(settings)
      .set(settingData)
      .where(eq(settings.id, id))
      .returning();
    return updated;
  }
  
  async deleteSetting(id: number): Promise<boolean> {
    const result = await getDb().delete(settings).where(eq(settings.id, id));
    return result.length > 0;
  }

  // Approval Methods
  async getApproval(id: number): Promise<Approval | undefined> {
    const result = await getDb().select().from(approvals).where(eq(approvals.id, id));
    return result[0];
  }
  
  async getApprovalsByEmployee(employeeId: number): Promise<Approval[]> {
    return await getDb().select().from(approvals).where(eq(approvals.employeeId, employeeId));
  }
  
  async getPendingApprovals(): Promise<Approval[]> {
    return await getDb().select().from(approvals).where(eq(approvals.status, 'pending'));
  }
  
  async createApproval(approval: InsertApproval): Promise<Approval> {
    const [result] = await getDb().insert(approvals).values(approval).returning();
    return result;
  }
  
  async updateApproval(id: number, approvalData: Partial<InsertApproval>): Promise<Approval | undefined> {
    const [updated] = await getDb()
      .update(approvals)
      .set(approvalData)
      .where(eq(approvals.id, id))
      .returning();
    return updated;
  }
  
  async deleteApproval(id: number): Promise<boolean> {
    const result = await getDb().delete(approvals).where(eq(approvals.id, id));
    return result.length > 0;
  }
  
  // Activity Methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const result = await getDb().select().from(activities).where(eq(activities.id, id));
    return result[0];
  }
  
  async getAllActivities(): Promise<Activity[]> {
    return await getDb().select().from(activities);
  }
  
  async getRecentActivities(limit: number): Promise<Activity[]> {
    return await getDb()
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [result] = await getDb().insert(activities).values(activity).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();