import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertAttendanceSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatEmployeesToOptions } from "@/lib/types";

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
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Extend the schema with additional validation
const attendanceFormSchema = z.object({
  employeeId: z.coerce.number().min(1, "Employee is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  timeIn: z.string().min(1, "Time in is required"),
  timeOut: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceId?: number;
}

export function AttendanceForm({ isOpen, onClose, attendanceId }: AttendanceFormProps) {
  const { toast } = useToast();
  const isEditing = !!attendanceId;

  // Fetch employees for select dropdown
  const { data: employees = [] } = useQuery({ 
    queryKey: ['/api/employees'],
    enabled: isOpen
  });

  // Fetch attendance data if editing
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance', attendanceId],
    enabled: isOpen && isEditing
  });

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      employeeId: 0,
      date: new Date(),
      timeIn: format(new Date(), "HH:mm"),
      timeOut: "",
      status: "present",
      notes: "",
    },
  });

  // Update form when attendance data is loaded
  if (attendance && isEditing && !form.formState.isDirty) {
    form.reset({
      employeeId: attendance.employeeId,
      date: new Date(attendance.date),
      timeIn: format(new Date(attendance.timeIn), "HH:mm"),
      timeOut: attendance.timeOut ? format(new Date(attendance.timeOut), "HH:mm") : "",
      status: attendance.status,
      notes: attendance.notes || "",
    });
  }

  const createMutation = useMutation({
    mutationFn: async (data: AttendanceFormValues) => {
      // Convert form values to proper format for API
      const formattedData = {
        ...data,
        timeIn: new Date(`${format(data.date, "yyyy-MM-dd")}T${data.timeIn}`).toISOString(),
        timeOut: data.timeOut 
          ? new Date(`${format(data.date, "yyyy-MM-dd")}T${data.timeOut}`).toISOString() 
          : null,
      };
      
      const response = await apiRequest('POST', '/api/attendance', formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance record created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create attendance record: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AttendanceFormValues) => {
      // Convert form values to proper format for API
      const formattedData = {
        ...data,
        timeIn: new Date(`${format(data.date, "yyyy-MM-dd")}T${data.timeIn}`).toISOString(),
        timeOut: data.timeOut 
          ? new Date(`${format(data.date, "yyyy-MM-dd")}T${data.timeOut}`).toISOString() 
          : null,
      };
      
      const response = await apiRequest('PUT', `/api/attendance/${attendanceId}`, formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance record updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update attendance record: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AttendanceFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const employeeOptions = formatEmployeesToOptions(employees);
  const statusOptions = [
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "late", label: "Late" },
    { value: "half_day", label: "Half Day" },
    { value: "leave", label: "Leave" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Attendance Record" : "Add Attendance Record"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Employee */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Time In */}
              <FormField
                control={form.control}
                name="timeIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time In</FormLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input type="time" className="pl-9" {...field} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Out */}
              <FormField
                control={form.control}
                name="timeOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Out</FormLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input 
                          type="time" 
                          className="pl-9" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-xs">
                      Leave blank if not checked out
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
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
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) 
                  ? "Saving..." 
                  : isEditing 
                    ? "Update Record" 
                    : "Add Record"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
