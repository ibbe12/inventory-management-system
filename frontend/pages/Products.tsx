import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProductForm from '../components/ProductForm';
import { formatCurrency } from '../utils/format';
import type { ProductWithInventory } from '~backend/inventory/types';

export default function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithInventory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => backend.inventory.listProducts(),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => backend.inventory.deleteProduct({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Delete product error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (product: ProductWithInventory) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const getStockStatus = (product: ProductWithInventory) => {
    if (!product.inventory) return { status: 'unknown', color: 'gray' };
    
    const { quantityOnHand } = product.inventory;
    const { reorderLevel } = product;

    if (quantityOnHand === 0) {
      return { status: 'Out of Stock', color: 'red' };
    } else if (quantityOnHand <= reorderLevel) {
      return { status: 'Low Stock', color: 'yellow' };
    } else {
      return { status: 'In Stock', color: 'green' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  const products = productsData?.products || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your product catalog and inventory levels
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const stockStatus = getStockStatus(product);
          
          return (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      SKU: {product.sku}
                    </p>
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {product.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <div className="font-medium">{formatCurrency(product.unitPrice)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <div className="font-medium">{product.unitOfMeasure}</div>
                  </div>
                </div>

                {product.inventory && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Stock Status:</span>
                      <Badge 
                        variant={stockStatus.color === 'red' ? 'destructive' : 
                               stockStatus.color === 'yellow' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {stockStatus.status === 'Low Stock' && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {stockStatus.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">On Hand:</span>
                        <div className="font-medium">{product.inventory.quantityOnHand}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Available:</span>
                        <div className="font-medium">{product.inventory.quantityAvailable}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Reorder:</span>
                        <div className="font-medium">{product.reorderLevel}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Get started by adding your first product to the inventory.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </CardContent>
        </Card>
      )}

      <ProductForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        product={editingProduct}
      />
    </div>
  );
}
