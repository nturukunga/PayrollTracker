import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { DataTable } from "@/components/ui/data-table";
import { AttendanceForm } from "@/components/attendance-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ColumnDef } from "@tanstack/react-table";
import { formatDate, formatDateTime } from "@/lib/types";
import {
  Calendar as CalendarIcon,
  Download,
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isValid, parse } from "date-fns";

export default function Attendance() {
  const [isAttendanceFormOpen, setIsAttendanceFormOpen] = useState(false);
  const [editAttendanceId, setEditAttendanceId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/range', { startDate: startDate.toISOString(), endDate: endDate.toISOString() }],
  });

  // Fetch employees for dropdown and display names
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Create columns for attendance table
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
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
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditAttendanceId(row.original.id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Filter attendance records based on department
  const filteredAttendance = departmentFilter
    ? attendanceRecords.filter(record => {
        const employee = employees.find(e => e.id === record.employeeId);
        return employee && employee.department === departmentFilter;
      })
    : attendanceRecords;

  return (
    <Layout>
      <PageHeader 
        title="Attendance" 
        subtitle="Track and manage employee attendance records"
        actions={
          <Button onClick={() => setIsAttendanceFormOpen(true)} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Attendance
          </Button>
        }
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-1">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
              <Button variant="outline" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
        
        {isLoadingAttendance ? (
          <div className="py-12 text-center">Loading attendance records...</div>
        ) : filteredAttendance.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No attendance records found for the selected period</p>
            <Button onClick={() => setIsAttendanceFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Attendance Record
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAttendance}
            filterColumn="employee"
            filterPlaceholder="Search employees..."
          />
        )}
      </div>
      
      {/* Attendance Form Dialog */}
      <AttendanceForm
        isOpen={isAttendanceFormOpen || !!editAttendanceId}
        onClose={() => {
          setIsAttendanceFormOpen(false);
          setEditAttendanceId(null);
        }}
        attendanceId={editAttendanceId ?? undefined}
      />
    </Layout>
  );
}
