import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Mail, Phone, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import StaffForm from '../components/StaffForm';
import { formatDate } from '../utils/format';
import type { Staff } from '~backend/inventory/types';

export default function Staff() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => backend.inventory.listStaff(),
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: number) => backend.inventory.deleteStaff({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: 'Success',
        description: 'Staff member deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Delete staff error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete staff member',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteStaffMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading staff...</div>
      </div>
    );
  }

  const staff = staffData?.staff || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Directory</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization's staff members
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {member.firstName} {member.lastName}
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ID: {member.employeeId}
                  </p>
                  {member.position && (
                    <Badge variant="secondary" className="text-xs">
                      {member.position}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge className={getStatusColor(member.status)}>
                  {member.status}
                </Badge>
              </div>

              {member.department && (
                <div>
                  <span className="text-sm text-gray-500">Department:</span>
                  <div className="text-sm font-medium">{member.department}</div>
                </div>
              )}

              {member.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <a 
                    href={`mailto:${member.email}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {member.email}
                  </a>
                </div>
              )}

              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <a 
                    href={`tel:${member.phone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {member.phone}
                  </a>
                </div>
              )}

              {member.hireDate && (
                <div>
                  <span className="text-sm text-gray-500">Hire Date:</span>
                  <div className="text-sm font-medium">{formatDate(member.hireDate)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {staff.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No staff members found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Get started by adding your first staff member to the directory.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </CardContent>
        </Card>
      )}

      <StaffForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        staff={editingStaff}
      />
    </div>
  );
}
