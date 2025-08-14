import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TransactionForm from '../components/TransactionForm';
import { formatDate } from '../utils/format';
import type { InventoryTransaction } from '~backend/inventory/types';

export default function Transactions() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => backend.inventory.listTransactions(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => backend.inventory.listProducts(),
  });

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'ISSUE':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'RECEIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'ISSUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getProductName = (productId: number) => {
    const product = productsData?.products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : `Product ID: ${productId}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading transactions...</div>
      </div>
    );
  }

  const transactions = transactionsData?.transactions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track inventory movements and adjustments
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(transaction.transactionType)}
                    <Badge className={getTransactionColor(transaction.transactionType)}>
                      {transaction.transactionType}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getProductName(transaction.productId)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {transaction.transactionType === 'ISSUE' ? '-' : '+'}
                    {Math.abs(transaction.quantity)}
                  </div>
                  {transaction.referenceNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ref: {transaction.referenceNumber}
                    </p>
                  )}
                </div>
              </div>

              {transaction.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Notes:</strong> {transaction.notes}
                  </p>
                </div>
              )}

              {transaction.createdBy && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    Created by: {transaction.createdBy}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ArrowUp className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Start tracking inventory movements by creating your first transaction.
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </CardContent>
        </Card>
      )}

      <TransactionForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
      />
    </div>
  );
}
