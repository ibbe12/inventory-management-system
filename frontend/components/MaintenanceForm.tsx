import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: number | null;
}

interface MaintenanceFormData {
  maintenanceType: string;
  description: string;
  cost: number;
  performedDate: string;
  performedBy: string;
  nextDueDate: string;
}

export default function MaintenanceForm({ isOpen, onClose, assetId }: MaintenanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceFormData>();

  const { data: asset } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetId ? backend.inventory.getAsset({ id: assetId }) : null,
    enabled: !!assetId,
  });

  const createMutation = useMutation({
    mutationFn: (data: MaintenanceFormData) => {
      if (!assetId) throw new Error('Asset ID is required');
      
      const payload = {
        assetId,
        ...data,
        performedDate: new Date(data.performedDate),
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
        cost: data.cost || undefined,
      };
      return backend.inventory.createMaintenance(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-report'] });
      toast({
        title: 'Success',
        description: 'Maintenance record created successfully',
      });
      onClose();
      reset();
    },
    onError: (error) => {
      console.error('Create maintenance error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create maintenance record',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: MaintenanceFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Add Maintenance Record
            {asset && (
              <span className="text-sm font-normal text-gray-600 block">
                for {asset.name} ({asset.assetTag})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maintenanceType">Maintenance Type *</Label>
            <Input
              id="maintenanceType"
              {...register('maintenanceType', { required: 'Maintenance type is required' })}
              placeholder="e.g., Preventive, Repair, Inspection"
            />
            {errors.maintenanceType && (
              <p className="text-sm text-red-600">{errors.maintenanceType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe the maintenance work performed"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="performedDate">Performed Date *</Label>
              <Input
                id="performedDate"
                type="date"
                {...register('performedDate', { required: 'Performed date is required' })}
              />
              {errors.performedDate && (
                <p className="text-sm text-red-600">{errors.performedDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextDueDate">Next Due Date</Label>
              <Input
                id="nextDueDate"
                type="date"
                {...register('nextDueDate')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                {...register('cost', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Cost must be positive' }
                })}
                placeholder="0.00"
              />
              {errors.cost && (
                <p className="text-sm text-red-600">{errors.cost.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="performedBy">Performed By</Label>
              <Input
                id="performedBy"
                {...register('performedBy')}
                placeholder="Enter technician/company name"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              Create Maintenance Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
