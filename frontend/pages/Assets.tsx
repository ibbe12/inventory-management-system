import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Wrench } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AssetForm from '../components/AssetForm';
import MaintenanceForm from '../components/MaintenanceForm';
import { formatCurrency, formatDate } from '../utils/format';
import type { Asset } from '~backend/inventory/types';

export default function Assets() {
  const [isAssetFormOpen, setIsAssetFormOpen] = useState(false);
  const [isMaintenanceFormOpen, setIsMaintenanceFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => backend.inventory.listAssets(),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id: number) => backend.inventory.deleteAsset({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({
        title: 'Success',
        description: 'Asset deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Delete asset error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete asset',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAssetFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const handleMaintenance = (assetId: number) => {
    setSelectedAssetId(assetId);
    setIsMaintenanceFormOpen(true);
  };

  const handleAssetFormClose = () => {
    setIsAssetFormOpen(false);
    setEditingAsset(null);
  };

  const handleMaintenanceFormClose = () => {
    setIsMaintenanceFormOpen(false);
    setSelectedAssetId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DISPOSED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading assets...</div>
      </div>
    );
  }

  const assets = assetsData?.assets || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your organization's assets and maintenance records
          </p>
        </div>
        <Button onClick={() => setIsAssetFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <Card key={asset.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{asset.name}</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tag: {asset.assetTag}
                  </p>
                  {asset.category && (
                    <Badge variant="secondary" className="text-xs">
                      {asset.category}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMaintenance(asset.id)}
                    title="Add Maintenance"
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(asset)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {asset.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <Badge className={getStatusColor(asset.status)}>
                  {asset.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {asset.brand && (
                  <div>
                    <span className="text-gray-500">Brand:</span>
                    <div className="font-medium">{asset.brand}</div>
                  </div>
                )}
                {asset.model && (
                  <div>
                    <span className="text-gray-500">Model:</span>
                    <div className="font-medium">{asset.model}</div>
                  </div>
                )}
                {asset.serialNumber && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Serial:</span>
                    <div className="font-medium">{asset.serialNumber}</div>
                  </div>
                )}
              </div>

              {asset.location && (
                <div>
                  <span className="text-sm text-gray-500">Location:</span>
                  <div className="text-sm font-medium">{asset.location}</div>
                </div>
              )}

              {asset.assignedTo && (
                <div>
                  <span className="text-sm text-gray-500">Assigned to:</span>
                  <div className="text-sm font-medium">{asset.assignedTo}</div>
                </div>
              )}

              {asset.currentValue && (
                <div>
                  <span className="text-sm text-gray-500">Current Value:</span>
                  <div className="text-sm font-medium">{formatCurrency(asset.currentValue)}</div>
                </div>
              )}

              {asset.warrantyExpiry && (
                <div>
                  <span className="text-sm text-gray-500">Warranty Expires:</span>
                  <div className="text-sm font-medium">{formatDate(asset.warrantyExpiry)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {assets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Get started by adding your first asset to track.
            </p>
            <Button onClick={() => setIsAssetFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </CardContent>
        </Card>
      )}

      <AssetForm
        isOpen={isAssetFormOpen}
        onClose={handleAssetFormClose}
        asset={editingAsset}
      />

      <MaintenanceForm
        isOpen={isMaintenanceFormOpen}
        onClose={handleMaintenanceFormClose}
        assetId={selectedAssetId}
      />
    </div>
  );
}
