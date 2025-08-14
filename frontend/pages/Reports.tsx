import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import backend from '~backend/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Wrench
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { data: inventoryReport } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: () => backend.inventory.getInventoryReport(),
  });

  const { data: assetReport } = useQuery({
    queryKey: ['asset-report'],
    queryFn: () => backend.inventory.getAssetReport(),
  });

  const { data: lowStockReport } = useQuery({
    queryKey: ['low-stock-report'],
    queryFn: () => backend.inventory.getLowStockReport(),
  });

  const { data: transactionReport } = useQuery({
    queryKey: ['transaction-report', dateRange.startDate, dateRange.endDate],
    queryFn: () => backend.inventory.getTransactionReport({
      startDate: dateRange.startDate || undefined,
      endDate: dateRange.endDate || undefined
    }),
  });

  const { data: maintenanceReport } = useQuery({
    queryKey: ['maintenance-report'],
    queryFn: () => backend.inventory.getMaintenanceReport(),
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate and export various inventory and asset reports
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryReport?.totalValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(assetReport?.totalValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {lowStockReport?.products.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactionReport?.transactions.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Low Stock Report
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(lowStockReport?.products || [], 'low-stock-report')}
            disabled={!lowStockReport?.products.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {lowStockReport?.products.length ? (
            <div className="space-y-2">
              {lowStockReport.products.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    {product.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="text-red-600 font-medium">{product.quantityOnHand}</span>
                      <span className="text-gray-500"> / {product.reorderLevel}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Value: {formatCurrency(product.unitPrice * product.quantityOnHand)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No low stock items found</p>
          )}
        </CardContent>
      </Card>

      {/* Transaction Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transaction Report
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="text-sm">From:</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-sm">To:</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-auto"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(transactionReport?.transactions || [], 'transaction-report')}
              disabled={!transactionReport?.transactions.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactionReport?.transactions.length ? (
            <div className="space-y-2">
              {transactionReport.transactions.slice(0, 10).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{transaction.productName}</div>
                    <div className="text-sm text-gray-500">SKU: {transaction.productSku}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={transaction.transactionType === 'RECEIVE' ? 'default' : 
                              transaction.transactionType === 'ISSUE' ? 'destructive' : 'secondary'}
                    >
                      {transaction.transactionType}
                    </Badge>
                    <div className="text-sm font-medium mt-1">
                      {transaction.transactionType === 'ISSUE' ? '-' : '+'}
                      {Math.abs(transaction.quantity)}
                    </div>
                  </div>
                </div>
              ))}
              {transactionReport.transactions.length > 10 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  And {transactionReport.transactions.length - 10} more transactions...
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No transactions found for the selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Report
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(maintenanceReport?.maintenance || [], 'maintenance-report')}
            disabled={!maintenanceReport?.maintenance.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {maintenanceReport?.maintenance.length ? (
            <div className="space-y-2">
              {maintenanceReport.maintenance.slice(0, 10).map((maintenance: any) => (
                <div key={maintenance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{maintenance.assetName}</div>
                    <div className="text-sm text-gray-500">Tag: {maintenance.assetTag}</div>
                    <div className="text-sm">{maintenance.maintenanceType}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(maintenance.performedDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    {maintenance.cost && (
                      <div className="font-medium">{formatCurrency(maintenance.cost)}</div>
                    )}
                    {maintenance.performedBy && (
                      <div className="text-sm text-gray-500">By: {maintenance.performedBy}</div>
                    )}
                  </div>
                </div>
              ))}
              {maintenanceReport.maintenance.length > 10 && (
                <p className="text-center text-sm text-gray-500 pt-2">
                  And {maintenanceReport.maintenance.length - 10} more maintenance records...
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No maintenance records found</p>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventoryReport?.categories.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{category.category}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{category.count} items</div>
                    <div className="font-medium">{formatCurrency(category.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assetReport?.categories.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{category.category}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{category.count} assets</div>
                    <div className="font-medium">{formatCurrency(category.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
