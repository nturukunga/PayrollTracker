import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Calendar as CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Sample data for charts
const samplePayrollData = [
  { name: "Jan", amount: 42500 },
  { name: "Feb", amount: 43200 },
  { name: "Mar", amount: 45800 },
  { name: "Apr", amount: 44900 },
  { name: "May", amount: 46300 },
  { name: "Jun", amount: 48500 },
];

const sampleDepartmentData = [
  { name: "Engineering", value: 45, color: "#1976d2" },
  { name: "Marketing", value: 20, color: "#f50057" },
  { name: "Finance", value: 15, color: "#4caf50" },
  { name: "HR", value: 10, color: "#ff9800" },
  { name: "Operations", value: 10, color: "#9c27b0" },
];

const sampleAttendanceData = [
  { name: "Present", value: 85, color: "#4caf50" },
  { name: "Late", value: 10, color: "#ff9800" },
  { name: "Absent", value: 3, color: "#f44336" },
  { name: "Leave", value: 2, color: "#2196f3" },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState("payroll");
  const [reportType, setReportType] = useState("summary");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(subMonths(new Date(), 1)));
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ['/api/departments'],
  });

  return (
    <Layout>
      <PageHeader 
        title="Reports" 
        subtitle="Generate and analyze payroll and attendance reports"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
            <Button variant="outline" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Export to PDF
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="payroll">Payroll Reports</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
          <TabsTrigger value="employees">Employee Reports</TabsTrigger>
        </TabsList>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
            <CardDescription>Select filters to generate your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="detailed">Detailed Report</SelectItem>
                    <SelectItem value="tax">Tax Report</SelectItem>
                    {activeTab === "payroll" && (
                      <SelectItem value="variance">Variance Report</SelectItem>
                    )}
                    {activeTab === "attendance" && (
                      <SelectItem value="daily">Daily Attendance</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
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
                        "w-[200px] justify-start text-left font-normal",
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
                  <SelectTrigger className="w-[200px]">
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
              
              <Button className="mt-4 md:mt-0">Generate Report</Button>
            </div>
          </CardContent>
        </Card>
        
        <TabsContent value="payroll">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Payroll Summary</CardTitle>
                <CardDescription>
                  Total payroll processed per month for {departmentFilter || "all departments"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={samplePayrollData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, "Amount"]}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="amount" name="Payroll Amount" fill="#1976d2" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payroll Distribution by Department</CardTitle>
                <CardDescription>
                  Percentage of total payroll by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sampleDepartmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sampleDepartmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll Report Details</CardTitle>
                <CardDescription>
                  Report for period: {format(startDate, "PPP")} - {format(endDate, "PPP")}
                </CardDescription>
              </div>
              <Button variant="outline" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Generate a report to view detailed payroll data
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>
                  Overview of attendance status for {departmentFilter || "all departments"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sampleAttendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sampleAttendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Department Attendance Comparison</CardTitle>
                <CardDescription>
                  Attendance percentage by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: "Engineering", present: 92, late: 5, absent: 3 },
                        { name: "Marketing", present: 88, late: 8, absent: 4 },
                        { name: "Finance", present: 95, late: 3, absent: 2 },
                        { name: "HR", present: 90, late: 7, absent: 3 },
                        { name: "Operations", present: 85, late: 10, absent: 5 },
                      ]}
                      margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" name="Present" stackId="a" fill="#4caf50" />
                      <Bar dataKey="late" name="Late" stackId="a" fill="#ff9800" />
                      <Bar dataKey="absent" name="Absent" stackId="a" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attendance Report Details</CardTitle>
                <CardDescription>
                  Report for period: {format(startDate, "PPP")} - {format(endDate, "PPP")}
                </CardDescription>
              </div>
              <Button variant="outline" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Generate a report to view detailed attendance data
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="employees">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Distribution by Department</CardTitle>
                <CardDescription>
                  Number of employees in each department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sampleDepartmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sampleDepartmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Employee Status</CardTitle>
                <CardDescription>
                  Active, on leave, and terminated employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Active", value: 80, color: "#4caf50" },
                          { name: "On Leave", value: 15, color: "#ff9800" },
                          { name: "Terminated", value: 5, color: "#f44336" },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: "Active", value: 80, color: "#4caf50" },
                          { name: "On Leave", value: 15, color: "#ff9800" },
                          { name: "Terminated", value: 5, color: "#f44336" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employee Report Details</CardTitle>
                <CardDescription>
                  Report for period: {format(startDate, "PPP")} - {format(endDate, "PPP")}
                </CardDescription>
              </div>
              <Button variant="outline" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-12">
                Generate a report to view detailed employee data
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
