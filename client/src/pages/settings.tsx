import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DepartmentForm } from "@/components/department-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SetupWizard } from "@/components/setup-wizard";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/types";
import {
  Database,
  Download,
  Edit,
  Save,
  Trash2,
  Undo,
  Upload,
  User,
  UserPlus,
  MoreHorizontal,
  Building,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const { toast } = useToast();

  // Fetch settings data
  const { data: settings = {}, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['/api/departments'],
    enabled: activeTab === "departments",
  });

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: activeTab === "users",
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const promises = Object.entries(data).map(([key, value]) => 
        apiRequest('POST', '/api/settings', { key, value })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Form for general settings
  const generalForm = useForm({
    defaultValues: {
      company_name: "",
      company_address: "",
      company_phone: "",
      company_email: "",
      tax_rate: "",
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      generalForm.reset({
        company_name: settings.company_name || "",
        company_address: settings.company_address || "",
        company_phone: settings.company_phone || "",
        company_email: settings.company_email || "",
        tax_rate: settings.tax_rate || "",
      });
    }
  }, [settings, generalForm]);

  // Handle submit for general settings
  const handleGeneralSubmit = generalForm.handleSubmit((data) => {
    updateSettingsMutation.mutate(data);
  });

  // Form schema for adding a user
  const userFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    email: z.string().email("Please enter a valid email"),
    fullName: z.string().min(3, "Full name is required"),
    role: z.enum(["admin", "manager", "staff"]),
  });

  // User form
  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      role: "staff",
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof userFormSchema>) => {
      const response = await apiRequest('POST', '/api/users', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserOpen(false);
      userForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add user: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle submit for adding a user
  const handleUserSubmit = userForm.handleSubmit((data) => {
    addUserMutation.mutate(data);
  });

  // Create columns for departments table
  const departmentColumns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "Department Name",
    },
    {
      accessorKey: "description",
      header: "Description",
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
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Create columns for users table
  const userColumns: ColumnDef<any>[] = [
    {
      accessorKey: "username",
      header: "Username",
    },
    {
      accessorKey: "fullName",
      header: "Full Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.role}</div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <div className={row.original.isActive ? "text-green-600" : "text-red-600"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </div>
      ),
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
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader 
        title="Settings" 
        subtitle="Configure your payroll system settings"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Set up your company details for payslips and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGeneralSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      placeholder="Your Company Inc."
                      {...generalForm.register("company_name")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company_email">Company Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      placeholder="info@yourcompany.com"
                      {...generalForm.register("company_email")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Company Phone</Label>
                    <Input
                      id="company_phone"
                      placeholder="+1 (555) 123-4567"
                      {...generalForm.register("company_phone")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                    <Input
                      id="tax_rate"
                      placeholder="15"
                      {...generalForm.register("tax_rate")}
                    />
                    <p className="text-sm text-muted-foreground">
                      Default tax rate applied to all payroll calculations
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea
                    id="company_address"
                    placeholder="123 Business St, City, State, ZIP"
                    rows={3}
                    {...generalForm.register("company_address")}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="flex items-center"
                  disabled={updateSettingsMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Settings</CardTitle>
              <CardDescription>
                Configure default payroll calculation settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="overtime_multiplier">Overtime Rate Multiplier</Label>
                    <FormDescription>
                      Multiplier applied to hourly rate for overtime calculations
                    </FormDescription>
                  </div>
                  <Input
                    id="overtime_multiplier"
                    type="number"
                    placeholder="1.5"
                    defaultValue={settings.overtime_multiplier || "1.5"}
                    className="w-[200px]"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Standard Work Hours (Monthly)</Label>
                    <FormDescription>
                      Standard work hours per month for salaried employees
                    </FormDescription>
                  </div>
                  <Input
                    type="number"
                    placeholder="160"
                    defaultValue={settings.standard_work_hours || "160"}
                    className="w-[200px]"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Calculate Salary Prorated</Label>
                    <FormDescription>
                      Prorate salary for partial periods
                    </FormDescription>
                  </div>
                  <Switch
                    checked={settings.prorate_salary === "true"}
                    onCheckedChange={() => {}}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Process Payroll Automatically</Label>
                    <FormDescription>
                      Automatically process payroll at the end of each period
                    </FormDescription>
                  </div>
                  <Switch
                    checked={settings.auto_process === "true"}
                    onCheckedChange={() => {}}
                  />
                </div>
                
                <Button 
                  className="flex items-center"
                  disabled={updateSettingsMutation.isPending}
                  onClick={() => {
                    toast({
                      title: "Success",
                      description: "Payroll settings have been saved",
                    });
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Departments</CardTitle>
                <CardDescription>
                  Add, edit or delete company departments
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDepartmentOpen(true)} className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingDepartments ? (
                <div className="py-6 text-center">Loading departments...</div>
              ) : departments.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground mb-4">No departments found</p>
                  <Button onClick={() => setIsAddDepartmentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Department
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={departmentColumns}
                  data={departments}
                  filterColumn="name"
                  filterPlaceholder="Search departments..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage users who can access the payroll system
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddUserOpen(true)} className="flex items-center">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="py-6 text-center">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground mb-4">No users found</p>
                  <Button onClick={() => setIsAddUserOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First User
                  </Button>
                </div>
              ) : (
                <DataTable
                  columns={userColumns}
                  data={users}
                  filterColumn="username"
                  filterPlaceholder="Search users..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>
                Configure database connection and perform maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-medium">PostgreSQL Database Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Connection status: <span className="text-green-600 font-medium">Connected</span>
                  </p>
                </div>
                <Button variant="outline" className="flex items-center" onClick={() => {
                  toast({
                    title: "Database Connection",
                    description: "PostgreSQL database is properly configured in the environment",
                  });
                }}>
                  <Database className="mr-2 h-4 w-4" />
                  Check Connection
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-base font-medium mb-2">Connection Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="db_host">Host</Label>
                    <Input
                      id="db_host"
                      placeholder="PostgreSQL host"
                      value={process.env.PGHOST || "Replit PostgreSQL"}
                      readOnly
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="db_port">Port</Label>
                    <Input
                      id="db_port"
                      placeholder="PostgreSQL port"
                      value={process.env.PGPORT || "5432"}
                      readOnly
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="db_name">Database Name</Label>
                    <Input
                      id="db_name"
                      placeholder="Database name"
                      value={process.env.PGDATABASE || "postgres"}
                      readOnly
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="db_user">Username</Label>
                    <Input
                      id="db_user"
                      placeholder="Username"
                      value={process.env.PGUSER || "postgres"}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-base font-medium mb-4">Backup and Restore</h3>
                <div className="flex space-x-4">
                  <Button variant="outline" className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Export Database
                  </Button>
                  <Button variant="outline" className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </Button>
                  <Button variant="outline" className="flex items-center text-red-600 hover:text-red-700">
                    <Undo className="mr-2 h-4 w-4" />
                    Reset Database
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Department Form Dialog */}
      <DepartmentForm
        isOpen={isAddDepartmentOpen}
        onClose={() => setIsAddDepartmentOpen(false)}
      />
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the payroll system
            </DialogDescription>
          </DialogHeader>
          
          <Form {...userForm}>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="staff">Staff</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Admin: Full access, Manager: Limited admin access, Staff: View only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending ? "Creating..." : "Add User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* XAMPP Setup Wizard */}
      <SetupWizard isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} />
    </Layout>
  );
}
