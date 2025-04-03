import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertDepartmentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Create schema for the form
const departmentFormSchema = insertDepartmentSchema;

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: number;
}

export function DepartmentForm({ isOpen, onClose, departmentId }: DepartmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!departmentId;

  // Fetch department data if editing
  const { data: department, isLoading: isLoadingDepartment } = useQuery({
    queryKey: ['/api/departments', departmentId],
    enabled: isOpen && isEditing
  });

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when department data is loaded
  if (department && isEditing && !form.formState.isDirty) {
    form.reset({
      name: department.name,
      description: department.description || "",
    });
  }

  const createMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      const response = await apiRequest('POST', '/api/departments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create department: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DepartmentFormValues) => {
      const response = await apiRequest('PUT', `/api/departments/${departmentId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/departments', departmentId] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update department: ${error}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepartmentFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Department" : "Add Department"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Department Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Department details and responsibilities" 
                      className="resize-none" 
                      rows={4}
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
                    ? "Update Department" 
                    : "Add Department"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
