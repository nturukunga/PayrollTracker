import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PayrollForm } from "@/components/payroll-form";
import { AttendanceForm } from "@/components/attendance-form";
import { Payslip } from "@/components/payslip";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, formatDateTime, getInitials } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, CalendarPlus, Download, Edit, FileText, Plus, Printer } from "lucide-react";
import { Link } from "wouter";

interface EmployeeDetailProps {
  id: string;
}

export default function EmployeeDetail({ id }: EmployeeDetailProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isPayrollFormOpen, setIsPayrollFormOpen] = useState(false);
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<number | null>(null);

  const { toast } = useToast();
  const employeeId = parseInt(id);

  // Fetch employee details
  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['/api/employees', employeeId],
    enabled: !isNaN(employeeId)
  });

  // Fetch employee's payroll items
  const { data: payrollItems = [], isLoading: isLoadingPayroll } = useQuery({
    queryKey: ['/api/payroll-items/employee', employeeId],
    enabled: !isNaN(employeeId)
  });

  // Fetch employee's attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/employee', employeeId],
    enabled: !isNaN(employeeId) && activeTab === "attendance"
  });

  // Generate payslip data for the first payroll item (for demo purposes)
  const payslipData = payrollItems.length > 0 && employee ? {
    employee: employee,
    payrollItem: payrollItems[0],
    period: {
      startDate: "2023-07-01",
      endDate: "2023-07-15",
      processedDate: new Date().toISOString()
    },
    deductions: [
      { type: "Income Tax", amount: Number(payrollItems[0].taxAmount), isPercentage: true },
      { type: "Health Insurance", amount: Number(payrollItems[0].basicSalary) * 0.03, isPercentage: true },
      { type: "Pension Fund", amount: Number(payrollItems[0].basicSalary) * 0.05, isPercentage: true }
    ],
    allowances: [],
    companyDetails: {
      name: "PayrollPro Inc.",
      address: "123 Business St, Tech City, 12345",
      phone: "+1 (555) 123-4567",
      email: "payroll@payrollpro.com"
    }
  } : null;

  // Create columns for payroll history table
  const payrollColumns: ColumnDef<any>[] = [
    {
      accessorKey: "period",
      header: "Pay Period",
      cell: ({ row }) => `${formatDate(row.original.startDate)} - ${formatDate(row.original.endDate)}`,
    },
    {
      accessorKey: "grossPay",
      header: "Gross Pay",
      cell: ({ row }) => formatCurrency(Number(row.original.grossPay)),
    },
    {
      accessorKey: "deductions",
      header: "Deductions",
      cell: ({ row }) => formatCurrency(Number(row.original.taxAmount) + Number(row.original.otherDeductions)),
    },
    {
      accessorKey: "netPay",
      header: "Net Pay",
      cell: ({ row }) => formatCurrency(Number(row.original.netPay)),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'paid' ? 'success' : 'default'}>
          {row.original.status === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedPayrollItem(row.original.id)}
          >
            <FileText className="h-4 w-4" />
            <span className="sr-only">View Payslip</span>
          </Button>
        </div>
      ),
    },
  ];

  // Create columns for attendance table
  const attendanceColumns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      accessorKey: "timeIn",
      header: "Time In",
      cell: ({ row }) => formatDateTime(row.original.timeIn),
    },
    {
      accessorKey: "timeOut",
      header: "Time Out",
      cell: ({ row }) => row.original.timeOut ? formatDateTime(row.original.timeOut) : "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === 'present' ? 'success' :
          row.original.status === 'late' ? 'warning' :
          row.original.status === 'absent' ? 'destructive' : 'default'
        }>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "hours",
      header: "Hours",
      cell: ({ row }) => {
        if (!row.original.timeOut) return "-";
        const timeIn = new Date(row.original.timeIn);
        const timeOut = new Date(row.original.timeOut);
        const diffHours = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
        return diffHours.toFixed(2);
      },
    },
  ];

  if (isLoadingEmployee) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p>Loading employee details...</p>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p>Employee not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/employees" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Employees
        </Link>
        
        <PageHeader 
          title={`${employee.firstName} ${employee.lastName}`}
          subtitle={employee.position}
          actions={
            <div className="flex space-x-2">
              <Button variant="outline" asChild>
                <Link href={`/employees`} className="flex items-center">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Employee
                </Link>
              </Button>
              <Button onClick={() => setIsPayrollFormOpen(true)}>Create Payslip</Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Employee Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getInitials(employee.firstName, employee.lastName)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{employee.firstName} {employee.lastName}</h3>
              <p className="text-muted-foreground">{employee.position}</p>
              
              <Badge variant={employee.status === 'active' ? 'success' : 'default'} className="mt-2">
                {employee.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Employee ID</h4>
                <p>{employee.employeeCode}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Department</h4>
                <p>{employee.department}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                <p>{employee.email}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Phone</h4>
                <p>{employee.phone || "Not provided"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Hire Date</h4>
                <p>{formatDate(employee.dateHired)}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Base Salary</h4>
                <p className="text-lg font-semibold">{formatCurrency(Number(employee.basicSalary))}</p>
              </div>
              
              {employee.hourlyRate && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Hourly Rate</h4>
                  <p>{formatCurrency(Number(employee.hourlyRate))}/hour</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="payroll">Payroll History</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Tax ID</h4>
                      <p>{employee.taxId || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Address</h4>
                      <p>{employee.address || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Bank Name</h4>
                      <p>{employee.bankName || "Not provided"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Bank Account</h4>
                      <p>{employee.bankAccountNumber || "Not provided"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Employment Type</h4>
                      <p>{employee.hourlyRate ? "Hourly" : "Salaried"}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Date Hired</h4>
                      <p>{formatDate(employee.dateHired)}</p>
                    </div>
                    
                    {employee.dateTerminated && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Date Terminated</h4>
                        <p>{formatDate(employee.dateTerminated)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payroll">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Payroll History</CardTitle>
                  <Button size="sm" onClick={() => setIsPayrollFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Payroll
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingPayroll ? (
                    <div className="py-6 text-center">Loading payroll data...</div>
                  ) : payrollItems.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-muted-foreground">No payroll records found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setIsPayrollFormOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Payroll
                      </Button>
                    </div>
                  ) : (
                    <DataTable
                      columns={payrollColumns}
                      data={payrollItems}
                      showPagination={payrollItems.length > 5}
                    />
                  )}
                </CardContent>
              </Card>
              
              {selectedPayrollItem && payslipData && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Payslip</h3>
                  <Payslip 
                    data={payslipData} 
                    onPrint={() => {}}
                    onDownload={() => {
                      toast({
                        title: "Download started",
                        description: "Your payslip PDF is being generated",
                      });
                    }}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="attendance">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Attendance Records</CardTitle>
                  <Button size="sm" onClick={() => setIsAttendanceFormOpen(true)}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Add Record
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoadingAttendance ? (
                    <div className="py-6 text-center">Loading attendance data...</div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-muted-foreground">No attendance records found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setIsAttendanceFormOpen(true)}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Create First Record
                      </Button>
                    </div>
                  ) : (
                    <DataTable
                      columns={attendanceColumns}
                      data={attendanceRecords}
                      showPagination={attendanceRecords.length > 10}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground mb-4">No documents have been uploaded for this employee</p>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Payroll Form Dialog */}
      <PayrollForm
        isOpen={isPayrollFormOpen}
        onClose={() => setIsPayrollFormOpen(false)}
        mode="item"
      />
      
      {/* Attendance Form Dialog */}
      <AttendanceForm
        isOpen={isAttendanceFormOpen}
        onClose={() => setIsAttendanceFormOpen(false)}
      />
    </Layout>
  );
}
