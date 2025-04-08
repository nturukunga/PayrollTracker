import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { DataTable } from "@/components/ui/data-table";
import { PayrollForm } from "@/components/payroll-form";
import { Payslip } from "@/components/payslip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/types";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Download,
  FileText,
  Filter,
  Plus,
  Printer,
  Calendar,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { FormProvider, useForm } from "react-hook-form";

type PayrollPeriod = {
  id: number;
  startDate: string;
  endDate: string;
  processedDate?: string;
  status: string;
};

export default function Payroll() {
  const [activeTab, setActiveTab] = useState("periods");
  const [isPayrollFormOpen, setIsPayrollFormOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<number | null>(null);
  
  const payrollFormMethods = useForm();

  const { toast } = useToast();

  const { data: payrollPeriods = [] as PayrollPeriod[], isLoading: isLoadingPeriods } = useQuery<PayrollPeriod[]>({
    queryKey: ['/api/payroll-periods'],
  });

  const { data: payrollItems = [], isLoading: isLoadingItems } = useQuery<any[]>({
    queryKey: ['/api/payroll-items/period', selectedPeriod],
    enabled: !!selectedPeriod,
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/employees'],
  });

  // Sample payslip data (for demo purposes)
  const payslipData = payrollItems.length > 0 && employees.length > 0 ? {
    employee: employees.find(e => e.id === payrollItems[0].employeeId) || employees[0],
    payrollItem: payrollItems[0],
    period: (() => {
      const periodData = payrollPeriods.find(p => p.id === payrollItems[0].payrollPeriodId) || payrollPeriods[0];
      return { ...periodData, processedDate: periodData.processedDate ? new Date(periodData.processedDate) : null };
    })(),
    deductions: [
      { type: "Income Tax", amount: Number(payrollItems[0].taxAmount), isPercentage: true },
      { type: "Health Insurance", amount: Number(payrollItems[0].basicSalary) * 0.03, isPercentage: true },
      { type: "Pension Fund", amount: Number(payrollItems[0].basicSalary) * 0.05, isPercentage: true }
    ],
    allowances: [],
    companyDetails: {
      name: "Native254 Inc.",
      address: "39 Ruai, Nairobi, 00300",
      phone: "+254 716 369 996",
      email: "Info.native254@gmail.com"
    }
  } : null;

  const periodColumns: ColumnDef<any>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => `#${row.original.id}`,
    },
    {
      accessorKey: "period",
      header: "Pay Period",
      cell: ({ row }) => `${formatDate(row.original.startDate)} - ${formatDate(row.original.endDate)}`,
    },
    {
      accessorKey: "processedDate",
      header: "Processed Date",
      cell: ({ row }) => row.original.processedDate ? formatDate(row.original.processedDate) : "Not processed",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={
          row.original.status === 'processed' ? 'destructive' :
          row.original.status === 'draft' ? 'secondary' : 'default'
        }>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedPeriod(row.original.id)}>
              <FileText className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Calendar className="mr-2 h-4 w-4" />
              Process Payroll
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const itemColumns: ColumnDef<any>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = employees.find(e => e.id === row.original.employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : `Employee #${row.original.employeeId}`;
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => {
        const employee = employees.find(e => e.id === row.original.employeeId);
        return employee ? employee.department : "";
      },
    },
    {
      accessorKey: "basicSalary",
      header: "Basic Salary",
      cell: ({ row }) => formatCurrency(Number(row.original.basicSalary)),
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
        <Badge variant={row.original.status === 'paid' ? 'secondary' : 'default'}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
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

  return (
    <Layout>
      <PageHeader 
        title="Payroll" 
        subtitle="Manage payroll periods and process employee payments"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => setIsPayrollFormOpen(true)} className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Payroll
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="items" disabled={!selectedPeriod}>Payroll Items</TabsTrigger>
          {selectedPayrollItem && <TabsTrigger value="payslip">Payslip</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="periods">
          <Card>
            <CardContent className="pt-6">
              {isLoadingPeriods ? (
                <div className="py-6 text-center">Loading payroll periods...</div>
              ) : payrollPeriods.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground mb-4">No payroll periods found</p>
                  <Button onClick={() => setIsPayrollFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Payroll Period
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={periodColumns}
                  data={payrollPeriods}
                  filterColumn="period"
                  filterPlaceholder="Search payroll periods..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="items">
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium">
                    Payroll Details: {
                      selectedPeriod && payrollPeriods.find(p => p.id === selectedPeriod) ? 
                      `${formatDate(payrollPeriods.find(p => p.id === selectedPeriod)!.startDate)} - ${formatDate(payrollPeriods.find(p => p.id === selectedPeriod)!.endDate)}` :
                      ''
                    }
                  </h3>
                  <Badge variant={
                    selectedPeriod && payrollPeriods.find(p => p.id === selectedPeriod)?.status === 'processed' ? 'secondary' : 'default'
                  }>
                    {selectedPeriod && payrollPeriods.find(p => p.id === selectedPeriod)?.status.charAt(0).toUpperCase() + payrollPeriods.find(p => p.id === selectedPeriod)!.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button className="flex items-center">
                    <Printer className="mr-2 h-4 w-4" />
                    Print All
                  </Button>
                </div>
              </div>
              
              {isLoadingItems ? (
                <div className="py-6 text-center">Loading payroll items...</div>
              ) : payrollItems.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground mb-4">No payroll items found for this period</p>
                  <Button onClick={() => setIsPayrollFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payroll Item
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={itemColumns}
                  data={payrollItems}
                  filterColumn="employee"
                  filterPlaceholder="Search employees..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payslip">
          {payslipData && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Employee Payslip</h3>
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
      </Tabs>
      
      {/* Payroll Form Dialog */}
      <PayrollForm
        isOpen={isPayrollFormOpen}
        onClose={() => setIsPayrollFormOpen(false)}
        mode="period"
        payrollPeriodId={selectedPeriod ?? undefined}
      />
    </Layout>
  );
}
