import { api, APIError } from "encore.dev/api";
import { inventoryDB } from "./db";
import type { Asset, AssetMaintenance } from "./types";

export interface CreateAssetRequest {
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
}

export interface UpdateAssetRequest {
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
}

export interface CreateMaintenanceRequest {
  assetId: number;
  maintenanceType: string;
  description?: string;
  cost?: number;
  performedDate: Date;
  performedBy?: string;
  nextDueDate?: Date;
}

export interface ListAssetsResponse {
  assets: Asset[];
}

export interface ListMaintenanceResponse {
  maintenance: AssetMaintenance[];
}

// Creates a new asset.
export const createAsset = api<CreateAssetRequest, Asset>(
  { expose: true, method: "POST", path: "/assets" },
  async (req) => {
    try {
      const asset = await inventoryDB.queryRow<Asset>`
        INSERT INTO assets (asset_tag, name, description, category, brand, model, serial_number, 
                           purchase_date, purchase_price, current_value, location, status, assigned_to, warranty_expiry)
        VALUES (${req.assetTag}, ${req.name}, ${req.description}, ${req.category}, ${req.brand}, ${req.model}, 
                ${req.serialNumber}, ${req.purchaseDate}, ${req.purchasePrice}, ${req.currentValue}, 
                ${req.location}, ${req.status}, ${req.assignedTo}, ${req.warrantyExpiry})
        RETURNING id, asset_tag as "assetTag", name, description, category, brand, model, 
                  serial_number as "serialNumber", purchase_date as "purchaseDate", 
                  purchase_price as "purchasePrice", current_value as "currentValue", 
                  location, status, assigned_to as "assignedTo", warranty_expiry as "warrantyExpiry",
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!asset) {
        throw APIError.internal("Failed to create asset");
      }

      return asset;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw APIError.alreadyExists("Asset with this tag already exists");
      }
      throw APIError.internal("Failed to create asset", error);
    }
  }
);

// Retrieves all assets.
export const listAssets = api<void, ListAssetsResponse>(
  { expose: true, method: "GET", path: "/assets" },
  async () => {
    const assets = await inventoryDB.queryAll<Asset>`
      SELECT id, asset_tag as "assetTag", name, description, category, brand, model, 
             serial_number as "serialNumber", purchase_date as "purchaseDate", 
             purchase_price as "purchasePrice", current_value as "currentValue", 
             location, status, assigned_to as "assignedTo", warranty_expiry as "warrantyExpiry",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM assets
      ORDER BY name
    `;

    return { assets };
  }
);

// Retrieves a single asset by ID.
export const getAsset = api<{ id: number }, Asset>(
  { expose: true, method: "GET", path: "/assets/:id" },
  async ({ id }) => {
    const asset = await inventoryDB.queryRow<Asset>`
      SELECT id, asset_tag as "assetTag", name, description, category, brand, model, 
             serial_number as "serialNumber", purchase_date as "purchaseDate", 
             purchase_price as "purchasePrice", current_value as "currentValue", 
             location, status, assigned_to as "assignedTo", warranty_expiry as "warrantyExpiry",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM assets 
      WHERE id = ${id}
    `;

    if (!asset) {
      throw APIError.notFound("Asset not found");
    }

    return asset;
  }
);

// Updates an existing asset.
export const updateAsset = api<UpdateAssetRequest, Asset>(
  { expose: true, method: "PUT", path: "/assets/:id" },
  async (req) => {
    try {
      const asset = await inventoryDB.queryRow<Asset>`
        UPDATE assets 
        SET asset_tag = ${req.assetTag}, name = ${req.name}, description = ${req.description}, 
            category = ${req.category}, brand = ${req.brand}, model = ${req.model}, 
            serial_number = ${req.serialNumber}, purchase_date = ${req.purchaseDate}, 
            purchase_price = ${req.purchasePrice}, current_value = ${req.currentValue}, 
            location = ${req.location}, status = ${req.status}, assigned_to = ${req.assignedTo}, 
            warranty_expiry = ${req.warrantyExpiry}, updated_at = NOW()
        WHERE id = ${req.id}
        RETURNING id, asset_tag as "assetTag", name, description, category, brand, model, 
                  serial_number as "serialNumber", purchase_date as "purchaseDate", 
                  purchase_price as "purchasePrice", current_value as "currentValue", 
                  location, status, assigned_to as "assignedTo", warranty_expiry as "warrantyExpiry",
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!asset) {
        throw APIError.notFound("Asset not found");
      }

      return asset;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw APIError.alreadyExists("Asset with this tag already exists");
      }
      throw APIError.internal("Failed to update asset", error);
    }
  }
);

// Deletes an asset.
export const deleteAsset = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/assets/:id" },
  async ({ id }) => {
    const result = await inventoryDB.queryRow`
      DELETE FROM assets WHERE id = ${id} RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("Asset not found");
    }
  }
);

// Creates a new maintenance record for an asset.
export const createMaintenance = api<CreateMaintenanceRequest, AssetMaintenance>(
  { expose: true, method: "POST", path: "/assets/maintenance" },
  async (req) => {
    // Verify asset exists
    const asset = await inventoryDB.queryRow`
      SELECT id FROM assets WHERE id = ${req.assetId}
    `;
    
    if (!asset) {
      throw APIError.notFound("Asset not found");
    }

    const maintenance = await inventoryDB.queryRow<AssetMaintenance>`
      INSERT INTO asset_maintenance (asset_id, maintenance_type, description, cost, performed_date, performed_by, next_due_date)
      VALUES (${req.assetId}, ${req.maintenanceType}, ${req.description}, ${req.cost}, ${req.performedDate}, ${req.performedBy}, ${req.nextDueDate})
      RETURNING id, asset_id as "assetId", maintenance_type as "maintenanceType", 
                description, cost, performed_date as "performedDate", 
                performed_by as "performedBy", next_due_date as "nextDueDate", 
                created_at as "createdAt"
    `;

    if (!maintenance) {
      throw APIError.internal("Failed to create maintenance record");
    }

    return maintenance;
  }
);

// Retrieves maintenance records for a specific asset.
export const getAssetMaintenance = api<{ assetId: number }, ListMaintenanceResponse>(
  { expose: true, method: "GET", path: "/assets/:assetId/maintenance" },
  async ({ assetId }) => {
    const maintenance = await inventoryDB.queryAll<AssetMaintenance>`
      SELECT id, asset_id as "assetId", maintenance_type as "maintenanceType", 
             description, cost, performed_date as "performedDate", 
             performed_by as "performedBy", next_due_date as "nextDueDate", 
             created_at as "createdAt"
      FROM asset_maintenance
      WHERE asset_id = ${assetId}
      ORDER BY performed_date DESC
    `;

    return { maintenance };
  }
);
