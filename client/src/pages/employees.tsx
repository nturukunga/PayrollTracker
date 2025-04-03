import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { DataTable } from "@/components/ui/data-table";
import { EmployeeForm } from "@/components/employee-form";
import { DepartmentForm } from "@/components/department-form";
import { type ColumnDef } from "@tanstack/react-table";
import { formatCurrency, getInitials, formatDate } from "@/lib/types";
import { type EmployeeWithDetails } from "@/lib/types";
import { Link, useLocation } from "wouter";

import {
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Building,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Employees() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);

  // Fetch employees data
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Delete employee mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/employees/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setEmployeeToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete employee: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Process employees data to add initials
  const employeesWithDetails: EmployeeWithDetails[] = employees.map(employee => ({
    ...employee,
    initials: getInitials(employee.firstName, employee.lastName),
  }));

  // Create columns for employee table
  const columns: ColumnDef<EmployeeWithDetails>[] = [
    {
      accessorKey: "employeeCode",
      header: "Employee ID",
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-white mr-3">
              <span>{employee.initials}</span>
            </div>
            <div>
              <div className="font-medium">{employee.firstName} {employee.lastName}</div>
              <div className="text-sm text-muted-foreground">{employee.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "dateHired",
      header: "Date Hired",
      cell: ({ row }) => formatDate(row.original.dateHired),
    },
    {
      accessorKey: "basicSalary",
      header: "Salary",
      cell: ({ row }) => formatCurrency(Number(row.original.basicSalary)),
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
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/employees/${employee.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditEmployeeId(employee.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setEmployeeToDelete(employee.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <Layout>
      <PageHeader 
        title="Employees" 
        subtitle="Manage your organization's employees"
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => setIsAddDepartmentOpen(true)}
            >
              <Building className="mr-2 h-4 w-4" />
              Add Department
            </Button>
            <Button 
              className="flex items-center"
              onClick={() => setIsAddEmployeeOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-lg shadow">
        <DataTable 
          columns={columns} 
          data={employeesWithDetails} 
          filterColumn="name"
          filterPlaceholder="Search employees..."
        />
      </div>
      
      {/* Add/Edit Employee Form */}
      <EmployeeForm 
        isOpen={isAddEmployeeOpen || !!editEmployeeId} 
        onClose={() => {
          setIsAddEmployeeOpen(false);
          setEditEmployeeId(null);
        }}
        employeeId={editEmployeeId ?? undefined}
      />
      
      {/* Add Department Form */}
      <DepartmentForm
        isOpen={isAddDepartmentOpen}
        onClose={() => setIsAddDepartmentOpen(false)}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={(isOpen) => !isOpen && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the employee as terminated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => employeeToDelete && deleteMutation.mutate(employeeToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
