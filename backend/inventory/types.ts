export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category?: string;
  unitOfMeasure: string;
  unitPrice: number;
  reorderLevel: number;
  maxStockLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: number;
  productId: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastUpdated: Date;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  transactionType: 'RECEIVE' | 'ISSUE' | 'ADJUSTMENT';
  quantity: number;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface Asset {
  id: number;
  assetTag: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DISPOSED';
  assignedTo?: string;
  warrantyExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetMaintenance {
  id: number;
  assetId: number;
  maintenanceType: string;
  description?: string;
  cost?: number;
  performedDate: Date;
  performedBy?: string;
  nextDueDate?: Date;
  createdAt: Date;
}

export interface ProductWithInventory extends Product {
  inventory?: Inventory;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categories: { category: string; count: number; value: number }[];
}

export interface AssetReport {
  totalAssets: number;
  totalValue: number;
  activeAssets: number;
  maintenanceAssets: number;
  categories: { category: string; count: number; value: number }[];
}
