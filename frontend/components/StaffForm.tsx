import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import type { Staff } from '~backend/inventory/types';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  staff?: Staff | null;
}

interface StaffFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
}

export default function StaffForm({ isOpen, onClose, staff }: StaffFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!staff;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StaffFormData>();

  const createMutation = useMutation({
    mutationFn: (data: StaffFormData) => {
      const payload = {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        department: data.department || undefined,
        position: data.position || undefined,
      };
      return backend.inventory.createStaff(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Success',
        description: 'Staff member created successfully',
      });
      onClose();
      reset();
    },
    onError: (error) => {
      console.error('Create staff error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create staff member',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StaffFormData) => {
      const payload = {
        id: staff!.id,
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        department: data.department || undefined,
        position: data.position || undefined,
      };
      return backend.inventory.updateStaff(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
      });
      onClose();
      reset();
    },
    onError: (error) => {
      console.error('Update staff error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update staff member',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (staff) {
      reset({
        employeeId: staff.employeeId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email || '',
        phone: staff.phone || '',
        department: staff.department || '',
        position: staff.position || '',
        hireDate: staff.hireDate ? new Date(staff.hireDate).toISOString().split('T')[0] : '',
        status: staff.status,
      });
    } else {
      reset({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hireDate: '',
        status: 'ACTIVE',
      });
    }
  }, [staff, reset]);

  const onSubmit = (data: StaffFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                {...register('employeeId', { required: 'Employee ID is required' })}
                placeholder="Enter employee ID"
              />
              {errors.employeeId && (
                <p className="text-sm text-red-600">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600">Status is required</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName', { required: 'First name is required' })}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName', { required: 'Last name is required' })}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="Enter department"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                {...register('position')}
                placeholder="Enter position/title"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              {...register('hireDate')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Update Staff Member' : 'Create Staff Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
