import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout, PageHeader } from "@/components/layout";
import { MetricsCard } from "@/components/metrics-card";
import { ActivityFeed } from "@/components/activity-feed";
import { ApprovalCard } from "@/components/approval-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PayrollForm } from "@/components/payroll-form";
import { formatCurrency, getInitials } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { type ActivityItem, type ApprovalWithDetails, type EmployeeWithDetails, type DashboardMetrics } from "@/lib/types";

import {
  DollarSign,
  Download,
  MoreVertical,
  Plus,
  Users,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [isPayrollFormOpen, setIsPayrollFormOpen] = useState(false);
  
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: activities = [] } = useQuery<ActivityItem[]>({
    queryKey: ['/api/activities/recent/4'],
  });

  const { data: pendingApprovals = [] } = useQuery<ApprovalWithDetails[]>({
    queryKey: ['/api/approvals/pending'],
  });

  // Create metrics data
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    employeeGrowth: '+0.0%',
    payrollProcessed: '$0',
    payrollGrowth: '+0.0%',
    pendingApprovals: 0,
    approvalIncrease: '+0',
  });

  const employeesWithDetails: EmployeeWithDetails[] = employees.map(employee => ({
    ...employee,
    initials: getInitials(employee.firstName, employee.lastName),
  }));

  const columns: ColumnDef<EmployeeWithDetails>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-white">
              <span>{employee.initials}</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-neutral-500">{employee.firstName} {employee.lastName}</div>
              <div className="text-sm text-neutral-400">{employee.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div>
            <div className="text-sm text-neutral-500">{employee.position}</div>
            <div className="text-sm text-neutral-400">{employee.department}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'active' ? 'success' : status === 'on_leave' ? 'warning' : 'default'}>
            {status === 'active' ? 'Active' : status === 'on_leave' ? 'On Leave' : 'Terminated'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "basicSalary",
      header: "Salary",
      cell: ({ row }) => formatCurrency(Number(row.original.basicSalary)),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/employees/${row.original.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Edit Employee</DropdownMenuItem>
              <DropdownMenuItem>Generate Payslip</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Calculate metrics based on data
  useEffect(() => {
    if (employees.length) {
      setMetrics(prev => ({
        ...prev,
        totalEmployees: employees.length,
        employeeGrowth: '+5.2%',
      }));
    }

    if (pendingApprovals.length) {
      setMetrics(prev => ({
        ...prev,
        pendingApprovals: pendingApprovals.length,
        approvalIncrease: `+${pendingApprovals.length > 2 ? pendingApprovals.length - 2 : 0}`,
      }));
    }

    setMetrics(prev => ({
      ...prev,
      payrollProcessed: formatCurrency(employees.reduce((sum, emp) => sum + Number(emp.basicSalary), 0)),
      payrollGrowth: '+2.8%',
    }));
  }, [employees, pendingApprovals]);

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        actions={
          <>
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="flex items-center" onClick={() => setIsPayrollFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Payroll
            </Button>
          </>
        }
      />

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricsCard
          title="Total Employees"
          value={metrics.totalEmployees}
          change={metrics.employeeGrowth}
          changeType="positive"
          icon={<Users className="h-5 w-5 text-primary" />}
          iconBackground="bg-blue-100"
          subtitle="from last month"
        />
        
        <MetricsCard
          title="Payroll Processed"
          value={metrics.payrollProcessed}
          change={metrics.payrollGrowth}
          changeType="positive"
          icon={<DollarSign className="h-5 w-5 text-secondary" />}
          iconBackground="bg-pink-100"
          subtitle="from last cycle"
        />
        
        <MetricsCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          change={metrics.approvalIncrease}
          changeType={metrics.pendingApprovals > 0 ? "negative" : "neutral"}
          icon={<Clock className="h-5 w-5 text-warning" />}
          iconBackground="bg-orange-100"
          subtitle="from yesterday"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Employees */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-neutral-500">Recent Employees</h2>
              <Link href="/employees" className="text-primary text-sm hover:underline">
                View All
              </Link>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={employeesWithDetails.slice(0, 4)}
            showPagination={false}
          />
        </div>

        {/* Recent Activities */}
        <ActivityFeed
          activities={activities}
          onViewAll={() => {/* Navigate to activities page */}}
        />
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-neutral-500">Pending Approvals</h2>
              <Button variant="link" className="text-primary text-sm">
                Approve All
              </Button>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingApprovals.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))}
          </div>
        </div>
      )}

      {/* Payroll Form Dialog */}
      <PayrollForm
        isOpen={isPayrollFormOpen}
        onClose={() => setIsPayrollFormOpen(false)}
        mode="period"
      />
    </Layout>
  );
}
