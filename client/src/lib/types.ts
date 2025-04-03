import { 
  Employee, PayrollPeriod, PayrollItem, 
  Attendance, Approval, DeductionType, 
  AllowanceType, Department 
} from "@shared/schema";

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  employeeGrowth: string;
  payrollProcessed: string;
  payrollGrowth: string;
  pendingApprovals: number;
  approvalIncrease: string;
}

export interface EmployeeWithDetails extends Employee {
  initials: string;
}

export interface PayrollItemWithDetails extends PayrollItem {
  employee: {
    firstName: string;
    lastName: string;
    department: string;
    position: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface EmployeeAttendance extends Attendance {
  employeeName: string;
}

export interface ApprovalWithDetails extends Approval {
  employeeName: string;
  employeeInitials: string;
}

export interface ActivityItem {
  id: number;
  userId: number | null;
  userName: string;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string | null;
  timestamp: string;
  icon: string;
  iconBg: string;
}

export interface PayslipData {
  employee: Employee;
  payrollItem: PayrollItem;
  period: PayrollPeriod;
  deductions: {
    type: string;
    amount: number;
    isPercentage: boolean;
  }[];
  allowances: {
    type: string;
    amount: number;
    isTaxable: boolean;
  }[];
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export type FormattedOption = {
  value: string | number;
  label: string;
};

export const formatDepartmentsToOptions = (departments: Department[]): FormattedOption[] => {
  return departments.map(dept => ({
    value: dept.name,
    label: dept.name
  }));
};

export const formatDeductionTypesToOptions = (types: DeductionType[]): FormattedOption[] => {
  return types.map(type => ({
    value: type.id,
    label: type.name
  }));
};

export const formatAllowanceTypesToOptions = (types: AllowanceType[]): FormattedOption[] => {
  return types.map(type => ({
    value: type.id,
    label: type.name
  }));
};

export const formatEmployeesToOptions = (employees: Employee[]): FormattedOption[] => {
  return employees.map(emp => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`
  }));
};

export const formatPayrollPeriodsToOptions = (periods: PayrollPeriod[]): FormattedOption[] => {
  return periods.map(period => ({
    value: period.id,
    label: `${new Date(period.startDate).toLocaleDateString()} - ${new Date(period.endDate).toLocaleDateString()}`
  }));
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (time: string | Date): string => {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (dateTime: string | Date): string => {
  return new Date(dateTime).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
