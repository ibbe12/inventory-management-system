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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { ProductWithInventory } from '~backend/inventory/types';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductWithInventory | null;
}

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  unitPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
}

export default function ProductForm({ isOpen, onClose, product }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>();

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => backend.inventory.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      onClose();
      reset();
    },
    onError: (error) => {
      console.error('Create product error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create product',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => 
      backend.inventory.updateProduct({ id: product!.id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      onClose();
      reset();
    },
    onError: (error) => {
      console.error('Update product error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        category: product.category || '',
        unitOfMeasure: product.unitOfMeasure,
        unitPrice: product.unitPrice,
        reorderLevel: product.reorderLevel,
        maxStockLevel: product.maxStockLevel || 0,
      });
    } else {
      reset({
        name: '',
        description: '',
        sku: '',
        category: '',
        unitOfMeasure: '',
        unitPrice: 0,
        reorderLevel: 0,
        maxStockLevel: 0,
      });
    }
  }, [product, reset]);

  const onSubmit = (data: ProductFormData) => {
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
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Product name is required' })}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register('sku', { required: 'SKU is required' })}
                placeholder="Enter SKU"
              />
              {errors.sku && (
                <p className="text-sm text-red-600">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="Enter category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
              <Input
                id="unitOfMeasure"
                {...register('unitOfMeasure', { required: 'Unit of measure is required' })}
                placeholder="e.g., pieces, kg, liters"
              />
              {errors.unitOfMeasure && (
                <p className="text-sm text-red-600">{errors.unitOfMeasure.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                {...register('unitPrice', { 
                  required: 'Unit price is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Price must be positive' }
                })}
                placeholder="0.00"
              />
              {errors.unitPrice && (
                <p className="text-sm text-red-600">{errors.unitPrice.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                {...register('reorderLevel', { 
                  required: 'Reorder level is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Reorder level must be positive' }
                })}
                placeholder="0"
              />
              {errors.reorderLevel && (
                <p className="text-sm text-red-600">{errors.reorderLevel.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStockLevel">Max Stock Level</Label>
              <Input
                id="maxStockLevel"
                type="number"
                min="0"
                {...register('maxStockLevel', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Max stock level must be positive' }
                })}
                placeholder="0"
              />
              {errors.maxStockLevel && (
                <p className="text-sm text-red-600">{errors.maxStockLevel.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
