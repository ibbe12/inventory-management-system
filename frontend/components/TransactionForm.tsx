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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TransactionFormData {
  productId: number;
  transactionType: 'RECEIVE' | 'ISSUE' | 'ADJUSTMENT';
  quantity: number;
  referenceNumber: string;
  notes: string;
  createdBy: string;
  staffId: number | null;
}

export default function TransactionForm({ isOpen, onClose }: TransactionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>();

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => backend.inventory.listProducts(),
  });

  const { data: staffData } = useQuery({
    queryKey: ['active-staff'],
    queryFn: () => backend.inventory.listActiveStaff(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TransactionFormData) => {
      const payload = {
        ...data,
        staffId: data.staffId || undefined,
      };
      return backend.inventory.createTransaction(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
      onClose();
      reset();
    },
    onError: (error) => {
      console.error('Create transaction error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transaction',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createMutation.mutate(data);
  };

  const transactionType = watch('transactionType');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productId">Product *</Label>
            <Select onValueChange={(value) => setValue('productId', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {productsData?.products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId && (
              <p className="text-sm text-red-600">Product is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type *</Label>
            <Select onValueChange={(value) => setValue('transactionType', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEIVE">Receive (Stock In)</SelectItem>
                <SelectItem value="ISSUE">Issue (Stock Out)</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              </SelectContent>
            </Select>
            {errors.transactionType && (
              <p className="text-sm text-red-600">Transaction type is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity *
              {transactionType === 'ADJUSTMENT' && (
                <span className="text-sm text-gray-500 ml-2">
                  (Use negative values to decrease stock)
                </span>
              )}
            </Label>
            <Input
              id="quantity"
              type="number"
              {...register('quantity', { 
                required: 'Quantity is required',
                valueAsNumber: true,
                validate: (value) => {
                  if (transactionType === 'RECEIVE' && value <= 0) {
                    return 'Receive quantity must be positive';
                  }
                  if (transactionType === 'ISSUE' && value <= 0) {
                    return 'Issue quantity must be positive';
                  }
                  if (value === 0) {
                    return 'Quantity cannot be zero';
                  }
                  return true;
                }
              })}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>

          {transactionType === 'ISSUE' && (
            <div className="space-y-2">
              <Label htmlFor="staffId">Issued To (Staff Member)</Label>
              <Select onValueChange={(value) => setValue('staffId', value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {staffData?.staff.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.firstName} {member.lastName} ({member.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              {...register('referenceNumber')}
              placeholder="e.g., PO-001, INV-123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="createdBy">Created By</Label>
            <Input
              id="createdBy"
              {...register('createdBy')}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this transaction"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              Create Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
