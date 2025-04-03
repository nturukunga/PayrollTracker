import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertPayrollPeriodSchema, insertPayrollItemSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDepartmentsToOptions, formatEmployeesToOptions, formatPayrollPeriodsToOptions } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Create schema for payroll period form
const payrollPeriodFormSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  status: z.string().default("draft"),
  department: z.string().optional(),
  includeBonus: z.boolean().default(false),
  notes: z.string().optional(),
});

// Create schema for payroll item form
const payrollItemFormSchema = z.object({
  payrollPeriodId: z.coerce.number().min(1, "Payroll period is required"),
  employeeId: z.coerce.number().min(1, "Employee is required"),
  basicSalary: z.coerce.number().min(0, "Basic salary cannot be negative"),
  hoursWorked: z.coerce.number().min(0, "Hours worked cannot be negative").optional(),
  overtimeHours: z.coerce.number().min(0, "Overtime hours cannot be negative").default(0),
  overtimeAmount: z.coerce.number().min(0, "Overtime amount cannot be negative").default(0),
  grossPay: z.coerce.number().min(0, "Gross pay cannot be negative"),
  taxAmount: z.coerce.number().min(0, "Tax amount cannot be negative"),
  otherDeductions: z.coerce.number().min(0, "Other deductions cannot be negative").default(0),
  netPay: z.coerce.number().min(0, "Net pay cannot be negative"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

type PayrollPeriodFormValues = z.infer<typeof payrollPeriodFormSchema>;
type PayrollItemFormValues = z.infer<typeof payrollItemFormSchema>;

interface PayrollFormProps {
  isOpen: boolean;
  onClose: () => void;
  payrollPeriodId?: number;
  payrollItemId?: number;
  mode?: 'period' | 'item';
}

export function PayrollForm({ isOpen, onClose, payrollPeriodId, payrollItemId, mode = 'period' }: PayrollFormProps) {
  const { toast } = useToast();
  const isEditing = mode === 'period' ? !!payrollPeriodId : !!payrollItemId;
  const [formStep, setFormStep] = useState<'period' | 'items'>(mode === 'period' ? 'period' : 'items');
  const [newPeriodId, setNewPeriodId] = useState<number | null>(null);

  // Fetch departments and employees for select dropdowns
  const { data: departments = [] } = useQuery({ 
    queryKey: ['/api/departments'],
    enabled: isOpen && formStep === 'period'
  });

  const { data: employees = [] } = useQuery({ 
    queryKey: ['/api/employees'],
    enabled: isOpen && (formStep === 'items' || mode === 'item')
  });

  const { data: payrollPeriods = [] } = useQuery({
    queryKey: ['/api/payroll-periods'],
    enabled: isOpen && (formStep === 'items' || mode === 'item')
  });

  // Fetch payroll period data if editing
  const { data: payrollPeriod } = useQuery({
    queryKey: ['/api/payroll-periods', payrollPeriodId],
    enabled: isOpen && isEditing && mode === 'period'
  });

  // Fetch payroll item data if editing
  const { data: payrollItem } = useQuery({
    queryKey: ['/api/payroll-items', payrollItemId],
    enabled: isOpen && isEditing && mode === 'item'
  });

  // Form for payroll period
  const periodForm = useForm<PayrollPeriodFormValues>({
    resolver: zodResolver(payrollPeriodFormSchema),
    defaultValues: {
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
      status: "draft",
      department: "",
      includeBonus: false,
      notes: "",
    },
  });

  // Form for payroll item
  const itemForm = useForm<PayrollItemFormValues>({
    resolver: zodResolver(payrollItemFormSchema),
    defaultValues: {
      payrollPeriodId: newPeriodId || (payrollPeriodId || 0),
      employeeId: 0,
      basicSalary: 0,
      hoursWorked: 0,
      overtimeHours: 0,
      overtimeAmount: 0,
      grossPay: 0,
      taxAmount: 0,
      otherDeductions: 0,
      netPay: 0,
      status: "pending",
      notes: "",
    },
  });

  // Update period form when payroll period data is loaded
  if (payrollPeriod && mode === 'period' && !periodForm.formState.isDirty) {
    periodForm.reset({
      startDate: new Date(payrollPeriod.startDate),
      endDate: new Date(payrollPeriod.endDate),
      status: payrollPeriod.status,
      notes: payrollPeriod.notes || "",
    });
  }

  // Update item form when payroll item data is loaded
  if (payrollItem && mode === 'item' && !itemForm.formState.isDirty) {
    itemForm.reset({
      payrollPeriodId: payrollItem.payrollPeriodId,
      employeeId: payrollItem.employeeId,
      basicSalary: Number(payrollItem.basicSalary),
      hoursWorked: payrollItem.hoursWorked ? Number(payrollItem.hoursWorked) : undefined,
      overtimeHours: Number(payrollItem.overtimeHours),
      overtimeAmount: Number(payrollItem.overtimeAmount),
      grossPay: Number(payrollItem.grossPay),
      taxAmount: Number(payrollItem.taxAmount),
      otherDeductions: Number(payrollItem.otherDeductions),
      netPay: Number(payrollItem.netPay),
      status: payrollItem.status,
      notes: payrollItem.notes || "",
    });
  }

  // Mutation for creating a payroll period
  const createPeriodMutation = useMutation({
    mutationFn: async (data: PayrollPeriodFormValues) => {
      const apiData = {
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        notes: data.notes,
      };
      const response = await apiRequest('POST', '/api/payroll-periods', apiData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Payroll period created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll-periods'] });
      setNewPeriodId(data.id);
      
      if (mode === 'period') {
        setFormStep('items');
        itemForm.setValue('payrollPeriodId', data.id);
      } else {
        onClose();
        periodForm.reset();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create payroll period: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a payroll period
  const updatePeriodMutation = useMutation({
    mutationFn: async (data: PayrollPeriodFormValues) => {
      const apiData = {
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        notes: data.notes,
      };
      const response = await apiRequest('PUT', `/api/payroll-periods/${payrollPeriodId}`, apiData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll period updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll-periods', payrollPeriodId] });
      
      if (mode === 'period') {
        setFormStep('items');
      } else {
        onClose();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payroll period: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for creating a payroll item
  const createItemMutation = useMutation({
    mutationFn: async (data: PayrollItemFormValues) => {
      const response = await apiRequest('POST', '/api/payroll-items', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll item created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll-items'] });
      onClose();
      itemForm.reset();
      periodForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create payroll item: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a payroll item
  const updateItemMutation = useMutation({
    mutationFn: async (data: PayrollItemFormValues) => {
      const response = await apiRequest('PUT', `/api/payroll-items/${payrollItemId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll-items', payrollItemId] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payroll item: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Function to calculate payroll values
  const calculatePayrollValues = (employeeId: number) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const basicSalary = Number(employee.basicSalary);
    const hoursWorked = itemForm.getValues("hoursWorked") || 0;
    const overtimeHours = itemForm.getValues("overtimeHours") || 0;
    const hourlyRate = employee.hourlyRate ? Number(employee.hourlyRate) : (basicSalary / 160); // Assuming 160 hours per month
    const overtimeRate = hourlyRate * 1.5; // Overtime at 1.5x
    const overtimeAmount = overtimeHours * overtimeRate;
    
    // Calculate gross pay (either based on salary or hours worked)
    const grossPay = employee.hourlyRate 
      ? (hoursWorked * hourlyRate) + overtimeAmount 
      : basicSalary + overtimeAmount;
    
    // Apply tax rate (assuming 15% tax)
    const taxRate = 0.15;
    const taxAmount = grossPay * taxRate;
    
    // Other deductions (default to 0)
    const otherDeductions = itemForm.getValues("otherDeductions") || 0;
    
    // Calculate net pay
    const netPay = grossPay - taxAmount - otherDeductions;
    
    // Update form values
    itemForm.setValue("basicSalary", basicSalary);
    itemForm.setValue("overtimeAmount", overtimeAmount);
    itemForm.setValue("grossPay", grossPay);
    itemForm.setValue("taxAmount", taxAmount);
    itemForm.setValue("netPay", netPay);
  };

  // Handle employee selection
  const handleEmployeeChange = (employeeId: string) => {
    itemForm.setValue("employeeId", Number(employeeId));
    calculatePayrollValues(Number(employeeId));
  };

  // Handle submit for payroll period form
  const onSubmitPeriod = (data: PayrollPeriodFormValues) => {
    if (isEditing && payrollPeriodId) {
      updatePeriodMutation.mutate(data);
    } else {
      createPeriodMutation.mutate(data);
    }
  };

  // Handle submit for payroll item form
  const onSubmitItem = (data: PayrollItemFormValues) => {
    if (isEditing && payrollItemId) {
      updateItemMutation.mutate(data);
    } else {
      createItemMutation.mutate(data);
    }
  };

  const departmentOptions = formatDepartmentsToOptions(departments);
  const employeeOptions = formatEmployeesToOptions(employees);
  const periodOptions = formatPayrollPeriodsToOptions(payrollPeriods);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'period' 
              ? (isEditing ? "Edit Payroll Period" : "Create Payroll") 
              : (isEditing ? "Edit Payroll Item" : "Add Payroll Item")
            }
          </DialogTitle>
        </DialogHeader>

        {(formStep === 'period' && mode === 'period') && (
          <Form {...periodForm}>
            <form onSubmit={periodForm.handleSubmit(onSubmitPeriod)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <FormField
                  control={periodForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={periodForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            fromDate={periodForm.getValues("startDate")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Department */}
              <FormField
                control={periodForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Departments</SelectItem>
                        {departmentOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a specific department or leave blank for all
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Include Bonuses */}
              <FormField
                control={periodForm.control}
                name="includeBonus"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Include Bonuses</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "yes")}
                        defaultValue={field.value ? "yes" : "no"}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={periodForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information..." 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPeriodMutation.isPending || updatePeriodMutation.isPending}
                >
                  {(createPeriodMutation.isPending || updatePeriodMutation.isPending) 
                    ? "Saving..." 
                    : isEditing 
                      ? "Update Period" 
                      : "Next: Add Payroll Items"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {((formStep === 'items' && mode === 'period') || mode === 'item') && (
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
              {/* Payroll Period Selection */}
              {mode === 'item' && (
                <FormField
                  control={itemForm.control}
                  name="payrollPeriodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payroll Period</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Employee Selection */}
              <FormField
                control={itemForm.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={handleEmployeeChange}
                      defaultValue={field.value ? field.value.toString() : undefined}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employeeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select an employee to calculate payroll
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Basic Salary */}
                <FormField
                  control={itemForm.control}
                  name="basicSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basic Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            calculatePayrollValues(Number(itemForm.getValues("employeeId")));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hours Worked */}
                <FormField
                  control={itemForm.control}
                  name="hoursWorked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Worked</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value ? Number(e.target.value) : undefined);
                            calculatePayrollValues(Number(itemForm.getValues("employeeId")));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        For hourly employees
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Overtime Hours */}
                <FormField
                  control={itemForm.control}
                  name="overtimeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overtime Hours</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            calculatePayrollValues(Number(itemForm.getValues("employeeId")));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Overtime Amount */}
                <FormField
                  control={itemForm.control}
                  name="overtimeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overtime Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          readOnly
                        />
                      </FormControl>
                      <FormDescription>
                        Calculated automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gross Pay */}
                <FormField
                  control={itemForm.control}
                  name="grossPay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gross Pay</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          readOnly
                        />
                      </FormControl>
                      <FormDescription>
                        Calculated automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Amount */}
                <FormField
                  control={itemForm.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          readOnly
                        />
                      </FormControl>
                      <FormDescription>
                        Calculated automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other Deductions */}
                <FormField
                  control={itemForm.control}
                  name="otherDeductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Deductions</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            calculatePayrollValues(Number(itemForm.getValues("employeeId")));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Net Pay */}
                <FormField
                  control={itemForm.control}
                  name="netPay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Pay</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...field} 
                          readOnly
                        />
                      </FormControl>
                      <FormDescription>
                        Calculated automatically
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={itemForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information..." 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="space-x-2">
                {mode === 'period' && (
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setFormStep('period')}
                  >
                    Back
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                >
                  {(createItemMutation.isPending || updateItemMutation.isPending) 
                    ? "Saving..." 
                    : isEditing 
                      ? "Update Payroll Item" 
                      : "Save Payroll Item"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
